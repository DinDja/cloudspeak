<div align="center">

# CloudSpeak

**Plataforma de apresentações interativas em tempo real da SECTI — crie enquetes, nuvens de palavras, Q&A e seleção de times que o público responde ao vivo pelo celular.**

[![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%2B%20Firestore-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

</div>

---

## Visão geral

O CloudSpeak transforma qualquer apresentação em uma experiência bidirecional. O **apresentador** (servidor SECTI autenticado) monta uma apresentação no estúdio, lança ao vivo e projeta um código/QR Code. O **público** entra pelo celular — sem login — e responde em tempo real, com resultados atualizados instantaneamente na tela principal via Firestore.

### Tipos de slide

| Tipo | Descrição | Visualização na projeção |
| --- | --- | --- |
| **Enquete** | Votação com barras animadas e percentuais | Gráfico de barras ao vivo |
| **Nuvem de palavras** | Coleta livre de termos, agrupados por frequência | Word cloud (D3) |
| **Q&A aberto** | Perguntas e comentários abertos | Mural de cards em colunas |
| **Seleção de times** | Inscrição em clubes com limite de vagas | Cards de ocupação + lista de membros |

### Recursos

- **Tempo real** com `onSnapshot` do Firestore — sem refresh, sem polling.
- **Autenticação Firebase** (e-mail/senha) restrita ao domínio `@secti.ba.gov.br`, com verificação de e-mail obrigatória para criar/apresentar.
- **Isolamento por dono**: cada apresentação/sessão registra `ownerUid` + `ownerEmail`; o dashboard lista apenas os decks do usuário.
- **Presença ao vivo** com heartbeat a cada 15s e TTL de 45s.
- **Reações flutuantes** (coração, joinha, dúvida) com animações de partículas.
- **QR Code** dinâmico e URL com código pré-preenchido (`?code=ABC123`).
- **Estúdio de apresentação**: sidebar de slides, editor central e pré-visualização ao vivo.
- **Regras de segurança** que validam domínio, `email_verified`, schema, tamanhos e propriedade.

---

## Arquitetura

```
Público (mobile, sem login)            Apresentador (desktop, autenticado @secti.ba.gov.br)
        │                                          │
        │ entra via código/QR                      │ cria/edita deck (presentations)
        ▼                                          │ lança ao vivo (sessions/{code})
  ParticipantView                                  ▼
        │   onSnapshot                       HostView (projeção)
        ▼                                          │   onSnapshot
  ┌──────── Firestore ─────────────────────────────┐
  │  presentations/{id}   decks salvos (owner)     │
  │  sessions/{code}      instância ao vivo        │
  │    responses/         respostas por slide      │
  │    reactions/         reações efêmeras (4,2s)  │
  │    participants/      presença (heartbeat)     │
  └────────────────────────────────────────────────┘
```

### Decisão de modelo: `presentations` vs `sessions`

O app separa **decks editáveis** de **instâncias ao vivo**:

- **`presentations/{id}`** — `title, slides, ownerUid, ownerEmail, createdAt, updatedAt`. CRUD owner-scoped; listado no dashboard. Editável a qualquer momento.
- **`sessions/{code}`** — `code, title, status, slides, currentSlideIndex, ownerUid, ownerEmail, presentationId, createdAt, launchedAt, updatedAt`. Criada ao **lançar** um deck (copia `title`+`slides` + gera um código de 6 chars). Reapresentar gera um novo código e respostas frescas.

`responses`, `reactions` e `participants` continuam sob `sessions/{code}` (preserva compatibilidade do realtime). Isso permite editar um deck sem afetar uma sessão em andamento, e reapresentar o mesmo deck várias vezes.

---

## Stack

| Camada | Tecnologia |
| --- | --- |
| UI | React 19, TailwindCSS 3 (design system institucional) |
| Build | Vite 8 |
| Backend | Firebase Authentication + Firestore (realtime) |
| Visualizações | D3 + d3-cloud (word cloud) |
| Ícones / QR | lucide-react, qrcode.react |
| Lint | ESLint 9 + plugins React Hooks / Refresh |

---

## Estrutura do projeto

```
src/
  main.jsx                 bootstrap + AuthProvider
  App.jsx                  roteador por estado (auth gate + views)
  index.css                design tokens + animações (tailwind + keyframes)
  context/
    AuthContext.jsx        estado de auth (login/register/logout/refresh/resend)
  lib/
    constants.js           paleta, TTLs, tipos de slide, domínio permitido
    validators.js          sanitize/normalização helpers + erros de auth
    firebaseAuth.js        signIn/signUp/signOut/verificação de domínio
    firebaseSessions.js    sessões + responses/reactions/participants (realtime)
    firebasePresentations.js  CRUD de decks (owner-scoped)
  hooks/
    useAuth.js             consome AuthContext
    useSession.js          session + responses + participants (onSnapshot)
    useReactions.js        reações (lifetime filter) + send
    usePresence.js         heartbeat de presença
    useSavedPresentations.js  lista de decks do usuário
  components/
    ui/                    Button, Card, Input, Textarea, Badge, Logo, Spinner,
                           Modal, EmptyState, WaveBackground, SectiMark
    auth/                  AuthLayout, AuthGuard
    presenter/             PresentationCard, SlideEditor, SlideTypePicker
    slides/                WordCloudCanvas, WordCloudResults, MultipleChoiceResults,
                           OpenTextResults, TeamSelectionResults, TeamReportModal
  views/
    PublicLanding.jsx      entrada do público (código + nome)
    LoginView.jsx          login institucional
    RegisterView.jsx       cadastro (@secti.ba.gov.br)
    VerifyEmailView.jsx    confirmação de e-mail
    PresenterDashboard.jsx estúdio: lista de apresentações
    PresentationBuilder.jsx editor de slides (sidebar + preview)
    HostView.jsx           projeção ao vivo (QR, código, resultados, reações)
    ParticipantView.jsx    resposta do público (mobile-first)
```

O `App.jsx` ficou em ~270 linhas (antes ~1928), apenas orquestrando rota + auth gate + hooks.

---

## Primeiros passos

### Pré-requisitos

- Node.js 20+
- Projeto Firebase com **Authentication (E-mail/senha)** e **Firestore** habilitados

### Instalação

```bash
npm install
```

### Variáveis de ambiente

Crie `.env.local` (há fallbacks embutidos para desenvolvimento):

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
VITE_APP_URL=              # URL pública usada no QR Code/URL de entrada
```

### Comandos

```bash
npm run dev      # desenvolvimento
npm run build    # build de produção (dist/)
npm run preview  # pré-visualizar o build
npm run lint     # ESLint
```

---

## Autenticação

- **Público**: entra sem login, apenas com código ou QR Code.
- **Apresentador**: precisa estar autenticado com e-mail `@secti.ba.gov.br` **verificado**.

O domínio é validado em **três camadas**:
1. **UI** (`validators.isSectiEmail`) — bloqueia antes de enviar.
2. **`firebaseAuth.js`** — bloqueia `signIn`/`signUp` de outros domínios.
3. **`firestore.rules`** (`isSectiUser()`) — valida `request.auth.token.email` + `email_verified` no servidor.

Fluxos de tela: `PublicLanding → "Sou apresentador" → Login → (cadastro) → VerifyEmail → Dashboard → Builder → Host`.

---

## Regras de segurança (`firestore.rules`)

- `isSectiUser()` — autenticado, e-mail verificado e domínio `@secti.ba.gov.br`.
- `presentations/{id}` — read/update/delete apenas pelo `ownerUid`; create exige `ownerUid == auth.uid` e `ownerEmail == token.email`; `ownerUid`/`ownerEmail` imutáveis após criação.
- `sessions/{code}` — read pública apenas se `status == 'live'` (ou dono); create/update/delete apenas pelo dono; update permite avançar slides e `live → ended`.
- `responses` / `reactions` / `participants` — escrita pública com schema estritamente validado (tipos, tamanhos, IDs); delete apenas pelo dono da sessão (`sessionOwner()` via `get()`).

Deploy das regras e índices:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

Índices em `firestore.indexes.json`: `presentations` e `sessions` por `ownerUid` + `updatedAt desc`.

---

## Como testar

### Participação sem login
1. `npm run dev`
2. Como apresentador, crie/lançe uma apresentação e copie o código de 6 caracteres.
3. Em outra janela/anônimo, abra a app, digite o código (+ nome opcional) e entre.
4. Responda slides, envie reações — a projeção atualiza em tempo real.

### Login do apresentador
1. No Firebase Console, ative **Authentication → Sign-in method → E-mail/senha**.
2. Cadastre-se na tela "Sou apresentador → Criar conta" usando `nome@secti.ba.gov.br`.
3. Confirme o e-mail pelo link recebido e clique em "Já verifiquei — atualizar".
4. Acesse o dashboard, crie uma apresentação e clique em **Apresentar**.

> Para testar com domínios diferentes sem deploy das regras, o frontend já bloqueia. Para validar o bloqueio no Firestore, faça deploy das regras e tente criar uma sessão com um usuário não-SECTI — a escrita será negada.

---

## Implantação

O projeto é estático após o build (Netlify, Vercel, Firebase Hosting). Defina `VITE_APP_URL` com a URL final para que os QR Codes apontem corretamente para a entrada do público.

```bash
npm run build       # gera dist/
# Netlify: publish dir "dist", fallback /index.html
```

---

## Licença

Projeto institucional da SECTI. Uso interno.
