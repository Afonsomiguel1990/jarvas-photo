Jarvas - Image Enhancer App
Visão Geral
App moderna e minimalista para melhorar imagens usando Gemini (gemini-3-pro-image-preview). Trial gratuito com watermark, login com Google, sistema de créditos (compra única).

---

1. Setup do Projeto
Estrutura Base
Next.js 14+ (App Router)
TypeScript
Tailwind CSS 4
shadcn/ui
Firebase (Auth + Firestore + Storage)
Stripe (créditos)
Vertex AI (Gemini)
Dependências Principais
framer-motion, react-dropzone, sharp, lucide-react, class-variance-authority
Ficheiro .env.local (estrutura)
# Firebase Client
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Vertex AI
GCLOUD_PROJECT_ID=
VERTEX_LOCATION=global
---

2. Arquitetura de Páginas
| Rota | Descrição | Acesso |

|------|-----------|--------|

| / | Landing page com comparador before/after | Público |

| /auth | Login com Google | Público |

| /app | Dashboard principal (escolher setor) | Autenticado |

| /app/enhance | Upload + Resultado | Autenticado ou Trial |

| /app/credits | Comprar créditos | Autenticado |

| /app/history | Histórico de gerações | Autenticado |

---

3. Design System
Landing Page (/)
Fundo: Gradiente estilo "Cosmic Nebula" (roxo/rosa) com noise
Hero: Título "Jarvas" + subtítulo + CTA "Experimentar Grátis"
Comparador: Slider before/after com imagens demo
Setores: Grid dos 6 setores disponíveis
Footer: Links e créditos
Auth (/auth)
Design dark com glassmorphism (baseado no signUp.md)
Botão Google grande e central
Sem email/password (apenas Google)
Avatares de utilizadores como social proof
Dashboard (/app)
Header com logo + créditos disponíveis + avatar
Grid de setores (6 cards):
Real Estate, Food, Fashion, Product, Portrait, Landscape
Cada card com ícone, nome e "favorito" toggle
Navegação mobile bottom bar
Enhance (/app/enhance)
Upload drag and drop elegante (baseado no uploaddesign.md)
Preview da imagem original
Loading animation (baseado no luma-spin)
Resultado: Comparador slider before/after
Botões: Download (desativado se trial) + "Remover Watermark"
Cores e Tipografia
Primária: Roxo (#9333ea)
Secundária: Rosa (#ec4899)
Background: Dark (#0a0a0a)
Fonte: Geist ou similar moderna
---

4. Componentes a Criar
UI Base (em src/components/ui/)
gradient-background.tsx - fundos com noise
image-comparison.tsx - slider before/after
file-upload.tsx - drag and drop
luma-spin.tsx - loading animation
mobile-nav.tsx - navegação bottom
sector-card.tsx - card de setor
credit-badge.tsx - mostrar créditos
Layout (em src/components/)
header.tsx - navegação principal
auth-guard.tsx - proteger rotas
trial-banner.tsx - CTA para login
---

5. API Routes
/api/enhance (POST)
Input: { image: base64, sector: string }
Lógica:
Verificar auth (opcional para trial)
Se logado: verificar/consumir créditos
Chamar Vertex AI com prompt do setor
Se trial: aplicar watermark "JARVAS"
Guardar no Storage
Se logado: guardar histórico no Firestore
Output: { enhancedUrl, isTrial }
/api/webhooks/stripe (POST)
Processar eventos: checkout.session.completed
Adicionar créditos ao user no Firestore
/api/create-checkout (POST)
Criar sessão Stripe Checkout para compra de créditos
---

6. Firebase Schema
Collection users/{uid}
{
  email: string
  displayName: string
  photoURL: string
  credits: number  // default: 0
  createdAt: Timestamp
}
Collection users/{uid}/generations/{id}
{
  id: string
  originalUrl: string
  enhancedUrl: string
  sector: string
  createdAt: Timestamp
}
Collection users/{uid}/favorites
{
  sectors: string[]  // ["food", "real_estate", ...]
}
---

7. Stripe Setup
Produtos (via MCP ou Dashboard)
25 Créditos - 9.99 EUR (0,399€ por crédito)
60 Créditos - 19.99 EUR (0,333€ por crédito)
120 Créditos - 34.99 EUR (0,291€ por crédito)
Webhook Events
checkout.session.completed → adicionar créditos
---

8. Fluxo do Utilizador
Trial (sem login)
Landing → CTA "Experimentar"
Escolher setor
Upload imagem
Ver resultado COM watermark
CTA "Criar conta para remover watermark"
Autenticado
Login com Google
Dashboard → escolher setor
Upload imagem
Ver resultado SEM watermark (1 crédito consumido)
Download disponível
Se sem créditos → redirecionar para compra
---

9. Ordem de Implementação
Setup: Next.js + Tailwind + shadcn + Firebase config
Auth: Firebase Auth com Google
UI Base: Componentes de design
Landing: Página inicial com comparador
Dashboard: Grid de setores
Enhance API: Integração Vertex AI
Enhance Page: Upload + resultado
Credits: Stripe checkout + webhooks
Polish: Animações, loading states, error handling