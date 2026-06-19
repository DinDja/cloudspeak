<div align="center">

# CloudSpeak

**Plataforma de apresentações interativas em tempo real — crie enquetes, nuvens de palavras, Q&A e seleção de times que respondem ao vivo pelo celular.**

[![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/products/firestore)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/status-em%20produção-22C55E)](https://cloudspeak.netlify.app)

</div>

---

## Visão geral

O CloudSpeak transforma qualquer apresentação em uma experiência bidirecional. O **apresentador** cria uma sessão no desktop e projeta um código/QR Code. O **público** entra pelo celular e responde em tempo real, com resultados atualizados instantaneamente na tela principal via Firestore.

Inspirado em ferramentas como Mentimeter, o projeto foi desenvolvido para a **SECTI** com foco em eventos, reuniões e dinâmicas de grupo.

### Tipos de slide

| Tipo | Descrição | Visualização no host |
| --- | --- | --- |
| **Múltipla escolha** | Votação com barras animadas e percentuais | Gráfico de barras ao vivo |
| **Nuvem de palavras** | Coleta livre de termos, agrupados por frequência | Word cloud (D3) |
| **Texto aberto (Q&A)** | Perguntas e comentários abertos | Mural de cards em colunas |
| **Seleção de times** | Inscrição em clubes com limite de vagas | Cards de ocupação + lista de membros |

### Recursos

- **Tempo real** com `onSnapshot` do Firestore — sem refresh, sem polling.
- **Presença ao vivo** com heartbeat a cada 15s e TTL de 45s para detectar desconexões.
- **Reações flutuantes** (coração, joinha, dúvida) com animações de partículas no canvas do host.
- **QR Code** gerado dinamicamente para entrada rápida via `qrcode.react`.
- **Sessões salvas** — histórico das últimas 20 apresentações, com reabertura e exclusão.
- **Responsivo por função**: criação/projeção no desktop, participação no mobile.
- **URL com código pré-preenchido** (`?code=ABC123`) para divulgação direta.
- **Regras de segurança** validando schema, tamanhos e tipos no Firestore.

---

## Stack

| Camada | Tecnologia |
| --- | --- |
| UI | React 19, TailwindCSS 3 |
| Build | Vite 8 |
| Backend | Firebase Firestore (realtime) |
| Visualizações | D3 + d3-cloud (word cloud) |
| Ícones / QR | lucide-react, qrcode.react |
| Lint | ESLint 9 + plugins React Hooks / Refresh |

---

## Arquitetura

```
Apresentador (desktop)                 Público (mobile)
        │                                    │
        │  cria/avança sessão                │  entra via código/QR
        ▼                                    ▼
  ┌──────────────────── Firestore (sessions/{code}) ────────────────────┐
  │  sessions/{code}                 ← doc da sessão (slides, índice)   │
  │    responses/                    ← respostas por slide               │
  │    reactions/                    ← reações efêmeras (4,2s)           │
  │    participants/                 ← presença (heartbeat)              │
  └─────────────────────────────────────────────────────────────────────┘
        │  onSnapshot                       │  onSnapshot
        ▼                                    ▼
   HostView (projeção)              ParticipantView (respostas)
```

Todo o estado é sincronizado pelo Firestore — não há backend próprio. Cada sessão é identificada por um código alfanumérico de 6 caracteres (`^[A-Z0-9]{6}$`).

### Modelos de dados

- **`sessions/{code}`** — `code`, `title`, `status`, `slides[]`, `currentSlideIndex`, timestamps.
- **`responses/{id}`** — `participantId`, `participantName`, `slideId`, `type`, `value`, `createdAt`.
- **`reactions/{id}`** — `type` (`heart`/`thumb`/`question`), `left` (0–100), `participantId`, `createdAt`.
- **`participants/{participantId}`** — `participantName`, `joinedAt`, `lastSeenAt`.

A seleção de times usa um ID de resposta determinístico (`{slideId}__{participantId}`) e uma transação Firestore para garantir **uma única inscrição por participante** e **respeitar o limite de vagas** de forma atômica.

---

## Primeiros passos

### Pré-requisitos

- Node.js 20+
- Um projeto Firebase com Firestore habilitado

### Instalação

```bash
git clone <repo-url>
cd cloudspeak
npm install
```

### Variáveis de ambiente

Crie um arquivo `.env.local` na raiz (opcional — há fallbacks embutidos para desenvolvimento):

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
VITE_APP_URL=              # base usada no QR Code/URL de entrada
```

### Executar

```bash
npm run dev      # ambiente de desenvolvimento
npm run build    # build de produção
npm run preview  # pré-visualizar o build
npm run lint     # verificar padrões de código
```

---

## Regras de segurança

O arquivo [`firestore.rules`](firestore.rules) valida estruturalmente cada escrita:

- Sessões exigem código válido, título (1–120 chars), 1–20 slides e tipos permitidos.
- Respostas limitam nomes (40 chars), valores (220 chars) e tipos de slide conhecidos.
- Reações aceitam apenas `heart`/`thumb`/`question` com posição `left` entre 0 e 100.
- Presença só pode ser criada/atualizada pelo próprio `participantId`.

Deploy das regras:

```bash
firebase deploy --only firestore:rules
```

---

## Estrutura do projeto

```
cloudspeak/
├── firebase.js               # inicialização do Firebase + export do db
├── firestore.rules           # regras de segurança do Firestore
├── firestore.indexes.json    # índices compostos
├── index.html
├── vite.config.js
├── tailwind.config.js
├── public/
│   ├── Secti_Vertical.png    # logo da SECTI
│   ├── wave.svg              # ilustração de fundo
│   └── icons.svg
└── src/
    ├── main.jsx              # bootstrap do React
    ├── index.css             # estilos globais (Tailwind)
    ├── App.css
    └── App.jsx               # aplicação inteira (Landing, HostView, ParticipantView)
```

> O app é concentrado em um único `App.jsx` (~1900 linhas) com três vistas: **Landing** (criar/entrar), **HostView** (projeção) e **ParticipantView** (resposta).

---

## Implantação

O projeto é estático após o build e pode ser hospedado em qualquer CDN/SPA host (Netlify, Vercel, Firebase Hosting).

```bash
npm run build       # gera dist/
# Netlify: aponte o publish dir para "dist" com fallback para /index.html
```

Ao publicar, defina `VITE_APP_URL` com a URL final para que os QR Codes apontem para o endereço correto de entrada do público.

---

## Fluxo de uso

1. O apresentador abre o CloudSpeak no desktop e monta os slides (título + perguntas).
2. Ao **Lançar Apresentação**, é gerado um código de 6 caracteres e um QR Code.
3. O público acessa `cloudspeak.netlify.app`, digita o código (ou escaneia o QR) e responde.
4. O host navega entre slides com os controles inferiores; resultados aparecem ao vivo.
5. O público pode enviar **reações** (coração/joinha/dúvida) que flutuam na tela principal.
6. Sessões ficam listadas no histórico e podem ser reabertas ou apagadas.

---

## Licença

Projeto institucional da SECTI. Uso interno.
