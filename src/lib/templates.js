import { createSlideDraft, createTeamDraft } from './validators'
import { TEAM_SELECTION_TYPE } from './constants'
import {
  AVANCA_EVENT,
  AVANCA_EVENT_KEY,
  EDUCATION_EVENT_KEY,
  EDUCATION_EVENT,
  buildAvancaEventSlides,
  buildEducationEventSlides,
} from './eventData'

const mc = (question, options) => ({ ...createSlideDraft('multiple_choice'), question, options: [...options] })
const wc = (question) => ({ ...createSlideDraft('word_cloud'), question })
const ot = (question) => ({ ...createSlideDraft('open_text'), question })
const ts = (question, teams) => ({
  ...createSlideDraft(TEAM_SELECTION_TYPE),
  question,
  teams: teams.map((t) => createTeamDraft(t.name, t.capacity)),
})

export const TEMPLATES = [
  {
    id: 'blank',
    name: 'Em branco',
    summary: 'Comece do zero com a etapa interativa mais popular.',
    accent: 'from-slate-500 to-slate-700',
    badge: 'Essencial',
    icon: 'sparkles',
    build: () => [
      {
        ...createSlideDraft('multiple_choice'),
        question: 'Qual a sua resposta?',
        options: ['Concordo totalmente', 'Concordo', 'Discordo', 'Discordo totalmente'],
      },
    ],
  },
  {
    id: EDUCATION_EVENT_KEY,
    name: EDUCATION_EVENT.shortTitle,
    summary: 'Roteiro institucional com as perguntas orientadoras, a escuta do público e a agenda da SEC.',
    accent: 'from-blue-700 to-cyan-500',
    badge: 'Evento especial',
    icon: 'landmark',
    eventKey: EDUCATION_EVENT_KEY,
    build: buildEducationEventSlides,
  },
  {
    id: AVANCA_EVENT_KEY,
    name: AVANCA_EVENT.shortTitle,
    summary: 'Q&A inspirado na nova arquitetura educacional: diagnóstico, recomposição, MAC e próximos passos.',
    accent: 'from-blue-900 via-slate-700 to-red-500',
    badge: 'Evento especial',
    icon: 'landmark',
    eventKey: AVANCA_EVENT_KEY,
    build: buildAvancaEventSlides,
  },
  {
    id: 'pitch',
    name: 'Apresentação de projeto',
    summary: 'Apresente uma ideia e ouça a avaliação de quem participa.',
    accent: 'from-brand-500 to-violet-600',
    badge: 'Projetos',
    icon: 'rocket',
    build: () => [
      ot('Em uma frase: qual problema você precisa resolver hoje?'),
      mc('Qual funcionalidade entrega mais valor para você?', [
        'Onboarding guiado',
        'Colaboração em tempo real',
        'Automação de tarefas',
        'Análise de dados avançada',
      ]),
      wc('Em uma palavra, qual sensação esse produto te causa?'),
      ot('Deixe um feedback para o time de produto'),
    ],
  },
  {
    id: 'kickoff',
    name: 'Abertura de encontro',
    summary: 'Conheça as expectativas do público antes de começar.',
    accent: 'from-brand-500 via-violet-500 to-ocean-500',
    badge: 'Encontros',
    icon: 'flag',
    build: () => [
      mc('Em uma escala de 0 a 10, qual a probabilidade de você recomendar este evento?', [
        '0–3', '4–6', '7–8', '9–10',
      ]),
      ts('Em qual grupo você quer participar?', [
        { name: 'Pesquisa', capacity: 12 },
        { name: 'Tecnologia', capacity: 14 },
        { name: 'Educação', capacity: 10 },
        { name: 'Comunicação', capacity: 8 },
      ]),
      wc('Qual palavra define o que você espera deste encontro?'),
      ot('Qual pergunta você quer trazer para a conversa?'),
    ],
  },
  {
    id: 'lecture',
    name: 'Aula Expositiva',
    summary: 'Engaje turmas grandes com votação, nuvem de conceitos e perguntas.',
    accent: 'from-violet-500 to-violet-700',
    badge: 'Educação',
    icon: 'book',
    build: () => [
      mc('Antes da aula, qual seu nível de familiaridade com o tema?', [
        'Nunca vi', 'Já ouvi falar', 'Conheço bem', 'Domino o assunto',
      ]),
      wc('Liste um conceito-chave que você lembra do último encontro'),
      ot('Qual dúvida ainda ficou em aberto?'),
      mc('Depois da aula, qual seu nível de familiaridade com o tema?', [
        'Nunca vi', 'Já ouvi falar', 'Conheço bem', 'Domino o assunto',
      ]),
    ],
  },
  {
    id: 'workshop',
    name: 'Oficina colaborativa',
    summary: 'Reúna ideias, forme os grupos e defina os próximos passos.',
    accent: 'from-sunset-500 to-coral-600',
    badge: 'Workshops',
    icon: 'wrench',
    build: () => [
      wc('Quais temas trazem você até este workshop?'),
      ts('Em qual mesa você quer se sentar?', [
        { name: 'Mesa de ideias', capacity: 6 },
        { name: 'Mesa de pesquisa', capacity: 6 },
        { name: 'Mesa de execução', capacity: 6 },
      ]),
      mc('Quão provável você está de aplicar algo nas próximas 72h?', [
        'Nada provável', 'Pouco provável', 'Provável', 'Muito provável',
      ]),
      ot('Qual será o seu próximo passo concreto?'),
    ],
  },
  {
    id: 'retro',
    name: 'Retrospectiva',
    summary: 'Coletar aprendizados, próximos passos e satisfações do time.',
    accent: 'from-ocean-500 to-ocean-700',
    badge: 'Times',
    icon: 'cycle',
    build: () => [
      ot('Qual foi seu maior aprendizado deste ciclo?'),
      mc('Como você avaliaria a colaboração do time?', [
        'Pode melhorar', 'Boa', 'Excelente', 'Extraordinária',
      ]),
      wc('Em uma palavra, descreva o próximo ciclo'),
      mc('Qual prioridade você quer levar para o próximo ciclo?', [
        'Foco total', 'Colaboração', 'Experimentação', 'Pausa estratégica',
      ]),
    ],
  },
  {
    id: 'townhall',
    name: 'Assembleia aberta',
    summary: 'Perguntas abertas, escala de humor e nuvem de expectativas.',
    accent: 'from-coral-500 to-coral-700',
    badge: 'Comunidade',
    icon: 'megaphone',
    build: () => [
      mc('Como está a sua energia hoje?', [
        '🔋 Carregado', '🙂 Bem', '😐 Neutro', '🔴 Desafiador',
      ]),
      ot('Qual tema você quer ver discutido nesta assembleia?'),
      wc('Em uma palavra, como você está se sentindo agora?'),
      mc('Você ficou satisfeito com as respostas da liderança?', ['Sim', 'Parcialmente', 'Não']),
    ],
  },
  {
    id: 'demo',
    name: 'Demo Day',
    summary: 'Avalie pitches, colete torcida e defina o projeto favorito.',
    accent: 'from-brand-600 via-violet-500 to-coral-500',
    badge: 'Demo Day',
    icon: 'trophy',
    build: () => [
      mc('Qual pitch mais chamou sua atenção?', [
        'Time 1 — Atlas', 'Time 2 — Pulsar', 'Time 3 — Órbita', 'Time 4 — Íris',
      ]),
      ts('Em qual time você quer votar?', [
        { name: 'Atlas', capacity: 30 },
        { name: 'Pulsar', capacity: 30 },
        { name: 'Órbita', capacity: 30 },
      ]),
      wc('Em uma palavra, qual pitch te surpreendeu?'),
      ot('Deixe um conselho para os times finalistas'),
    ],
  },
]

export const TEMPLATE_BY_ID = Object.fromEntries(TEMPLATES.map((t) => [t.id, t]))
