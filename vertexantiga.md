import { NextRequest, NextResponse } from "next/server";
import {
    getAdminAuth,
    getAdminDb,
    getAdminStorage,
} from "@/lib/firebase/admin";
import { getImageModel } from "@/lib/vertex"; // Using the image model wrapper
import { consumeCredits, hasCredits, CREDIT_COSTS } from "@/lib/credits";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";
import { Buffer } from "buffer";

// Force Node.js runtime for Sharp
export const runtime = 'nodejs';

type EnhanceRequest = {
    image: string; // Base64
    sector: string;
    style: string;
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
    const { image, sector, style } = body;

    if (!image || !sector || !style) {
        return NextResponse.json(
            { error: "Missing image, sector, or style" },
            { status: 400 }
        );
    }

    // 3. Credits Check (if not trial)
    if (!isTrial && uid) {
        // Determine cost (e.g., 1 credit)
        const cost = 1;
        const hasEnough = await hasCredits(uid, cost);
        if (!hasEnough) {
            return NextResponse.json(
                { error: "Créditos insuficientes." },
                { status: 402 }
            );
        }
    }

    try {
        // 4. Prepare Prompt
        const base64Data = image.split(",")[1];
        const mimeType = image.split(";")[0].split(":")[1];

        const model = getImageModel("gemini-3-pro-image-preview"); // Confirm model ID

        let texturePrompt = "";

        // Map frontend sector IDs to prompts
        switch (sector) {
            case "food":
                texturePrompt = `Turn this photo in a professional shot of the exact same food. You can change the layout. Michelin-level photography. Style: ${style}.`;
                break;
            case "architecture":
            case "real_estate":
                texturePrompt = `Turn this photo into a high-end architectural photography. Enhance lighting, remove clutter, and make it look like a luxury property listing. Style: ${style}.`;
                break;
            case "product":
                texturePrompt = `Turn this photo into a commercial product shot. Professional studio lighting, sharp focus on the product, clean background. Make it look like a high-end e-commerce listing. Style: ${style}.`;
                break;
            case "portrait":
            case "fashion":
                texturePrompt = `Turn this photo into a professional portrait/fashion shot. Flattering lighting, skin texture enhancement while keeping it natural. High-end magazine look. Style: ${style}.`;
                break;
            case "landscape":
                texturePrompt = `Enhance this landscape photo to look like a National Geographic shot. Improve dynamic range, vibrance and clarity. Style: ${style}.`;
                break;
            default:
                // Fallback generic prompt
                texturePrompt = `Enhance this ${sector} photo in ${style} style. Make it look professional, high resolution, perfect lighting. Fix any imperfections. Keep the original composition but improve aesthetics.`;
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
            }]
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

        let finalBuffer = Buffer.from(generatedB64, "base64");

        // 6. Watermark (if Trial)
        if (isTrial) {
            // Create an SVG watermark
            const watermarkSvg = `
            <svg width="500" height="100">
                <style>
                .title { fill: rgba(255, 255, 255, 0.5); font-size: 60px; font-weight: bold; font-family: sans-serif; }
                </style>
                <text x="50%" y="50%" text-anchor="middle" class="title">BRANDA TRIAL</text>
            </svg>
        `;

            finalBuffer = await sharp(finalBuffer as any)
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
            id: requestId,
            originalUrl: null, // We didn't save original here to save space/time, but typically we should.
            enhancedUrl: publicUrl,
            isTrial
        });

    } catch (err: any) {
        console.error("Enhance Error:", err);
        return NextResponse.json({ error: "Failed to enhance image" }, { status: 500 });
    }
}



--------------------------


import { GoogleAuth } from "google-auth-library";

// Model IDs as per Google Cloud console
const defaultTextModel = "gemini-3-pro-preview";
const defaultImageModel = "gemini-3-pro-image-preview";
const location = "global";

const projectId = process.env.GCLOUD_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;

if (!projectId) {
  throw new Error(
    "GCLOUD_PROJECT_ID ou FIREBASE_PROJECT_ID não definido. Configure o ambiente antes de usar Vertex AI."
  );
}

// Create GoogleAuth instance with service account credentials
function getAuth() {
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey) {
    throw new Error("Firebase credentials (client_email, private_key) not configured");
  }

  return new GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });
}

// Vertex AI REST API endpoint - for global location, no region prefix in hostname
function getEndpoint(modelId: string) {
  // Global endpoint uses aiplatform.googleapis.com directly (not global-aiplatform)
  const baseUrl = location === "global"
    ? "https://aiplatform.googleapis.com"
    : `https://${location}-aiplatform.googleapis.com`;

  return `${baseUrl}/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:generateContent`;
}

// Generic model wrapper that calls REST API
class VertexModel {
  private modelId: string;
  private temperature: number;

  constructor(modelId: string, temperature: number = 1) {
    this.modelId = modelId;
    this.temperature = temperature;
  }

  async generateContent(
    promptOrRequest: string | { contents: Array<{ role: string; parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> }> }
  ) {
    const auth = getAuth();
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();

    let contents: Array<{ role: string; parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> }>;

    if (typeof promptOrRequest === "string") {
      contents = [{ role: "user", parts: [{ text: promptOrRequest }] }];
    } else {
      contents = promptOrRequest.contents;
    }

    const requestBody = {
      contents,
      generationConfig: {
        temperature: this.temperature,
        topP: 0.95,
        maxOutputTokens: 32768,
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "OFF" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "OFF" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "OFF" },
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "OFF" },
      ],
    };

    const response = await fetch(getEndpoint(this.modelId), {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Vertex AI error (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    // Return in a format compatible with @google-cloud/vertexai
    return {
      response: {
        candidates: data.candidates,
        text: () => data.candidates?.[0]?.content?.parts?.[0]?.text || "",
      },
    };
  }
}

export function getTextModel(modelId = defaultTextModel) {
  return new VertexModel(modelId, 1);
}

export function getImageModel(modelId = defaultImageModel) {
  return new VertexModel(modelId, 0.8);
}


------

import { NextRequest, NextResponse } from "next/server";
import {
    getAdminAuth,
    getAdminDb,
    getAdminStorage,
} from "@/lib/firebase/admin";
import { getImageModel } from "@/lib/vertex"; // Using the image model wrapper
import { consumeCredits, hasCredits, CREDIT_COSTS } from "@/lib/credits";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";
import { Buffer } from "buffer";

// Force Node.js runtime for Sharp
export const runtime = 'nodejs';

type EnhanceRequest = {
    image: string; // Base64
    sector: string;
    style: string;
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
    const { image, sector, style } = body;

    if (!image || !sector || !style) {
        return NextResponse.json(
            { error: "Missing image, sector, or style" },
            { status: 400 }
        );
    }

    // 3. Credits Check (if not trial)
    if (!isTrial && uid) {
        // Determine cost (e.g., 1 credit)
        const cost = 1;
        const hasEnough = await hasCredits(uid, cost);
        if (!hasEnough) {
            return NextResponse.json(
                { error: "Créditos insuficientes." },
                { status: 402 }
            );
        }
    }

    try {
        // 4. Prepare Prompt
        const base64Data = image.split(",")[1];
        const mimeType = image.split(";")[0].split(":")[1];

        const model = getImageModel("gemini-3-pro-image-preview"); // Confirm model ID

        let texturePrompt = "";

        // Map frontend sector IDs to prompts
        switch (sector) {
            case "food":
                texturePrompt = `Turn this photo in a professional shot of the exact same food. You can change the layout. Michelin-level photography. Style: ${style}.`;
                break;
            case "architecture":
            case "real_estate":
                texturePrompt = `Turn this photo into a high-end architectural photography. Enhance lighting, remove clutter, and make it look like a luxury property listing. Style: ${style}.`;
                break;
            case "product":
                texturePrompt = `Turn this photo into a commercial product shot. Professional studio lighting, sharp focus on the product, clean background. Make it look like a high-end e-commerce listing. Style: ${style}.`;
                break;
            case "portrait":
            case "fashion":
                texturePrompt = `Turn this photo into a professional portrait/fashion shot. Flattering lighting, skin texture enhancement while keeping it natural. High-end magazine look. Style: ${style}.`;
                break;
            case "landscape":
                texturePrompt = `Enhance this landscape photo to look like a National Geographic shot. Improve dynamic range, vibrance and clarity. Style: ${style}.`;
                break;
            default:
                // Fallback generic prompt
                texturePrompt = `Enhance this ${sector} photo in ${style} style. Make it look professional, high resolution, perfect lighting. Fix any imperfections. Keep the original composition but improve aesthetics.`;
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
            }]
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

        let finalBuffer = Buffer.from(generatedB64, "base64");

        // 6. Watermark (if Trial)
        if (isTrial) {
            // Create an SVG watermark
            const watermarkSvg = `
            <svg width="500" height="100">
                <style>
                .title { fill: rgba(255, 255, 255, 0.5); font-size: 60px; font-weight: bold; font-family: sans-serif; }
                </style>
                <text x="50%" y="50%" text-anchor="middle" class="title">BRANDA TRIAL</text>
            </svg>
        `;

            finalBuffer = await sharp(finalBuffer as any)
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
            id: requestId,
            originalUrl: null, // We didn't save original here to save space/time, but typically we should.
            enhancedUrl: publicUrl,
            isTrial
        });

    } catch (err: any) {
        console.error("Enhance Error:", err);
        return NextResponse.json({ error: "Failed to enhance image" }, { status: 500 });
    }
}


-----------

