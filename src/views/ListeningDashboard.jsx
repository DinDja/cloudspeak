import { useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, Check, ClipboardCopy, Edit2, MessageCircle, Plus, Sprout, Vote } from 'lucide-react'
import Modal from '../components/ui/Modal'
import WorkspaceShell from '../components/ui/WorkspaceShell'
import SCHOOL_UNITS from '../data/schoolUnits.json'
import { useAuth } from '../hooks/useAuth'
import { useListeningForms } from '../hooks/useListeningForms'
import {
  createListeningForm,
  parseListeningOptions,
  setListeningFormStatus,
  subscribeListeningEntries,
  updateListeningForm,
} from '../lib/firebaseListening'

const INITIAL_TITLE = 'Mapa de Vozes — Jornada Pedagógica 2027'
const INITIAL_INTRODUCTION = 'A Jornada começa antes do encontro: com as perguntas que atravessam o cotidiano de cada escola. Deixe uma ideia para construirmos esse caminho juntos.'
const INITIAL_TOPIC_PROMPT = 'Que tema você gostaria de ver na Jornada Pedagógica 2027?'
const VOTE_INTRODUCTION = 'A Jornada Pedagógica começa antes do encontro. Escolha o tema que considera mais importante e, dentro dele, o título que melhor expressa essa construção coletiva.'
const VOTE_TOPIC_PROMPT = 'Qual tema gerador você considera prioritário para a Jornada Pedagógica 2027?'
const JOURNEY_VOTE_OPTIONS = [
  {
    label: '200 anos da escola pública',
    titles: [
      'Resgatar a História para Construir o Amanhã: A Trajetória da Escola Pública Baiana.',
      '200 Anos de Resistência e Saberes: O Legado e os Desafios da Educação Pública na Bahia.',
      'Duas Décadas de História: Tradição, mudança e futuro.',
      'Escola Pública na Bahia: Construção Histórica, Democracia e Retratos de um Povo.',
      'Da Memória à Ação: Celebrando 200 Anos da Escola Pública com Inovação e Compromisso.',
      'Bicentenário da Escola Pública na Bahia: Memórias, Conquistas e os Caminhos para o Futuro da Educação',
      '200 anos da escola que avança, cuida e transforma',
    ],
  },
  {
    label: 'Aprendizagem e equidade',
    titles: [
      'Caminhos para a aprendizagem com equidade na educação baiana',
      'Pedagogia da Equidade: Garantindo Direitos no Cotidiano Escolar.',
      'Práticas Pedagógicas para uma Aprendizagem Plural.',
      'Aprendizagem e equidade na Sala de Aula: Estratégias Pedagógicas para a justiça curricular',
      'Avaliar para Incluir: Diagnóstico, Intervenção e Equidade no Processo de Ensino.',
      'Equidade em Ação: Estratégias Pedagógicas para Garantir Direitos a Aprendizagem',
    ],
  },
  {
    label: 'Plano Estadual de Educação',
    titles: [
      'Diretrizes que Mobilizam: O PEE como Bússola do Planejamento Escolar.',
      'Do Documento à Prática: Consolidando as Metas do PEE na Rede Estadual.',
      'Compromisso Coletivo: Gestão democrática, PEE e Fortalecimento da Escola Pública baiana.',
      'Monitorar, Avaliar e Avançar: O Papel da Comunidade Escolar na Efetivação do PEE.',
      'O PEE no Cotidiano: Unindo Políticas Públicas e Projeto Político Pedagógico.',
      'PEE em Foco: Planejamento, Metas Coletivas e o Compromisso com uma Educação Pública de Qualidade social',
      'A Bahia nos próximos 10 anos: aprendizagem efetiva, equitativa e de qualidade social',
    ],
  },
  {
    label: 'Educação e territorialidade',
    titles: [
      'Saberes da Terra, Culturas do Povo: A Territorialidade como Eixo do Currículo.',
      'A Escola e seus Territórios: Diálogos entre Identidades e aprendizagem',
      'Pedagogia Contextualizada: Valorizando o Território de Identidade na Construção do Conhecimento.',
      'Territórios de Afeto e Aprendizagem: Conectando a Escola com a Comunidade Baiana.',
      'Diversidade Territorial na Bahia: Desafios e Riquezas da Prática Educativo-Regional.',
      'Territórios que Educam: Saberes Locais, Identidade Baiana e a Diversidade nos Processos de Ensino',
      'Educação e territorialidade: aprender para transformar a Bahia',
    ],
  },
  {
    label: 'Aprendizagem, inclusão e democracia',
    titles: [
      'Democracia se Aprende na Prática: Inclusão, Acessibilidade e Participação Ativa.',
      'Acessibilidade Atitudinal e Pedagógica: Garantindo que Todos Aprendam Juntos.',
      'Vozes da Escola: Gestão Democrática, Diversidade e Inclusão Plena.',
      'Estratégias Inclusivas para uma Aprendizagem Democrática.',
      'Diversidade como Potência: Diálogo, Respeito e Aprendizagem para Todos.',
      'Escola Democrática e Inclusiva: Garantindo o Acesso, a Permanência e a conclusão da educação básica',
      'Aprendizagem, inclusão e democracia: a escola que constrói o futuro da Bahia',
    ],
  },
  {
    label: 'Escola que forma, juventude que transforma',
    titles: [
      'Juventudes Baianas: Sonhos, projetos e Protagonismo na Sociedade.',
      'A Escola como Espaço de Possibilidades: Formação Cidadã e Transformação Social.',
      'Engajar para Transformar: O Papel dos Jovens no Presente e no Futuro da Bahia.',
      'Educação e Juventudes: Escuta Ativa, Autonomia e Construção do Conhecimento.',
      'Cultivando Autores do Próprio Futuro: Formação Integral e Juventude Consciente.',
      'Protagonismo Juvenil e Formação Integral: A Escola como Espaço de Transformação Social',
      'Escola que forma, estudantes que transformam: formação integral, mundo do trabalho e democracia',
    ],
  },
  {
    label: 'A Práxis Docente: Formação Permanente e Consciência Crítica na Escola',
    titles: [
      'A Práxis Docente, a Consciência Crítica e o Papel do Educador na Reconstrução Social.',
      'O Educador como Agente Político e Transformador da Sociedade Baiana.',
      'A Importância da Formação Permanente na Construção de uma Sociedade Justa.',
      'A Dimensão Humana e a Formação Contínua como Pilares do Compromisso Social da Docência.',
      'Formação em Serviço, Autonomia Docente e o Impacto do Educador no Futuro da Sociedade.',
      'A Formação em Serviço e a Conscientização Crítica do Educador como Sujeito da História.',
    ],
  },
]
const SCHOOL_BY_CODE = new Map(SCHOOL_UNITS.map((unit) => [unit.codSec, unit]))
const getVoteOptionLabel = (option) => (typeof option === 'string' ? option : option.label)
const getVoteOptionTitles = (option) => (Array.isArray(option?.titles) ? option.titles : [])
const getOccupationLabel = (entry) => (
  entry.occupation === 'Outro' && entry.otherOccupation
    ? `Outro: ${entry.otherOccupation}`
    : entry.occupation
)

const makePublicUrl = (formId) => {
  const url = new URL(window.location.href)
  url.search = ''
  url.hash = ''
  url.searchParams.set('escuta', formId)
  return url.toString()
}

export default function ListeningDashboard({ onBack, onTemplates, onLogout }) {
  const { displayName, email, uid, logout } = useAuth()
  const { forms, loading, error: formsError } = useListeningForms(uid)
  const [createOpen, setCreateOpen] = useState(false)
  const [editingFormId, setEditingFormId] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [title, setTitle] = useState(INITIAL_TITLE)
  const [introduction, setIntroduction] = useState(INITIAL_INTRODUCTION)
  const [topicPrompt, setTopicPrompt] = useState(INITIAL_TOPIC_PROMPT)
  const [mode, setMode] = useState('open')
  const [voteOptions, setVoteOptions] = useState(() => JOURNEY_VOTE_OPTIONS.map((option) => ({
    ...option,
    titlesText: option.titles.join('\n'),
    hasTitles: true,
  })))
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState('')
  const [entries, setEntries] = useState([])
  const [entriesLoading, setEntriesLoading] = useState(false)
  const [entriesError, setEntriesError] = useState('')
  const [copiedId, setCopiedId] = useState('')

  const selectedForm = useMemo(() => forms.find((form) => form.id === selectedId) ?? null, [forms, selectedId])
  const optionCounts = useMemo(
    () => (selectedForm?.options ?? []).map((option, index) => ({
      label: getVoteOptionLabel(option),
      count: entries.filter((entry) => entry.choiceIndex === index).length,
    })),
    [entries, selectedForm],
  )
  const subOptionCounts = useMemo(
    () => (selectedForm?.options ?? []).map((option, choiceIndex) => (
      getVoteOptionTitles(option).map((label, subChoiceIndex) => ({
        label,
        count: entries.filter((entry) => (
          entry.choiceIndex === choiceIndex && entry.subChoiceIndex === subChoiceIndex
        )).length,
      }))
    )),
    [entries, selectedForm],
  )
  const totalVotes = optionCounts.reduce((total, option) => total + option.count, 0)
  const optionsLocked = Boolean(
    editingFormId
      && mode === 'vote'
      && (entriesLoading || entriesError || entries.some((entry) => Number.isInteger(entry.choiceIndex))),
  )

  useEffect(() => {
    if (!selectedId) {
      setEntries([])
      setEntriesLoading(false)
      setEntriesError('')
      return undefined
    }

    setEntries([])
    setEntriesLoading(true)
    setEntriesError('')
    const unsubscribe = subscribeListeningEntries(
      selectedId,
      (nextEntries) => {
        setEntries(nextEntries)
        setEntriesLoading(false)
      },
      (error) => {
        console.error('subscribeListeningEntries failed', error)
        setEntriesError('Não foi possível carregar as contribuições desta escuta.')
        setEntriesLoading(false)
      },
    )
    return () => unsubscribe()
  }, [selectedId])

  const resetCreateForm = () => {
    setEditingFormId('')
    setTitle(INITIAL_TITLE)
    setIntroduction(INITIAL_INTRODUCTION)
    setTopicPrompt(INITIAL_TOPIC_PROMPT)
    setMode('open')
    setVoteOptions(JOURNEY_VOTE_OPTIONS.map((option) => ({
      ...option,
      titlesText: option.titles.join('\n'),
      hasTitles: true,
    })))
    setActionError('')
  }

  const startEditingForm = (form) => {
    setSelectedId(form.id)
    setEditingFormId(form.id)
    setTitle(form.title ?? '')
    setIntroduction(form.introduction ?? '')
    setTopicPrompt(form.topicPrompt ?? '')
    setMode(form.mode ?? 'open')
    setVoteOptions((form.options ?? []).map((option) => ({
      label: getVoteOptionLabel(option),
      titlesText: getVoteOptionTitles(option).join('\n'),
      hasTitles: Array.isArray(option?.titles),
    })))
    setActionError('')
    setCreateOpen(true)
  }

  const chooseMode = (nextMode) => {
    setMode(nextMode)
    if (nextMode === 'vote') {
      if (introduction === INITIAL_INTRODUCTION) setIntroduction(VOTE_INTRODUCTION)
      if (topicPrompt === INITIAL_TOPIC_PROMPT) setTopicPrompt(VOTE_TOPIC_PROMPT)
      return
    }
    if (introduction === VOTE_INTRODUCTION) setIntroduction(INITIAL_INTRODUCTION)
    if (topicPrompt === VOTE_TOPIC_PROMPT) setTopicPrompt(INITIAL_TOPIC_PROMPT)
  }

  const updateVoteOption = (index, key, value) => {
    setVoteOptions((current) => current.map((option, optionIndex) => (
      optionIndex === index ? { ...option, [key]: value } : option
    )))
  }

  const addVoteOption = () => {
    setVoteOptions((current) => (
      current.length < 10
        ? [...current, { label: '', titlesText: '', hasTitles: true }]
        : current
    ))
  }

  const removeVoteOption = (index) => {
    setVoteOptions((current) => (
      current.length > 2
        ? current.filter((_, optionIndex) => optionIndex !== index)
        : current
    ))
  }

  const saveForm = async (event) => {
    event.preventDefault()
    setSaving(true)
    setActionError('')
    try {
      const options = mode === 'vote'
        ? voteOptions.map(({ label, titlesText }) => {
          const titles = parseListeningOptions(titlesText)
          return titles.length ? { label, titles } : label
        })
        : []

      if (editingFormId) {
        await updateListeningForm(editingFormId, {
          title,
          introduction,
          topicPrompt,
          mode,
          ...(optionsLocked ? {} : { options }),
        })
      } else {
        const created = await createListeningForm({
          ownerUid: uid,
          title,
          introduction,
          topicPrompt,
          mode,
          options,
        })
        setSelectedId(created.id)
      }

      setCreateOpen(false)
      resetCreateForm()
    } catch (error) {
      console.error(editingFormId ? 'updateListeningForm failed' : 'createListeningForm failed', error)
      setActionError(error.message || (editingFormId
        ? 'Não foi possível salvar as alterações.'
        : 'Não foi possível criar a escuta.'))
    } finally {
      setSaving(false)
    }
  }

  const copyLink = async (formId) => {
    setActionError('')
    try {
      await navigator.clipboard.writeText(makePublicUrl(formId))
      setCopiedId(formId)
      window.setTimeout(() => setCopiedId(''), 1800)
    } catch (error) {
      console.error('Copy listening link failed', error)
      setActionError('Não foi possível copiar o link. Abra-o e copie o endereço da página.')
    }
  }

  const toggleStatus = async (form) => {
    setActionError('')
    try {
      await setListeningFormStatus(form.id, form.status === 'open' ? 'closed' : 'open')
    } catch (error) {
      console.error('setListeningFormStatus failed', error)
      setActionError('Não foi possível atualizar o estado desta escuta.')
    }
  }

  return (
    <WorkspaceShell
      name={displayName || email?.split('@')[0]}
      email={email}
      active="listening"
      onPresentations={onBack}
      onListening={() => setSelectedId('')}
      onTemplates={onTemplates}
      onLogout={async () => {
        await logout()
        onLogout()
      }}
    >
      <div className="workspace-title-row">
        <div>
          <p className="fala-eyebrow">IDEIAS QUE COMEÇAM EM CADA ESCOLA</p>
          <h1 className="workspace-title">Escutas</h1>
          <p className="workspace-subtitle">Convites para reunir ideias ou escolher, em conjunto, os próximos temas.</p>
        </div>
        <button type="button" className="fala-button" onClick={() => {
          setActionError('')
          setCreateOpen(true)
        }}>
          <Plus size={17} /> Nova escuta
        </button>
      </div>

      {actionError && !createOpen && <p className="fala-error" role="alert">{actionError}</p>}
      {formsError && <p className="fala-error" role="alert">{formsError}</p>}

      {loading ? (
        <p className="workspace-empty" role="status">Carregando suas escutas…</p>
      ) : forms.length ? (
        <div className="voice-admin-layout">
          <section className="voice-admin-list" aria-label="Suas escutas">
            <div className="voice-admin-list__heading">
              <h2>Seus espaços de escuta</h2>
              <span>{forms.length}</span>
            </div>
            {forms.map((form) => (
              <article className={`voice-admin-card${form.id === selectedId ? ' is-selected' : ''}`} key={form.id}>
                <button
                  type="button"
                  className="voice-admin-card__main"
                  onClick={() => setSelectedId(form.id)}
                  aria-pressed={form.id === selectedId}
                >
                  <span className={`voice-status${form.status === 'open' ? ' is-open' : ''}`}>
                    {form.status === 'open' ? 'Recebendo ideias' : 'Encerrada'}
                  </span>
                  <strong>{form.title}</strong>
                  <span>{form.mode === 'vote'
                    ? `Votação · ${form.options?.length ?? 0} temas`
                    : `Ideias abertas · ${form.schoolIds?.length ?? 0} unidades`}</span>
                </button>
                <div className="voice-admin-card__actions">
                  <button type="button" className="voice-small-action" onClick={() => startEditingForm(form)}>
                    <Edit2 size={15} /> Editar escuta
                  </button>
                  <button type="button" className="voice-small-action" onClick={() => copyLink(form.id)}>
                    {copiedId === form.id ? <Check size={15} /> : <ClipboardCopy size={15} />}
                    {copiedId === form.id ? 'Copiado' : 'Copiar link'}
                  </button>
                  <a
                    className="voice-small-action"
                    href={makePublicUrl(form.id)}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Abrir link público da escuta ${form.title}`}
                  >
                    <ArrowUpRight size={15} /> Abrir link
                  </a>
                </div>
              </article>
            ))}
          </section>

          <section className="voice-admin-results" aria-live="polite">
            {!selectedForm ? (
              <div className="voice-admin-placeholder">
                <Sprout size={24} />
                <h2>Escolha uma escuta</h2>
                <p>As ideias e os resultados das votações aparecem aqui para a equipe organizadora.</p>
              </div>
            ) : (
              <>
                <div className="voice-results-heading">
                  <div>
                    <p className="fala-eyebrow">{selectedForm.mode === 'vote' ? 'APURAÇÃO DA VOTAÇÃO' : 'MURAL DE CONTRIBUIÇÕES'}</p>
                    <h2>{selectedForm.title}</h2>
                    <p>
                      {selectedForm.mode === 'vote'
                        ? `${totalVotes} ${totalVotes === 1 ? 'voto registrado' : 'votos registrados'}`
                        : `${entries.length} ${entries.length === 1 ? 'ideia recebida' : 'ideias recebidas'}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="fala-button fala-button--secondary"
                    onClick={() => toggleStatus(selectedForm)}
                  >
                    {selectedForm.status === 'open' ? 'Encerrar escuta' : 'Reabrir escuta'}
                  </button>
                </div>

                {entriesError ? (
                  <p className="fala-error" role="alert">{entriesError}</p>
                ) : entriesLoading ? (
                  <p className="voice-results-empty" role="status">Reunindo as ideias…</p>
                ) : selectedForm.mode === 'vote' ? (
                  <>
                    <div className="vote-results">
                      {!entriesLoading && !totalVotes && (
                        <p className="voice-results-empty">A votação ainda não recebeu votos. Compartilhe o link para iniciar.</p>
                      )}
                      {optionCounts.map((option, index) => {
                        const percentage = totalVotes ? Math.round((option.count / totalVotes) * 100) : 0
                        const titles = subOptionCounts[index] ?? []
                        const selectedThemeCount = option.count
                        return (
                          <article className="vote-result" key={`${index}-${option.label}`}>
                            <div className="vote-result__heading">
                              <span className="vote-result__rank">{String(index + 1).padStart(2, '0')}</span>
                              <strong>{option.label}</strong>
                              <span className="vote-result__count">{option.count} · {percentage}%</span>
                            </div>
                            <div className="vote-result__track" aria-label={`${option.label}: ${option.count} votos, ${percentage}%`}>
                              <span style={{ width: `${percentage}%` }} />
                            </div>
                            {titles.length > 0 && (
                              <div className="vote-subresults">
                                {titles.map((title, titleIndex) => {
                                  const titlePercentage = selectedThemeCount
                                    ? Math.round((title.count / selectedThemeCount) * 100)
                                    : 0
                                  return (
                                    <div className="vote-subresult" key={`${titleIndex}-${title.label}`}>
                                      <div className="vote-subresult__heading">
                                        <span>{title.label}</span>
                                        <small>{title.count} · {titlePercentage}%</small>
                                      </div>
                                      <div className="vote-subresult__track">
                                        <span style={{ width: `${titlePercentage}%` }} />
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </article>
                        )
                      })}
                    </div>
                    {totalVotes > 0 && (
                      <section className="vote-voters" aria-labelledby="vote-voters-title">
                        <div className="vote-voters__heading">
                          <div>
                            <p className="fala-eyebrow">TRANSPARÊNCIA DA ESCUTA</p>
                            <h3 id="vote-voters-title">Quem votou e em quê</h3>
                          </div>
                          <span>{totalVotes} {totalVotes === 1 ? 'participante' : 'participantes'}</span>
                        </div>
                        <ol className="vote-voters__list">
                          {entries
                            .filter((entry) => Number.isInteger(entry.choiceIndex))
                            .map((entry) => {
                              const school = SCHOOL_BY_CODE.get(entry.schoolId)
                              const selectedOption = selectedForm.options[entry.choiceIndex]
                              const choice = selectedOption
                                ? getVoteOptionLabel(selectedOption)
                                : 'Opção não identificada'
                              const subChoice = Number.isInteger(entry.subChoiceIndex)
                                ? getVoteOptionTitles(selectedOption)[entry.subChoiceIndex]
                                : ''
                              return (
                                <li className="vote-voter" key={entry.id}>
                                  <div className="vote-voter__identity">
                                    <strong>{entry.name}</strong>
                                    {getOccupationLabel(entry) && <span>{getOccupationLabel(entry)}</span>}
                                    {school && (
                                      <span>{school.name} · {school.municipality}</span>
                                    )}
                                  </div>
                                  <div className="vote-voter__choice">
                                    <span>VOTOU EM</span>
                                    <strong>{choice}</strong>
                                    {subChoice && <span>{subChoice}</span>}
                                  </div>
                                </li>
                              )
                            })}
                        </ol>
                      </section>
                    )}
                  </>
                ) : entries.length ? (
                  <div className="voice-entry-grid">
                    {entries.map((entry, index) => {
                      const school = SCHOOL_BY_CODE.get(entry.schoolId)
                      return (
                        <article className="voice-entry-card" key={entry.id}>
                          <span className="voice-entry-card__number">{String(entries.length - index).padStart(2, '0')}</span>
                          <h3>{entry.theme}</h3>
                          <p className="voice-entry-card__importance">{entry.importance}</p>
                          {entry.question && (
                            <blockquote>
                              <span>PARA LEVAR À RODA</span>
                              {entry.question}
                            </blockquote>
                          )}
                          <footer>
                            <strong>{entry.name}</strong>
                            {getOccupationLabel(entry) && (
                              <>
                                <span>·</span>
                                {getOccupationLabel(entry)}
                              </>
                            )}
                            {school && (
                              <>
                                <span>·</span>
                                {school.name}
                                <small>
                                  {school.municipality} · SEC {school.codSec}
                                  {school.codInep ? ` · MEC/INEP ${school.codInep}` : ' · INEP não informado'}
                                </small>
                              </>
                            )}
                          </footer>
                        </article>
                      )
                    })}
                  </div>
                ) : (
                  <div className="voice-results-empty">
                    <MessageCircle size={23} />
                    <p>Ainda não chegaram ideias. Compartilhe o link e abra espaço para a conversa.</p>
                    <button type="button" className="fala-button fala-button--secondary" onClick={() => copyLink(selectedForm.id)}>
                      <ClipboardCopy size={15} /> Copiar link da escuta
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      ) : (
        <div className="voice-admin-empty">
          <span><Sprout size={26} /></span>
          <p className="fala-eyebrow">UM ESPAÇO DIFERENTE DE APRESENTAÇÃO</p>
          <h2>Escutar também é construir.</h2>
          <p>Crie um convite aberto, escolha as unidades escolares e reúna as ideias em um mural vivo.</p>
          <button type="button" className="fala-button" onClick={() => setCreateOpen(true)}>
            <Plus size={16} /> Criar minha primeira escuta
          </button>
        </div>
      )}

      <Modal
        open={createOpen}
        onClose={() => {
          if (!saving) {
            setCreateOpen(false)
            resetCreateForm()
          }
        }}
        maxWidth="max-w-2xl"
        ariaLabel="Criar nova escuta"
      >
        <form className="voice-create-form" onSubmit={saveForm}>
          <p className="fala-eyebrow">UM CONVITE À PARTICIPAÇÃO</p>
          <h2>{editingFormId ? 'Editar escuta' : 'Criar uma escuta'}</h2>
          <p className="voice-create-form__intro">
            {editingFormId
              ? 'Atualize as informações da escuta. As respostas e o link público serão mantidos.'
              : 'Cada link abre uma página pública própria. Escolha entre reunir propostas abertas ou consultar a preferência por meio de uma votação.'}
          </p>
          {!editingFormId && (
            <fieldset className="voice-mode-picker">
              <legend>Como será esta escuta?</legend>
              <button type="button" className={mode === 'open' ? 'is-selected' : ''} aria-pressed={mode === 'open'} onClick={() => chooseMode('open')}>
                <MessageCircle size={18} />
                <strong>Ideias abertas</strong>
                <span>Uma proposta com contexto de cada unidade.</span>
              </button>
              <button type="button" className={mode === 'vote' ? 'is-selected' : ''} aria-pressed={mode === 'vote'} onClick={() => chooseMode('vote')}>
                <Vote size={18} />
                <strong>Votação</strong>
                <span>Um tema escolhido entre opções.</span>
              </button>
            </fieldset>
          )}
          <label className="voice-field">
            <span>Nome da escuta <b>obrigatório</b></span>
            <input value={title} onChange={(event) => setTitle(event.target.value)} required minLength={3} maxLength={120} />
          </label>
          <label className="voice-field">
            <span>Texto de abertura</span>
            <textarea
              value={introduction}
              onChange={(event) => setIntroduction(event.target.value)}
              maxLength={800}
              rows={3}
              placeholder="Conte por que esta conversa está sendo aberta."
            />
          </label>
          <label className="voice-field">
            <span>{mode === 'vote' ? 'Pergunta da votação' : 'Pergunta principal'} <b>obrigatória</b></span>
            <input
              value={topicPrompt}
              onChange={(event) => setTopicPrompt(event.target.value)}
              required
              minLength={5}
              maxLength={180}
              placeholder="O que você quer convidar o público a propor?"
            />
          </label>
          {mode === 'vote' && !optionsLocked && (
            <section className="voice-vote-editor" aria-label="Temas e títulos da votação">
              <div className="voice-vote-editor__heading">
                <div>
                  <span>OPÇÕES DE VOTO</span>
                  <p>Adicione os temas e os títulos que poderão ser escolhidos em cada tema.</p>
                </div>
                <span>{voteOptions.length}/10 temas</span>
              </div>
              {voteOptions.map((option, index) => (
                <fieldset className="voice-vote-editor__theme" key={`vote-theme-${index}`}>
                  <legend>Tema {String(index + 1).padStart(2, '0')}</legend>
                  <label className="voice-field">
                    <span>Nome do tema <b>obrigatório</b></span>
                    <input
                      value={option.label}
                      onChange={(event) => updateVoteOption(index, 'label', event.target.value)}
                      required
                      maxLength={180}
                      placeholder="Ex.: Aprendizagem e equidade"
                    />
                  </label>
                  <label className="voice-field">
                    <span>Títulos deste tema <b>um por linha</b></span>
                    <textarea
                      value={option.titlesText}
                      onChange={(event) => updateVoteOption(index, 'titlesText', event.target.value)}
                      required={option.hasTitles}
                      rows={Math.min(7, Math.max(3, option.titlesText.split('\n').length))}
                      placeholder="Digite cada título em uma linha."
                    />
                  </label>
                  {voteOptions.length > 2 && (
                    <button
                      type="button"
                      className="voice-vote-editor__remove"
                      onClick={() => removeVoteOption(index)}
                    >
                      Remover tema
                    </button>
                  )}
                </fieldset>
              ))}
              <button
                type="button"
                className="fala-button fala-button--secondary"
                onClick={addVoteOption}
                disabled={voteOptions.length >= 10}
              >
                <Plus size={15} /> Adicionar tema
              </button>
            </section>
          )}
          {mode === 'vote' && optionsLocked && (
            <div className="voice-vote-locked" role="note">
              <strong>Temas e títulos bloqueados</strong>
              <span>Esta votação já tem respostas. Os temas e títulos não podem ser alterados para preservar a apuração dos votos.</span>
              <ul>
                {voteOptions.map((option, index) => (
                  <li key={`${index}-${option.label}`}>
                    <strong>{option.label}</strong>
                    {option.titlesText && <span>{parseListeningOptions(option.titlesText).join(' · ')}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="voice-school-catalog">
            <p className="fala-eyebrow">CATÁLOGO DAS UNIDADES EM ATIVIDADE</p>
            <strong>{SCHOOL_UNITS.length.toLocaleString('pt-BR')} unidades escolares</strong>
            <span>Na página pública, a busca aceita nome da unidade, código SEC ou código MEC/INEP.</span>
          </div>
          {actionError && <p className="fala-error" role="alert">{actionError}</p>}
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" className="fala-button fala-button--secondary" disabled={saving} onClick={() => {
              setCreateOpen(false)
              resetCreateForm()
            }}>
              Cancelar
            </button>
            <button type="submit" className="fala-button" disabled={saving}>
              {saving
                ? (editingFormId ? 'Salvando…' : 'Criando…')
                : editingFormId
                  ? <>Salvar alterações <Check size={16} /></>
                  : <>Criar escuta <Sprout size={16} /></>}
            </button>
          </div>
        </form>
      </Modal>
    </WorkspaceShell>
  )
}
