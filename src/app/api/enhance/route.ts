import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb, getAdminStorage } from "@/lib/firebase/admin";
import { getImageModel } from "@/lib/vertex";
import { hasCredits, consumeCredits } from "@/lib/credits";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";
import { Buffer } from "buffer";

export const runtime = "nodejs";

type EnhanceRequest = {
  image: string;
  sector: string;
};

const prompts: Record<string, string> = {
  food: "Transforma em fotografia Michelin do mesmo prato. Ajusta luz e styling.",
  real_estate: "Transforma em fotografia imobiliária premium. Melhora iluminação e remove ruído.",
  architecture: "Transforma em fotografia arquitetónica de luxo. Mantém composição mas melhora luz e limpeza.",
  product: "Transforma em foto de produto para e-commerce. Fundo limpo, luz suave, foco nítido.",
  portrait: "Transforma em retrato editorial. Pele natural, contraste suave, luz equilibrada.",
  fashion: "Transforma em editorial de moda. Destaque textura, luz premium, tom cinematográfico.",
  landscape: "Melhora paisagem estilo National Geographic. Alcance dinâmico e nitidez.",
};

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.replace("Bearer ", "") : null;

  let uid: string | null = null;
  if (token) {
    try {
      const decoded = await getAdminAuth().verifyIdToken(token);
      uid = decoded.uid;
    } catch (err) {
      console.warn("Token inválido, prosseguir como trial", err);
    }
  }

  const isTrial = !uid;
  const body = (await request.json().catch(() => ({}))) as EnhanceRequest;
  const { image, sector } = body;

  if (!image || !sector) {
    return NextResponse.json({ error: "Falta image ou sector" }, { status: 400 });
  }

  if (!isTrial && uid) {
    const has = await hasCredits(uid, 1);
    if (!has) {
      return NextResponse.json({ error: "Créditos insuficientes." }, { status: 402 });
    }
  }

  try {
    const base64Data = image.split(",")[1];
    const mimeType = image.split(";")[0].split(":")[1];
    const texturePrompt =
      prompts[sector] || `Melhora esta foto para ${sector}. Iluminação premium, remoção de ruído e nitidez.`;

    const model = getImageModel("gemini-3-pro-image-preview");
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { text: texturePrompt },
            { inlineData: { mimeType, data: base64Data } },
          ],
        },
      ],
    });

    type Candidate = { content?: { parts?: Array<{ inlineData?: { data?: string } }> } };
    const generatedB64 = result.response.candidates
      ?.flatMap((c: Candidate) => c.content?.parts || [])
      .find((p) => p.inlineData)?.inlineData?.data;

    if (!generatedB64) {
      throw new Error("Modelo não devolveu imagem");
    }

    let finalBuffer = Buffer.from(generatedB64, "base64");

    if (isTrial) {
      const watermarkSvg = `
        <svg width="800" height="120">
          <style>
            .title { fill: rgba(255,255,255,0.5); font-size: 64px; font-weight: 700; font-family: Arial, sans-serif; }
          </style>
          <text x="50%" y="60%" text-anchor="middle" class="title">JARVAS · TRIAL</text>
        </svg>
      `;

      finalBuffer = await sharp(finalBuffer)
        .composite([{ input: Buffer.from(watermarkSvg), gravity: "center", blend: "over" }])
        .toBuffer();
    }

    const storage = getAdminStorage();
    const bucket = storage.bucket();
    const requestId = uuidv4();
    const filePath = `enhanced/${uid || "guest"}/${requestId}.png`;
    const file = bucket.file(filePath);

    await file.save(finalBuffer, {
      contentType: "image/png",
      metadata: { cacheControl: "public, max-age=31536000" },
    });
    await file.makePublic();
    const publicUrl = file.publicUrl();

    if (!isTrial && uid) {
      await consumeCredits(uid, 1);
      const db = getAdminDb();
      await db.collection("users").doc(uid).collection("generations").doc(requestId).set({
        id: requestId,
        imageUrl: publicUrl,
        sector,
        createdAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({ enhancedUrl: publicUrl, isTrial });
  } catch (err) {
    console.error("Enhance error", err);
    return NextResponse.json({ error: "Falha ao melhorar imagem" }, { status: 500 });
  }
}

