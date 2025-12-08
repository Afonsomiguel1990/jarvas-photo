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

