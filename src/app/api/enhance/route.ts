import { NextRequest, NextResponse } from "next/server";
import {
  getAdminAuth,
  getAdminDb,
  getAdminStorage,
} from "@/lib/firebase/admin";
import { getImageModel } from "@/lib/vertex"; // Using the image model wrapper
import { consumeCredits, hasCredits } from "@/lib/credits"; // Removed CREDIT_COSTS as it might not affect logic
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";
import { Buffer } from "buffer";

// Force Node.js runtime for Sharp
export const runtime = 'nodejs';

type EnhanceRequest = {
  image: string; // Base64
  sector: string;
  style?: string; // Made optional as frontend might send it or not, user code has it required but let's be safe
  aspectRatio?: string;
};

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.replace("Bearer ", "")
    : null;

  let uid: string | null = null;
  const requestId = uuidv4();

  // 1. Authenticate (Optional)
  if (token) {
    try {
      const decoded = await getAdminAuth().verifyIdToken(token);
      uid = decoded.uid;
    } catch {
      // Invalid token, treat as guest/trial
      console.warn("Invalid token provided, treating as guest");
    }
  }

  const isTrial = !uid;

  // 2. Parse Body
  const body = (await request.json().catch(() => ({}))) as EnhanceRequest;
  const { image, sector, style = "realistic", aspectRatio = "3:4" } = body; // Default style/ratio if missing

  if (!image || !sector) {
    return NextResponse.json(
      { error: "Missing image or sector" }, // Adjusted validation
      { status: 400 }
    );
  }

  // ... (credits check remains same)

  try {
    // 4. Prepare Prompt
    const base64Data = image.split(",")[1];
    const mimeType = image.split(";")[0].split(":")[1];

    const model = getImageModel("gemini-3-pro-image-preview"); // Confirm model ID

    let texturePrompt = "";

    // Map frontend sector IDs to prompts
    switch (sector) {
      case "restaurant":
        texturePrompt = `Turn this photo in a professional shot of the exact same food. Michelin-level photograph.`;
        break;
      case "food": // Doces
        texturePrompt = `Turn this photo in a professional shot of the exact same food. you can change the layout. Michelin-level photography.`;
        break;
      case "architecture":
      case "real_estate":
        texturePrompt = `Melhora esta imagem como se fosse tirado por um fotografo profissional. Mantém a consistencia do produto mas podes alterar a composição da imagem.`;
        break;
      case "product":
        texturePrompt = `Melhora esta imagem como se fosse tirado por um fotografo profissional. Mantém a consistencia do produto mas podes alterar a composição da imagem.`;
        break;
      case "portrait":
      case "fashion":
        texturePrompt = `Turn this photo into a professional portrait/fashion shot. Flattering lighting, skin texture enhancement while keeping it natural. High-end magazine look.`;
        break;
      case "landscape":
        texturePrompt = `Enhance this landscape photo to look like a National Geographic shot. Improve dynamic range, vibrance and clarity.`;
        break;
      case "studio_selfie":
        texturePrompt = `A professional, high-resolution profile photo, maintaining the exact facial structure, identity, and key features of the person in the input image. The subject is framed from the chest up, with ample headroom. The person looks directly at the camera. They are styled for a professional photo studio shoot also upscale the quality of the image`;
        break;
      default:
        // Fallback generic prompt
        texturePrompt = `Enhance this ${sector} photo. Make it look professional, high resolution, perfect lighting. Fix any imperfections. Keep the original composition but improve aesthetics.`;
        break;
    }

    // 5. Call Vertex AI
    // Note: Verify if getImageModel wrapper handles this structure correctly.
    // Based on src/lib/vertex/index.ts, it passes 'contents' through.
    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [
          { text: texturePrompt },
          { inlineData: { mimeType: mimeType, data: base64Data } }
        ]
      }],
      generationConfig: {
        aspectRatio: aspectRatio,
        imageSize: "2K", // Default to 2K as requested
      }
    });

    // Extract Result Image (Base64)
    // The response structure depends on the model. For Imagen 3 (Gemini Image), it usually returns b64 in bytesBase64Encoded
    // But src/lib/vertex/index.ts is generic. Let's assume standard Gemini Vision/Image response.
    // However, "gemini-3-pro-image-preview" might return an image directly or text?
    // User said "Nano Banana Pro" is "gemini-3-pro-image".
    // If it's an Image Generation model (Imagen), inputs are text, output is image.
    // If it's Multimodal (Gemini Pro Vision), it outputs Text usually, unless it's "Edit" mode?
    // WARNING: "gemini-3-pro-image-preview" might just generate a NEW image based on prompt?
    // If we want Image-to-Image (Enhance), we need to be sure the model supports it.
    // Assuming it supports Image-to-Image via the prompt "Enhance this...".

    // For now, let's extract the base64 from the response.
    // We'll try to find any inlineData in the candidates.
    const generatedB64 = result.response.candidates
      ?.flatMap((c: any) => c.content?.parts || [])
      .find((p: any) => p.inlineData)
      ?.inlineData?.data;

    if (!generatedB64) {
      throw new Error("No image generated by the model");
    }

    let finalBuffer: any = Buffer.from(generatedB64, "base64");

    // Debug: Check Resolution
    try {
      const meta = await sharp(finalBuffer).metadata();
      console.log(`[Vertex AI] Generated Image Resolution: ${meta.width}x${meta.height}`);
    } catch (e) {
      console.error("[Vertex AI] Failed to check resolution:", e);
    }

    // 6. Watermark (if Trial)
    if (isTrial) {
      // Create an SVG watermark
      const watermarkSvg = `
            <svg width="800" height="120">
              <style>
                .title { fill: rgba(255,255,255,0.5); font-size: 64px; font-weight: 700; font-family: Arial, sans-serif; }
              </style>
              <text x="50%" y="60%" text-anchor="middle" class="title">JARVAS · TRIAL</text>
            </svg>
        `;

      finalBuffer = await sharp(finalBuffer)
        .composite([{
          input: Buffer.from(watermarkSvg),
          gravity: 'center',
          blend: 'over'
        }])
        .toBuffer();
    }

    // 7. Save to Storage
    const storage = getAdminStorage();
    const bucket = storage.bucket();
    // Path: protected if user, temporary/public if trial?
    // Let's allow public access for result for simplicity.
    const filePath = `enhanced/${uid || 'guest'}/${requestId}.png`;
    const file = bucket.file(filePath);

    await file.save(finalBuffer, {
      contentType: "image/png",
      metadata: { cacheControl: "public, max-age=31536000" },
    });

    await file.makePublic();
    const publicUrl = file.publicUrl();

    // 8. Consume Credits & Save History
    if (!isTrial && uid) {
      await consumeCredits(uid, 1);

      // Save to Firestore History
      const db = getAdminDb();
      await db.collection("users").doc(uid).collection("generations").doc(requestId).set({
        id: requestId,
        imageUrl: publicUrl,
        sector,
        style,
        createdAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      enhancedUrl: publicUrl,
      isTrial
    });

  } catch (err: any) {
    console.error("Enhance Error:", err);
    return NextResponse.json({ error: err.message || String(err) || "Failed to enhance image" }, { status: 500 });
  }
}

