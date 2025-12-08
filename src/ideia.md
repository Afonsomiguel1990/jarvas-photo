Sei que estavamos a fazer outra coisa, mas mudei de ideias e quero perceber se podemos aproveitar algumas coisas que ja temos definidas aqui para criar a minha nova ideia.

A minha ideia é uma app que utilize o Nano Banana Pro Gemini-3-pro-image que ja usamos aqui, para melhorar imagens. a ideia era o user poder usar a camara ou upload. e nós termos prompts especifico para cada caso. tinhamos um menu inicial com vários em que o user podia por "favoritos" e basicamente usavamos o mesmo sistema de creditos. mas era só isto. um login, antes do login o user podia experimentar um flow gratis com uma marca de agua. e ao entrar era uma cena para ver os creditos que tem. escolher o setor da foto, uopload, o nano fazia a cena dele e o user fazia download.

tem de dar para mobile e pc

os créditos não são subscrição, são comprados quantas vezes o user quiser.

image.png
- - - 
o plano:
Implementation Plan - Image Enhancer App
Goal Description
Pivot the current "Branda" social media generator into a specialized Image Enhancer app. The app will use Replicate (specifically the seedstream/nanobanana model or equivalent "Pro Image" model) to enhance user-uploaded photos based on specific sectors (Real Estate, Food, Fashion, etc.). It will feature a Freemium workflow:

Guest: Can enhance images but results are watermarked.
Logged In: Can enhance images using Credits (no watermark).
User Review Required
NOTE

Gemini / Nano Banana: Proceeding with gemini-3-pro-image-preview as the "Nano Banana Pro" model.

Proposed Changes
Core Logic & API
[NEW] src/app/api/enhance/route.ts
Implement POST endpoint.
Inputs: image (base64), sector (string), isTrial (boolean).
Logic:
Authenticate user (optional for trial).
If NOT trial: Check & Consume Credits.
Call Vertex AI (Gemini) (gemini-3-pro-image-preview) via src/lib/vertex:
Construct multimodal prompt: [ { text: "Enhance this image for sector..." }, { inlineData: { data: base64, mimeType: ... } } ].
If Trial: Apply watermark to the output image using sharp.
Save result to Firebase Storage (or return direct URL if transient).
Return: originalUrl, enhancedUrl.
[MODIFY] 

src/lib/vertex/index.ts
Ensure 

VertexModel
 wrapper correctly handles mixed content (text + inlineData) if not already capable. (Current check shows it passes contents through).
UI / Frontend
[MODIFY] 

src/app/page.tsx
 (Landing)
Replace current dashboard with valid Landing Page.
Show "Favorites" / "Sectors" grid (Real Estate, Food, Fashion).
"Try for Free" wrapper.
[NEW] src/app/enhance/page.tsx
Upload component (Drag & Drop).
"Processing" state (Nano Banana animation?).
Result View:
Before/After comparison slider (using a library or custom).
Download Button (disabled/watermarked if trial).
"Login to Remove Watermark" CTA for trial users.
Dependencies
npm install sharp (for backend watermarking)
npm install react-compare-slider (for UI comparison)
Verification Plan
Manual Verification
Trial Flow:
Open Incognito window.
Go to /.
Select "Real Estate".
Upload a photo.
Verify "Processing" state.
Verify Result: Image is enhanced AND has a watermark.
Auth Flow:
Login with Google.
Go to /.
Select "Real Estate".
Upload same photo.
Verify Result: Image is enhanced AND has NOT watermark.
Verify Credits: Credit count decreased by 1.

---

