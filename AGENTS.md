# CloudSpeak — Guia para Agentes

## Stack
- **React 19** + **Vite 8** + **TailwindCSS 3**
- **Firebase Auth** (email/password) + **Firestore** (realtime via `onSnapshot`)
- **d3-cloud** (word cloud), **framer-motion** (animacoes), **lucide-react** (icones), **qrcode.react**
- **jsPDF** + **jspdf-autotable** (relatorios)

## Estrutura

```
src/
  main.jsx              → <AuthProvider><App /></AuthProvider>
  App.jsx               → roteador state-machine (auth gate)
  index.css             → tailwind + custom utilities + keyframes
  context/AuthContext.jsx
  lib/
    constants.js        → SLIDE_TYPES, TEAM_SELECTION_TYPE, TTLs, regex
    validators.js       → sanitizeSlides, sanitizeTitle, isSecEmail, getParticipantId, buildTeamSelectionStats
    colors.js           → COLORS + CHART_PALETTE
    templates.js        → TEMPLATES (9 templates) + TEMPLATE_BY_ID
    firebaseAuth.js     → signIn, signUp, signOutUser, resendVerification, reloadUser
    firebaseSessions.js → getSession, createSession, launchPresentationAsSession, submitResponse, sendReaction, syncPresence, subscribeSession/Responses/Participants/Reactions, goNextSlide, goPreviousSlide, endSession, deleteSession
    firebasePresentations.js → createPresentation, updatePresentation, duplicatePresentation, deletePresentation, getPresentation, subscribeUserPresentations, buildEditableDraft
  hooks/
    useAuth.js          → consume AuthContext
    useSession.js       → subscribe session+responses+participants
    useReactions.js     → subscribe reactions (filtro 4.2s) + send
    usePresence.js      → heartbeat 15s, TTL 45s
    useSavedPresentations.js → subscribe presentations do owner
  components/
    ui/                 → Button, Card, Input, Textarea, Badge, Logo, Modal, Spinner, EmptyState, WaveBackground
    auth/               → AuthLayout, AuthGuard
    presenter/          → SlideEditor, SlideCanvas, SlideTypePicker, PresentationCard, ComponentPalette, PropertiesPanel
    slides/             → MultipleChoiceResults, WordCloudResults, WordCloudCanvas, OpenTextResults, TeamSelectionResults, TeamReportModal
    icons/              → Icons.jsx (SVG custom)
  views/
    PublicLanding.jsx   → entrada publica (codigo + nome)
    LoginView.jsx       → login institucional
    RegisterView.jsx    → cadastro
    VerifyEmailView.jsx → confirmacao de email
    PresenterDashboard.jsx → listagem de decks
    TemplatePicker.jsx  → selecao de template
    PresentationBuilder.jsx → estúdio de edicao
    HostView.jsx        → projecao ao vivo (QR, resultados, reacoes)
    ParticipantView.jsx → resposta do publico (mobile)
```

## Firebase Schema

### Colecoes

**`presentations/{id}`** — decks salvos (owner-scoped)
| Campo | Tipo | Notas |
|-------|------|-------|
| title | string | 1–120 chars |
| slides | array[object] | 1–20 slides |
| ownerUid | string | imutavel apos criacao |
| ownerEmail | string | imutavel |
| createdAt/updatedAt | timestamp | |

**`sessions/{code}`** — instancias ao vivo (code = 6 chars A-Z0-9)
| Campo | Tipo | Notas |
|-------|------|-------|
| code | string | `^[A-Z0-9]{6}$` |
| title | string | |
| status | string | `'live'` ou `'ended'` |
| slides | array[object] | copia do deck no momento do launch |
| currentSlideIndex | int | |
| ownerUid/ownerEmail | string | |
| presentationId | string\|null | |
| createdAt/launchedAt/updatedAt | timestamp | |

**`sessions/{code}/responses/{id}`** — respostas por slide
| Campo | Tipo | Notas |
|-------|------|-------|
| participantId | string | UUID (sessionStorage) |
| participantName | string | 1–40 chars |
| slideId | string | |
| type | string | slide type |
| value | string | 1–220 chars |
| createdAt | timestamp | |

Para `team_selection`, o responseId é `${slideId}__${participantId}` (impede multiplas inscricoes).

**`sessions/{code}/reactions/{id}`** — reacoes efemeras (4.2s TTL)
| Campo | Tipo | Notas |
|-------|------|-------|
| type | string | `heart` \| `thumb` \| `question` |
| left | int | 0–100 (posicao %) |
| participantId | string | |
| createdAt | timestamp | |

**`sessions/{code}/participants/{participantId}`** — presenca
| Campo | Tipo | Notas |
|-------|------|-------|
| participantId | string | |
| participantName | string | |
| joinedAt | timestamp | so no create |
| lastSeenAt | timestamp | atualizado a cada heartbeat |

### Regras de seguranca (`firestore.rules`)
- 3 camadas de validacao de dominio: UI (`isSecEmail`) → `firebaseAuth.js` → `firestore.rules` (`isSecUser()`)
- `presentations` — CRUD apenas owner, campos imutaveis (ownerUid, ownerEmail, createdAt) no update
- `sessions` — read publico apenas se `status == 'live'`; update so permite `live → ended`; create valida schema completo
- `responses` / `reactions` — create publico (sem auth), delete apenas session owner
- `participants` — create/update publico (sem auth), delete apenas session owner
- Team selection: write usa `runTransaction` + doc-id `${slideId}__${participantId}` p/ evitar duplicatas e exceder capacity

## Auth Flow
- `AuthContext` escuta `onAuthStateChanged`
- Status possiveis: `loading` → `anonymous` | `unverified` | `verified`
- `verified` = email `@secti.ba.gov.br` + `emailVerified == true`
- login/register bloqueiam dominios fora @secti.ba.gov.br no frontend
- Register envia `sendEmailVerification` automaticamente
- `VerifyEmailView` permite reenviar e recarregar status (`reload()`)

## Roteamento (App.jsx)
State-machine pura (sem react-router). Variavel `view` e determinada por `route + status`:
| route | status | view |
|-------|--------|------|
| qualquer | loading | loading |
| dashboard/builder/templates | anonymous | login |
| dashboard/builder/templates | unverified | verify |
| login/register/verify | verified | dashboard |
| login/register | unverified | verify |
| public | qualquer | public |
| host | qualquer | host |
| participant | qualquer | participant |

## Constantes importantes
- `PRESENCE_TTL_MS = 45000` / `PRESENCE_HEARTBEAT_MS = 15000`
- `REACTION_LIFETIME_MS = 4200`
- `MAX_SLIDES = 20`
- `MAX_TEAM_CAPACITY = 50` / `MAX_TEAM_PER_SLIDE = 12`
- `SESSION_CODE_REGEX = /^[A-Z0-9]{6}$/`
- `ALLOWED_AUTH_DOMAIN = 'secti.ba.gov.br'`

## Slide types
```js
'multiple_choice'  // Enquete — options[]
'word_cloud'       // Nuvem de palavras — sem options
'open_text'        // Q&A aberto — sem options
'team_selection'   // Selecao de times — teams[] ({id, name, capacity})
```

## Gotchas & Regras

1. **ParticipantId** e gerado uma vez via `crypto.randomUUID()` e armazenado em `sessionStorage` (chave `cloudspeak-participant-id`). Persiste na aba.

2. **Team selection**: usa documentId composto `${slideId}__${participantId}` para prevenir multiplas inscricoes. Usa `runTransaction` para checar lotacao atomica. Erros customizados: `TEAM_FULL`, `TEAM_ALREADY_SELECTED`, `TEAM_UNAVAILABLE`.

3. **Responses** sao ordenadas por `createdAt desc` no subscribe. Word cloud permite multiplos envios por slide; outros tipos bloqueiam apos primeira resposta.

4. **Presence**: heartbeat a cada 15s via `setInterval`. TTL de 45s no frontend (filtra participantes com `lastSeenAt > now - 45s`). Escuta `visibilitychange` e `focus` para atualizar ao retornar.

5. **Reactions**: filtro de 4.2s no frontend (`REACTION_LIFETIME_MS`). Reacoes antigas sao ignoradas (mas permanecem no Firestore ate delecao manual).

6. **Sanitize**: `sanitizeSlides()` valida cada slide — se encontrar erro em qualquer `team_selection`, invalida tudo. Limite de 20 slides, 12 times por slide.

7. **Draft editing**: `buildEditableDraft()` clona slides com `slice(0, MAX_SLIDES)` e garante arrays mutaveis.

8. **Launch**: ao apresentar, cria nova sessao com codigo de 6 chars. Nao reusa sessao existente. Nao afeta o deck original.

9. **Delete presentation**: apenas remove o documento `presentations/{id}`. Sessoes ao vivo ja lancadas continuam ativas.

10. **Templates**: 9 templates pre-definidos em `templates.js`. Usam `createSlideDraft()` e `createTeamDraft()` para construir slides. `TEMPLATE_BY_ID` e um lookup map.

11. **Config**: fallbacks embutidos em `firebase.js` para dev. `VITE_APP_URL` usado para gerar URL de entrada/QR.

## Comandos
```bash
npm run dev          # dev server
npm run build        # build producao → dist/
npm run preview      # preview do build
npm run lint         # ESLint
firebase deploy --only firestore:rules,firestore:indexes
```

## Git
- Branch `main` e `dev` (remoto `origin`)
- README.md contem documentacao completa em portugues
- .gitignore + CODE_OF_CONDUCT.md + CONTRIBUTING.md presentes
