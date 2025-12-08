import { GoogleAuth } from "google-auth-library";

const defaultTextModel = "gemini-3-pro-preview";
const defaultImageModel = "gemini-3-pro-image-preview";
const location = process.env.VERTEX_LOCATION || "global";

const projectId = process.env.GCLOUD_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;

if (!projectId) {
  throw new Error("GCLOUD_PROJECT_ID ou FIREBASE_PROJECT_ID não definido.");
}

function getAuth() {
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey) {
    throw new Error("Credenciais Firebase Admin em falta para Vertex AI.");
  }

  return new GoogleAuth({
    credentials: { client_email: clientEmail, private_key: privateKey },
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });
}

function getEndpoint(modelId: string) {
  const baseUrl = location === "global" ? "https://aiplatform.googleapis.com" : `https://${location}-aiplatform.googleapis.com`;
  return `${baseUrl}/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:generateContent`;
}

class VertexModel {
  private modelId: string;
  private temperature: number;

  constructor(modelId: string, temperature = 0.8) {
    this.modelId = modelId;
    this.temperature = temperature;
  }

  async generateContent(
    promptOrRequest:
      | string
      | { contents: Array<{ role: string; parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> }> }
  ) {
    const auth = getAuth();
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();

    const contents =
      typeof promptOrRequest === "string"
        ? [{ role: "user", parts: [{ text: promptOrRequest }] }]
        : promptOrRequest.contents;

    const body = {
      contents,
      generationConfig: { temperature: this.temperature, topP: 0.95, maxOutputTokens: 32768 },
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
        Authorization: `Bearer ${accessToken.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Vertex AI error ${response.status}: ${text}`);
    }

    const data = await response.json();
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
  return new VertexModel(modelId, 0.6);
}

