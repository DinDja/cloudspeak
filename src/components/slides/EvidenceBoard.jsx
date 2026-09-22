import { useMemo } from 'react'
import avancaLogo from '../../../Avança+/LOGO SEM FUNDO.png'
import {
  AlertTriangle,
  BarChart3,
  Clock3,
  FileText,
  Hash,
  MessageSquareText,
  Users,
  UserCheck,
} from 'lucide-react'
import { buildEvidenceSnapshot } from '../../lib/evidenceBoard'

const formatDateTime = (value) => {
  const timestamp = typeof value?.toMillis === 'function' ? value.toMillis() : Date.parse(value ?? '')
  if (!timestamp || Number.isNaN(timestamp)) return 'horário não informado'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp))
}

const MetricCard = ({ icon, label, value, accent = '#a01818' }) => {
  const IconComponent = icon
  return (
    <article
      className="relative overflow-hidden border border-[#2a1b10]/25 bg-[#f8f4e9] px-3 py-3 shadow-[3px_5px_12px_rgba(0,0,0,0.28)] sm:px-4"
    >
      <span className="absolute -right-3 -top-3 h-12 w-12 rounded-full opacity-20" style={{ backgroundColor: accent }} />
      <IconComponent className="relative h-4 w-4" style={{ color: accent }} />
      <p className="relative mt-2 font-display text-2xl font-semibold leading-none text-[#1a1410] sm:text-3xl">{value}</p>
      <p className="relative mt-1 text-[9px] font-bold uppercase tracking-[0.14em] text-[#5b3a1a]">{label}</p>
    </article>
  )
}

const EvidenceCard = ({ children, className = '' }) => (
  <article
    className={`relative border border-[#2a1b10]/25 bg-[#f8f4e9] p-3 text-left shadow-[4px_6px_14px_rgba(0,0,0,0.34)] sm:p-4 ${className}`}
  >
    <span className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rounded-full bg-[#a01818] shadow-[0_2px_4px_rgba(0,0,0,0.45)]" />
    {children}
  </article>
)

export default function EvidenceBoard({ session, responses = [], participants = [] }) {
  const snapshot = useMemo(
    () => buildEvidenceSnapshot({ slides: session?.slides, responses, participants }),
    [session?.slides, responses, participants],
  )
  const maxQuestionCount = Math.max(snapshot.topQuestion?.count ?? 0, 1)
  const maxKeywordCount = Math.max(snapshot.keywords[0]?.count ?? 0, 1)
  const eventTitle = session?.sessionLabel || session?.title || 'Evento Avança + Bahia'

  return (
    <div className="relative flex min-h-[620px] w-full flex-col overflow-hidden border-[10px] border-[#5b3a1a] bg-[#b58a4e] p-3 text-[#1a1410] shadow-[0_20px_60px_rgba(0,0,0,0.42)] sm:min-h-[680px] sm:p-5">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(0,0,0,.08) 0 2px, transparent 3px), radial-gradient(circle at 70% 60%, rgba(0,0,0,.06) 0 2px, transparent 3px), repeating-linear-gradient(115deg, transparent 0 3px, rgba(0,0,0,.025) 3px 4px)',
          backgroundSize: '24px 24px, 31px 31px, auto',
        }}
      />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <header className="mb-4 border-b-2 border-[#5b3a1a]/40 pb-3 sm:mb-5 sm:pb-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <span className="inline-block border-2 border-[#a01818] px-2 py-1 font-mono text-[9px] font-bold tracking-[0.16em] text-[#a01818] sm:text-[10px]">
                Seção · {session?.code || '------'}
              </span>
              <img
                src={avancaLogo}
                alt="Avança + Bahia"
                className="mt-2 block h-auto w-[190px] object-contain object-left sm:w-[260px]"
              />
              <p className="mt-1 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#3d2710] sm:text-xs">
                Quadro de evidências
              </p>
            </div>
            <div className="max-w-[280px] text-right font-mono text-[9px] uppercase leading-4 tracking-[0.08em] text-[#3d2710] sm:text-[10px]">
              <p className="font-bold">Registro final da escuta</p>
              <p className="mt-1">{eventTitle}</p>
            </div>
          </div>
        </header>

        <div className="cs-scroll-thin min-h-0 flex-1 overflow-y-auto pr-1">
          <section className="grid grid-cols-2 gap-2 pb-4 sm:grid-cols-3 sm:gap-3 lg:grid-cols-6">
            <MetricCard icon={MessageSquareText} label="Contribuições" value={snapshot.totalResponses} />
            <MetricCard icon={Users} label="Contribuintes" value={snapshot.contributorCount} accent="#6843a1" />
            <MetricCard icon={UserCheck} label="Presenças" value={snapshot.attendanceCount} accent="#2752d8" />
            <MetricCard icon={BarChart3} label="Perguntas respondidas" value={`${snapshot.answeredQuestions}/${snapshot.questionCount}`} accent="#0f766e" />
            <MetricCard icon={AlertTriangle} label="Sem resposta" value={snapshot.unansweredQuestions} accent="#c2414d" />
            <MetricCard icon={Clock3} label="Média por pergunta" value={snapshot.averageResponses} accent="#b16e58" />
          </section>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
            <EvidenceCard>
              <div className="mb-3 flex items-center justify-between border-b border-dashed border-[#7a1010]/40 pb-2">
                <h3 className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-[#7a1010]">Termos recorrentes</h3>
                <Hash className="h-4 w-4 text-[#7a1010]" />
              </div>
              {snapshot.keywords.length ? (
                <div className="flex flex-wrap items-center gap-2">
                  {snapshot.keywords.map((keyword) => (
                    <span
                      key={keyword.key}
                      className="inline-flex items-center gap-1 rounded-sm border border-[#3d2710]/20 bg-[#e8e2d0] px-2 py-1 font-mono font-bold text-[#1a1410]"
                      style={{
                        fontSize: `${Math.max(0.66, Math.min(1.15, 0.68 + (keyword.count / maxKeywordCount) * 0.47))}rem`,
                      }}
                    >
                      {keyword.term}
                      <small className="text-[9px] font-normal text-[#7a1010]">{keyword.count}</small>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="font-mono text-xs text-[#555]">Nenhuma palavra recorrente disponível.</p>
              )}
              <p className="mt-4 font-mono text-[9px] leading-4 text-[#555]">
                Contagem por resposta distinta; palavras comuns foram removidas.
              </p>
            </EvidenceCard>

            <EvidenceCard>
              <div className="mb-3 flex items-center justify-between border-b border-dashed border-[#7a1010]/40 pb-2">
                <h3 className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-[#7a1010]">Atividade por pergunta</h3>
                <span className="font-mono text-[9px] text-[#555]">{snapshot.topQuestion ? `P${String(snapshot.topQuestion.index + 1).padStart(2, '0')} MAIS ATIVA` : 'SEM REGISTROS'}</span>
              </div>
              <div className="space-y-2">
                {snapshot.questionStats.map((entry) => (
                  <div key={entry.id} className="grid grid-cols-[28px_minmax(0,1fr)_36px] items-center gap-2 font-mono text-[10px]">
                    <span className="font-bold text-[#7a1010]">{String(entry.index + 1).padStart(2, '0')}</span>
                    <div>
                      <p className="truncate text-[#222]" title={entry.question}>{entry.question}</p>
                      <div className="mt-1 h-1.5 overflow-hidden bg-[#e1d9c5]">
                        <div className="h-full bg-[#a01818]" style={{ width: `${Math.round((entry.count / maxQuestionCount) * 100)}%` }} />
                      </div>
                    </div>
                    <span className="text-right font-bold text-[#1a1410]">{entry.count}</span>
                  </div>
                ))}
              </div>
            </EvidenceCard>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            <EvidenceCard>
              <div className="mb-3 flex items-center justify-between border-b border-dashed border-[#7a1010]/40 pb-2">
                <h3 className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-[#7a1010]">Contribuições literais</h3>
                <FileText className="h-4 w-4 text-[#7a1010]" />
              </div>
              {snapshot.excerpts.length ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {snapshot.excerpts.map((excerpt) => (
                    <blockquote key={`${excerpt.questionIndex}-${excerpt.createdAt?.toMillis?.() ?? excerpt.value}`} className="border-l-2 border-[#a01818] pl-2 font-mono text-[10px] leading-4 text-[#222]">
                      <p className="line-clamp-3">“{excerpt.value}”</p>
                      <footer className="mt-1 text-[9px] font-bold uppercase tracking-wide text-[#7a1010]">
                        Pergunta {String(excerpt.questionIndex + 1).padStart(2, '0')} · {formatDateTime(excerpt.createdAt)}
                      </footer>
                    </blockquote>
                  ))}
                </div>
              ) : (
                <p className="font-mono text-xs text-[#555]">Ainda não há contribuições literais.</p>
              )}
            </EvidenceCard>

            <EvidenceCard>
              <div className="mb-3 flex items-center justify-between border-b border-dashed border-[#7a1010]/40 pb-2">
                <h3 className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-[#7a1010]">Linha do tempo</h3>
                <Clock3 className="h-4 w-4 text-[#7a1010]" />
              </div>
              {snapshot.timeline.length ? (
                <div className="space-y-2">
                  {snapshot.timeline.map((entry) => {
                    const percentage = Math.round((entry.count / Math.max(...snapshot.timeline.map((item) => item.count), 1)) * 100)
                    return (
                      <div key={entry.timestamp} className="grid grid-cols-[42px_minmax(0,1fr)_24px] items-center gap-2 font-mono text-[10px]">
                        <span>{new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(entry.timestamp))}</span>
                        <div className="h-2 overflow-hidden bg-[#e1d9c5]"><div className="h-full bg-[#6843a1]" style={{ width: `${percentage}%` }} /></div>
                        <span className="text-right font-bold">{entry.count}</span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="font-mono text-xs text-[#555]">Horários não disponíveis.</p>
              )}
              <p className="mt-4 font-mono text-[9px] leading-4 text-[#555]">Intervalos de 15 minutos, conforme os registros recebidos.</p>
            </EvidenceCard>
          </div>
        </div>

        <footer className="mt-4 border-t-2 border-[#5b3a1a]/40 pt-3 text-center font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-[#3d2710] sm:text-[10px]">
          {snapshot.totalResponses} contribuições registradas · documento de escuta · não remover da sala
        </footer>
      </div>
    </div>
  )
}
