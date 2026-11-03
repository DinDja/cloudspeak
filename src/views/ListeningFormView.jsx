import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Feather, Sprout } from 'lucide-react'
import Logo from '../components/ui/Logo'
import SCHOOL_UNITS from '../data/schoolUnits.json'
import { getListeningForm, getSubmittedVoterName, submitListeningEntry } from '../lib/firebaseListening'

const normalizeSearch = (value) => String(value ?? '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase('pt-BR')

export default function ListeningFormView({ formId, onBack }) {
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [values, setValues] = useState({
    name: '',
    occupation: '',
    otherOccupation: '',
    schoolId: '',
    choiceIndex: '',
    theme: '',
    importance: '',
    question: '',
  })
  const [schoolSearch, setSchoolSearch] = useState('')
  const [schoolPickerOpen, setSchoolPickerOpen] = useState(false)
  const [activeSchoolIndex, setActiveSchoolIndex] = useState(0)
  const schoolPickerRef = useRef(null)
  const [sending, setSending] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitted, setSubmitted] = useState(() => Boolean(getSubmittedVoterName(formId)))
  const selectedSchool = useMemo(
    () => SCHOOL_UNITS.find((unit) => unit.codSec === values.schoolId) ?? null,
    [values.schoolId],
  )
  const matchingSchools = useMemo(() => {
    const query = normalizeSearch(schoolSearch.trim())
    if (!query) return []
    return SCHOOL_UNITS
      .filter((unit) => [
        unit.name,
        unit.municipality,
        unit.codSec,
        unit.codInep,
      ].some((value) => normalizeSearch(value).includes(query)))
      .sort((left, right) => {
        const leftExact = left.codSec === query || left.codInep === query
        const rightExact = right.codSec === query || right.codInep === query
        return Number(rightExact) - Number(leftExact) || left.name.localeCompare(right.name, 'pt-BR')
      })
  }, [schoolSearch])
  const visibleSchools = matchingSchools.slice(0, 20)

  useEffect(() => {
    if (!schoolPickerOpen) return undefined

    const closeOnOutsidePointer = (event) => {
      if (!schoolPickerRef.current?.contains(event.target)) setSchoolPickerOpen(false)
    }

    document.addEventListener('pointerdown', closeOnOutsidePointer)
    return () => document.removeEventListener('pointerdown', closeOnOutsidePointer)
  }, [schoolPickerOpen])

  useEffect(() => {
    let active = true
    setLoading(true)
    setLoadError('')
    setForm(null)

    getListeningForm(formId)
      .then((result) => {
        if (!active) return
        if (!result || result.status !== 'open') {
          setLoadError('Esta escuta não está recebendo novas ideias no momento.')
          return
        }
        setForm(result)
      })
      .catch((error) => {
        console.error('getListeningForm failed', error)
        if (active) {
          setLoadError(error.code === 'permission-denied'
            ? 'Esta escuta não está recebendo novas ideias no momento.'
            : 'Não foi possível abrir esta escuta. Verifique o link ou tente novamente.')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [formId])

  const updateValue = (key, value) => {
    setValues((current) => ({ ...current, [key]: value }))
  }

  const chooseSchool = (school) => {
    updateValue('schoolId', school.codSec)
    setSchoolSearch('')
    setSchoolPickerOpen(false)
    setActiveSchoolIndex(0)
  }

  const submit = async (event) => {
    event.preventDefault()
    if (sending || !form) return
    if (!values.occupation) {
      setSubmitError('Informe sua ocupação para continuar.')
      return
    }
    if (values.occupation === 'Outro' && !values.otherOccupation.trim()) {
      setSubmitError('Informe sua ocupação no campo “Outro”.')
      return
    }

    setSending(true)
    setSubmitError('')
    try {
      await submitListeningEntry({
        formId,
        mode: form.mode ?? 'open',
        ...values,
        choiceIndex: values.choiceIndex === '' ? -1 : Number(values.choiceIndex),
      })
      setSubmitted(true)
    } catch (error) {
      console.error('submitListeningEntry failed', error)
      setSubmitError(error.code === 'permission-denied'
        ? (form.mode === 'vote'
          ? 'Este voto não pôde ser registrado. Se esta aba já votou, a escolha já foi contabilizada; caso contrário, a votação pode ter sido encerrada.'
          : 'Esta escuta foi encerrada e não recebe mais respostas.')
        : error.message || 'Não foi possível enviar sua ideia. Tente novamente.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fala-app voice-page">
      <header className="voice-header">
        <Logo size="sm" />
        <span className="voice-header__label">{form?.mode === 'vote' ? 'VOTAÇÃO ABERTA' : 'ESCUTA ABERTA'}</span>
      </header>

      <main className="voice-main">
        {loading ? (
          <section className="voice-state" role="status">Preparando um espaço para a sua ideia…</section>
        ) : loadError ? (
          <section className="voice-state" role="alert">
            <p className="fala-eyebrow">MAPA DE VOZES</p>
            <h1>Por agora, este espaço está em silêncio.</h1>
            <p>{loadError}</p>
            <button type="button" className="fala-button fala-button--secondary mt-6" onClick={onBack}>
              <ArrowLeft size={16} /> Voltar ao início
            </button>
          </section>
        ) : submitted ? (
          <section className="voice-thanks cs-fade-in" aria-labelledby="voice-thanks-title">
            <span className="voice-stamp"><Sprout size={24} /></span>
            <p className="fala-eyebrow">{form?.mode === 'vote' ? 'VOTO REGISTRADO' : 'IDEIA SEMEADA'}</p>
            <h1 id="voice-thanks-title">
              {form?.mode === 'vote' ? 'Sua escolha agora faz parte desta construção.' : 'Sua voz agora faz parte do caminho.'}
            </h1>
            <p>
              {form?.mode === 'vote'
                ? `Obrigado, ${getSubmittedVoterName(formId) || values.name}. Seu voto foi registrado. Este navegador não pode enviar outro voto nesta aba.`
                : `Obrigado, ${values.name}. Sua proposta foi registrada para inspirar esta conversa.`}
            </p>
            <button type="button" className="fala-button fala-button--secondary mt-7" onClick={onBack}>
              Concluir <ArrowRight size={16} />
            </button>
          </section>
        ) : (
          <>
            <div className="voice-intro cs-slide-up">
              <div className="voice-kicker"><span /> UMA CONSTRUÇÃO COLETIVA</div>
              <h1>{form.title}</h1>
              <p>{form.introduction || 'Toda jornada começa com uma pergunta que vale a pena compartilhar.'}</p>
              <div className="voice-note">
                {form.mode === 'vote' ? <Sprout size={17} /> : <Feather size={17} />}
                <span>{form.mode === 'vote'
                  ? 'Escolha um único tema. Este navegador registra apenas um voto por escuta nesta aba.'
                  : 'Não é uma votação. É um convite para dizer o que merece espaço na conversa.'}</span>
              </div>
              <div className="voice-deadline" role="note">
                <span>PERÍODO DA CONSULTA</span>
                <strong>A consulta está disponível de 3 a 8 de novembro.</strong>
              </div>
            </div>

            <form className="voice-form cs-slide-up" onSubmit={submit}>
              <div className="voice-form__heading">
                <span>01 — DE ONDE VOCÊ FALA</span>
                <span>SEU CONTEXTO</span>
              </div>
              <div className="voice-fields">
                <label className="voice-field">
                  <span>Seu nome <b>obrigatório</b></span>
                  <input
                    value={values.name}
                    onChange={(event) => updateValue('name', event.target.value)}
                    required
                    minLength={2}
                    maxLength={80}
                    autoComplete="name"
                    placeholder="Como podemos chamar você?"
                  />
                </label>

                <label className="voice-field">
                  <span>Sua ocupação <b>obrigatório</b></span>
                  <select
                    value={values.occupation}
                    onChange={(event) => {
                      updateValue('occupation', event.target.value)
                      if (event.target.value !== 'Outro') updateValue('otherOccupation', '')
                    }}
                    required
                  >
                    <option value="" disabled>Selecione sua ocupação</option>
                    <option value="Estudante">Estudante</option>
                    <option value="Professor da educação básica">Professor da educação básica</option>
                    <option value="Professor universitário">Professor universitário</option>
                    <option value="Gestor">Gestor</option>
                    <option value="Coordenação Pedagógica">Coordenação Pedagógica</option>
                    <option value="Outro">Outro</option>
                  </select>
                </label>

                {values.occupation === 'Outro' && (
                  <label className="voice-field">
                    <span>Qual é sua ocupação? <b>obrigatório</b></span>
                    <input
                      value={values.otherOccupation}
                      onChange={(event) => updateValue('otherOccupation', event.target.value)}
                      required
                      maxLength={80}
                      placeholder="Descreva sua ocupação"
                    />
                  </label>
                )}

                <div className="voice-field voice-field--full">
                  <label htmlFor="voice-school-search">
                    <span>Sua unidade escolar <b>opcional</b></span>
                  </label>
                  <div
                    ref={schoolPickerRef}
                    className="voice-school-picker"
                    onBlur={(event) => {
                      if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) {
                        setSchoolPickerOpen(false)
                      }
                    }}
                  >
                    <input
                      id="voice-school-search"
                      role="combobox"
                      aria-required="false"
                      aria-autocomplete="list"
                      aria-expanded={schoolPickerOpen}
                      aria-controls="voice-school-options"
                      aria-activedescendant={
                        schoolPickerOpen && visibleSchools[activeSchoolIndex]
                          ? `voice-school-option-${visibleSchools[activeSchoolIndex].codSec}`
                          : undefined
                      }
                      value={schoolSearch}
                      onFocus={() => setSchoolPickerOpen(true)}
                      onChange={(event) => {
                        setSchoolSearch(event.target.value)
                        setSchoolPickerOpen(true)
                        setActiveSchoolIndex(0)
                        updateValue('schoolId', '')
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Escape') setSchoolPickerOpen(false)
                        if (event.key === 'ArrowDown' && visibleSchools.length) {
                          event.preventDefault()
                          setSchoolPickerOpen(true)
                          setActiveSchoolIndex((index) => Math.min(index + 1, visibleSchools.length - 1))
                        }
                        if (event.key === 'ArrowUp' && visibleSchools.length) {
                          event.preventDefault()
                          setSchoolPickerOpen(true)
                          setActiveSchoolIndex((index) => Math.max(index - 1, 0))
                        }
                        if (event.key === 'Enter' && schoolPickerOpen) {
                          event.preventDefault()
                          if (visibleSchools[activeSchoolIndex]) chooseSchool(visibleSchools[activeSchoolIndex])
                        }
                      }}
                      autoComplete="off"
                      placeholder="Pesquise por nome, código SEC ou MEC/INEP"
                    />
                    {schoolPickerOpen && (
                      <div id="voice-school-options" className="voice-school-options" role="listbox" aria-label="Unidades escolares">
                        {!schoolSearch.trim() ? (
                          <p>Digite o nome da unidade ou um dos códigos para pesquisar.</p>
                        ) : visibleSchools.length ? (
                          <>
                            {visibleSchools.map((school, index) => (
                              <button
                                type="button"
                                id={`voice-school-option-${school.codSec}`}
                                role="option"
                                aria-selected={activeSchoolIndex === index}
                                key={school.codSec}
                                onPointerDown={(event) => {
                                  if (event.pointerType === 'mouse') event.preventDefault()
                                }}
                                onPointerEnter={() => setActiveSchoolIndex(index)}
                                onClick={() => chooseSchool(school)}
                              >
                                <strong>{school.name}</strong>
                                <span>
                                  {school.municipality} · SEC {school.codSec}
                                  {school.codInep ? ` · MEC/INEP ${school.codInep}` : ' · INEP não informado'}
                                </span>
                              </button>
                            ))}
                            {matchingSchools.length > visibleSchools.length && (
                              <p>Mostrando 20 resultados. Refine a busca para localizar sua unidade.</p>
                            )}
                          </>
                        ) : (
                          <p>Nenhuma unidade encontrada com esse nome ou código.</p>
                        )}
                      </div>
                    )}
                  </div>
                  {selectedSchool && !schoolPickerOpen && (
                    <span className="voice-school-selected" role="status" aria-live="polite">
                      Selecionada: {selectedSchool.name} · SEC {selectedSchool.codSec}
                      {selectedSchool.codInep ? ` · MEC/INEP ${selectedSchool.codInep}` : ''}
                    </span>
                  )}
                </div>
              </div>

              {form.mode === 'vote' ? (
                <>
                  <div className="voice-form__heading">
                    <span>02 — SUA ESCOLHA</span>
                    <span>UM VOTO</span>
                  </div>
                  <fieldset className="vote-options">
                    <legend>{form.topicPrompt}</legend>
                    {form.options.map((option, index) => (
                      <label className={`vote-option${Number(values.choiceIndex) === index ? ' is-selected' : ''}`} key={`${index}-${option}`}>
                        <input
                          type="radio"
                          name="listening-vote"
                          value={index}
                          checked={Number(values.choiceIndex) === index}
                          onChange={(event) => updateValue('choiceIndex', event.target.value)}
                          required
                        />
                        <span className="vote-option__marker" aria-hidden="true" />
                        <span className="vote-option__number">{String(index + 1).padStart(2, '0')}</span>
                        <strong>{option}</strong>
                      </label>
                    ))}
                  </fieldset>
                </>
              ) : (
                <>
                  <div className="voice-form__heading">
                    <span>02 — A IDEIA QUE VOCÊ TRAZ</span>
                    <span>O CENTRO DA CONVERSA</span>
                  </div>
                  <label className="voice-field voice-field--large">
                    <span>{form.topicPrompt} <b>obrigatório</b></span>
                    <input
                      value={values.theme}
                      onChange={(event) => updateValue('theme', event.target.value)}
                      required
                      minLength={5}
                      maxLength={180}
                      placeholder="Dê um nome à ideia — ela não precisa estar pronta."
                    />
                  </label>
                  <label className="voice-field voice-field--large">
                    <span>Por que esse tema importa para a sua escola? <b>obrigatório</b></span>
                    <textarea
                      value={values.importance}
                      onChange={(event) => updateValue('importance', event.target.value)}
                      required
                      minLength={10}
                      maxLength={1200}
                      rows={4}
                      placeholder="Que desafio, experiência ou desejo do cotidiano escolar trouxe esse tema até aqui?"
                    />
                  </label>

                  <div className="voice-prompt">
                    <span>03 — SE QUISER IR UM POUCO ALÉM</span>
                    <label className="voice-field voice-field--large">
                      <span>Que pergunta ou experiência você gostaria de levar para a roda?</span>
                      <textarea
                        value={values.question}
                        onChange={(event) => updateValue('question', event.target.value)}
                        maxLength={800}
                        rows={3}
                        placeholder="Pode ser uma pergunta, uma prática que funciona ou algo que ainda inquieta."
                      />
                    </label>
                  </div>
                </>
              )}

              <p className="voice-privacy">
                Seu nome, ocupação e, se informada, sua unidade serão compartilhados apenas com a equipe que organiza esta escuta.
                {form.mode === 'vote' && ' O voto fica vinculado a esses dados para contextualizar a consulta.'}
              </p>
              {submitError && <p className="fala-error" role="alert">{submitError}</p>}
              <div className="voice-submit-row">
                <span>{form.mode === 'vote' ? 'Uma escolha por aba. Muitas vozes revelam os temas prioritários.' : 'Uma ideia de cada vez. Muitas vozes fazem o mapa.'}</span>
                <button type="submit" className="fala-button" disabled={sending}>
                  {sending
                    ? (form.mode === 'vote' ? 'Registrando seu voto…' : 'Registrando sua ideia…')
                    : form.mode === 'vote'
                      ? <>Confirmar meu voto <ArrowRight size={16} /></>
                      : <>Semeia essa ideia <Sprout size={16} /></>}
                </button>
              </div>
            </form>
          </>
        )}
      </main>
      <footer className="voice-footer">FALA SEC <span>·</span> ESCUTA QUE VIRA CAMINHO</footer>
    </div>
  )
}
