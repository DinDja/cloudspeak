import { useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, Check, ClipboardCopy, MessageCircle, Plus, Sprout, Vote } from 'lucide-react'
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
} from '../lib/firebaseListening'

const INITIAL_TITLE = 'Mapa de Vozes — Jornada Pedagógica 2027'
const INITIAL_INTRODUCTION = 'A Jornada começa antes do encontro: com as perguntas que atravessam o cotidiano de cada escola. Deixe uma ideia para construirmos esse caminho juntos.'
const INITIAL_TOPIC_PROMPT = 'Que tema você gostaria de ver na Jornada Pedagógica 2027?'
const VOTE_INTRODUCTION = 'A Jornada Pedagógica começa antes do encontro. Escolha o tema que você considera mais importante para orientar essa construção coletiva.'
const VOTE_TOPIC_PROMPT = 'Qual tema gerador você considera prioritário para a Jornada Pedagógica 2027?'
const JOURNEY_THEMES = [
  '200 Anos de Escola Pública',
  'Aprendizagem & Equidade',
  'Plano Estadual (PEE-BA)',
  'Educação e territorialidade',
  'Aprendizagem, inclusão e democracia',
  'Escola que forma, juventude que transformam',
]
const SCHOOL_BY_CODE = new Map(SCHOOL_UNITS.map((unit) => [unit.codSec, unit]))

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
  const [selectedId, setSelectedId] = useState('')
  const [title, setTitle] = useState(INITIAL_TITLE)
  const [introduction, setIntroduction] = useState(INITIAL_INTRODUCTION)
  const [topicPrompt, setTopicPrompt] = useState(INITIAL_TOPIC_PROMPT)
  const [mode, setMode] = useState('open')
  const [optionsText, setOptionsText] = useState(JOURNEY_THEMES.join('\n'))
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState('')
  const [entries, setEntries] = useState([])
  const [entriesLoading, setEntriesLoading] = useState(false)
  const [entriesError, setEntriesError] = useState('')
  const [copiedId, setCopiedId] = useState('')

  const selectedForm = useMemo(() => forms.find((form) => form.id === selectedId) ?? null, [forms, selectedId])
  const optionCounts = useMemo(
    () => (selectedForm?.options ?? []).map((label, index) => ({
      label,
      count: entries.filter((entry) => entry.choiceIndex === index).length,
    })),
    [entries, selectedForm],
  )
  const totalVotes = optionCounts.reduce((total, option) => total + option.count, 0)

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
    setTitle(INITIAL_TITLE)
    setIntroduction(INITIAL_INTRODUCTION)
    setTopicPrompt(INITIAL_TOPIC_PROMPT)
    setMode('open')
    setOptionsText(JOURNEY_THEMES.join('\n'))
    setActionError('')
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

  const createForm = async (event) => {
    event.preventDefault()
    setSaving(true)
    setActionError('')
    try {
      const created = await createListeningForm({
        ownerUid: uid,
        title,
        introduction,
        topicPrompt,
        mode,
        options: mode === 'vote' ? parseListeningOptions(optionsText) : [],
      })
      setCreateOpen(false)
      setSelectedId(created.id)
      resetCreateForm()
    } catch (error) {
      console.error('createListeningForm failed', error)
      setActionError(error.message || 'Não foi possível criar a escuta.')
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
                    ? `Votação · ${form.options?.length ?? 0} opções`
                    : `Ideias abertas · ${form.schoolIds?.length ?? 0} unidades`}</span>
                </button>
                <div className="voice-admin-card__actions">
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
                              const choice = selectedForm.options[entry.choiceIndex] ?? 'Opção não identificada'
                              return (
                                <li className="vote-voter" key={entry.id}>
                                  <div className="vote-voter__identity">
                                    <strong>{entry.name}</strong>
                                    <span>
                                      {school?.name || `Unidade ${entry.schoolId}`}
                                      {school && ` · ${school.municipality}`}
                                    </span>
                                  </div>
                                  <div className="vote-voter__choice">
                                    <span>VOTOU EM</span>
                                    <strong>{choice}</strong>
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
                            <span>·</span>
                            {school?.name || `Unidade ${entry.schoolId}`}
                            {school && (
                              <small>
                                {school.municipality} · SEC {school.codSec}
                                {school.codInep ? ` · MEC/INEP ${school.codInep}` : ' · INEP não informado'}
                              </small>
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
        <form className="voice-create-form" onSubmit={createForm}>
          <p className="fala-eyebrow">UM CONVITE À PARTICIPAÇÃO</p>
          <h2>Criar uma escuta</h2>
          <p className="voice-create-form__intro">
            Cada link abre uma página pública própria. Escolha entre reunir propostas abertas ou consultar a preferência por meio de uma votação.
          </p>
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
          {mode === 'vote' && (
            <label className="voice-field">
              <span>Opções de voto <b>uma por linha</b></span>
              <textarea
                value={optionsText}
                onChange={(event) => setOptionsText(event.target.value)}
                required
                rows={6}
                placeholder="Inclua de 2 a 10 opções, uma por linha."
              />
            </label>
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
              {saving ? 'Criando…' : <>Criar escuta <Sprout size={16} /></>}
            </button>
          </div>
        </form>
      </Modal>
    </WorkspaceShell>
  )
}
