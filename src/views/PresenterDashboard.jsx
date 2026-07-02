import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Search,
  Sparkles,
  LogOut,
  ChevronRight,
  Calendar,
  Layers as LayersIcon,
  BarChart3,
  Users,
  Clock,
  Filter,
  Copy,
  Trash2,
  Edit3,
  Play,
  TrendingUp,
  History,
} from 'lucide-react'
import Logo from '../components/ui/Logo'
import Modal from '../components/ui/Modal'
import PresentationCard from '../components/presenter/PresentationCard'
import { useAuth } from '../hooks/useAuth'
import { useSavedPresentations } from '../hooks/useSavedPresentations'

const FILTER_TABS = [
  { id: 'all', label: 'TODAS', icon: LayersIcon },
  { id: 'recent', label: 'RECENTES', icon: History },
  { id: 'popular', label: 'POPULARES', icon: TrendingUp },
]

function formatRelativeDate(timestamp) {
  if (!timestamp) return '—'
  const millis = typeof timestamp.toMillis === 'function' ? timestamp.toMillis() : timestamp
  if (typeof millis !== 'number') return '—'
  const diff = Date.now() - millis
  const day = 86400000
  if (diff < day) return 'HOJE'
  if (diff < 2 * day) return 'ONTEM'
  if (diff < 7 * day) return `${Math.floor(diff / day)} DIAS ATRÁS`
  return new Date(millis).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).toUpperCase()
}

// Animações mais "secas" e rápidas para combinar com a interface dura
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.05 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "linear" } },
}

export default function PresenterDashboard({ onNew, onEdit, onPresent, onDuplicate, onDelete, onLogout }) {
  const { displayName, email, uid } = useAuth()
  const { presentations, loading, error } = useSavedPresentations(uid)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const greeting = displayName || (email ? email.split('@')[0] : 'APRESENTADOR')

  const filtered = useMemo(() => {
    let list = presentations
    if (filter === 'recent') {
      list = [...list].sort((a, b) => (b.updatedAt?.toMillis?.() ?? 0) - (a.updatedAt?.toMillis?.() ?? 0)).slice(0, 6)
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      list = list.filter((p) => (p.title ?? '').toLowerCase().includes(q))
    }
    return list
  }, [presentations, query, filter])

  const stats = useMemo(() => {
    const total = presentations.length
    const slides = presentations.reduce((acc, p) => acc + (p.slides?.length ?? 0), 0)
    const lastWeek = presentations.filter((p) => {
      const t = p.updatedAt?.toMillis?.()
      return typeof t === 'number' && Date.now() - t < 7 * 86400000
    }).length
    return [
      { label: 'APRESENTAÇÕES', value: total, icon: LayersIcon, color: 'bg-[#FF90E8]' },
      { label: 'SLIDES TOTAIS', value: slides, icon: BarChart3, color: 'bg-[#40E0D0]' },
      { label: 'EDITADAS ESTA SEMANA', value: lastWeek, icon: Clock, color: 'bg-[#FF6B6B]' },
    ]
  }, [presentations])

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await onDelete(deleteTarget)
      setDeleteTarget(null)
    } catch (err) {
      console.error('delete presentation failed', err)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="cs-grid relative min-h-[100dvh] overflow-hidden bg-[#F4F4F0] font-sans text-[#09090B]">
      {/* Header Neobrutalista: Fundo sólido e borda grossa */}
      <header className="sticky top-0 z-30 border-b-[3px] border-[#09090B] bg-[#F4F4F0]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4 sm:px-8">
          <div className="flex items-center gap-4">
            <Logo size="sm" />
            <span className="hidden border-[2px] border-[#09090B] bg-[#E2FF32] px-2 py-0.5 text-xs font-black uppercase tracking-widest sm:inline-flex">
              ESTÚDIO
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden text-right md:block">
              <p className="text-sm font-black uppercase tracking-wider text-[#09090B]">{greeting}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#09090B]/60">{email}</p>
            </div>
            
            {/* Avatar Quadrado/Duro */}
            <div className="relative">
              <div className="flex h-10 w-10 items-center justify-center border-[2px] border-[#09090B] bg-[#FF0055] text-lg font-black uppercase text-white shadow-[2px_2px_0px_0px_#09090B]">
                {(greeting[0] ?? 'A').toUpperCase()}
              </div>
            </div>

            <button
              type="button"
              onClick={onLogout}
              title="Sair"
              className="flex items-center gap-2 border-[2px] border-transparent px-3 py-2 text-sm font-black uppercase tracking-wider text-[#09090B] transition-none hover:border-[#09090B] hover:bg-[#E2FF32] hover:shadow-[2px_2px_0px_0px_#09090B] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              <LogOut className="h-4 w-4" strokeWidth={2.5} />
              <span className="hidden sm:inline">SAIR</span>
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-6 pb-20 pt-10 sm:px-8 sm:pt-14">
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-12 grid items-end gap-10 lg:grid-cols-[1.4fr_1fr]"
        >
          <div>
            <div className="inline-flex items-center gap-2 border-[2px] border-[#09090B] bg-white px-3 py-1.5 text-xs font-black uppercase tracking-widest text-[#09090B] shadow-[2px_2px_0px_0px_#09090B]">
              <Sparkles className="h-4 w-4" />
              OLÁ, {greeting}
            </div>
            <h1 className="mt-6 text-4xl font-black uppercase tracking-tighter text-[#09090B] sm:text-6xl">
              Vamos criar algo <br />
              <span className="inline-block bg-[#E2FF32] px-2 py-1 leading-none border-[3px] border-[#09090B] shadow-[4px_4px_0px_0px_#09090B] -rotate-1 mt-2">
                INESQUECÍVEL
              </span> hoje?
            </h1>
            <p className="mt-6 border-l-[4px] border-[#09090B] pl-4 text-base font-bold uppercase tracking-wider text-[#09090B]/80 max-w-xl">
              Suas apresentações estão organizadas abaixo. Continue de onde parou, duplique ou lance uma nova sessão.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label} className="cs-card flex flex-col items-center justify-center p-4 text-center">
                <div className={`mb-3 flex h-12 w-12 items-center justify-center border-[3px] border-[#09090B] ${stat.color} text-[#09090B] shadow-[2px_2px_0px_0px_#09090B]`}>
                  <stat.icon className="h-6 w-6" strokeWidth={2.5} />
                </div>
                <p className="text-3xl font-black tracking-tighter text-[#09090B]">{stat.value}</p>
                <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-[#09090B]/70">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Toolbar de Filtros e Busca */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between"
        >
          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-3">
            {FILTER_TABS.map((tab) => {
              const Icon = tab.icon
              const active = filter === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className={`flex items-center gap-2 border-[3px] border-[#09090B] px-4 py-2 text-xs font-black uppercase tracking-widest transition-none ${
                    active
                      ? 'bg-[#09090B] text-white shadow-[4px_4px_0px_0px_#E2FF32] translate-x-[-2px] translate-y-[-2px]'
                      : 'bg-white text-[#09090B] shadow-[4px_4px_0px_0px_#09090B] hover:bg-[#F4F4F0] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none'
                  }`}
                >
                  <Icon className="h-4 w-4" strokeWidth={2.5} />
                  {tab.label}
                </button>
              )
            })}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
            <div className="relative w-full sm:w-72">
              <div className="pointer-events-none absolute inset-y-0 left-4 my-auto flex items-center text-[#09090B]">
                <Search className="h-5 w-5" strokeWidth={3} />
              </div>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="BUSCAR APRESENTAÇÃO..."
                className="cs-input-base w-full pl-12 uppercase"
              />
            </div>
            
            <button 
              onClick={onNew} 
              className="cs-btn-base flex-shrink-0 h-[56px] px-6 gap-2 !bg-[#E2FF32] !text-[#09090B]"
            >
              <Plus className="h-5 w-5" strokeWidth={3} />
              <span className="hidden sm:inline">NOVA APRESENTAÇÃO</span>
              <span className="sm:hidden">NOVA</span>
            </button>
          </div>
        </motion.div>

        {/* Content Area */}
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="cs-card h-64 animate-pulse bg-slate-200" />
            ))}
          </div>
        ) : error ? (
           <div className="cs-card border-[#FF0055] p-8 text-center bg-white">
             <h3 className="text-xl font-black uppercase text-[#09090B]">Erro ao carregar</h3>
             <p className="mt-2 font-bold uppercase tracking-wide text-[#09090B]/70">{error}</p>
           </div>
        ) : filtered.length === 0 ? (
          presentations.length === 0 ? (
            <EmptyDashboard onNew={onNew} />
          ) : (
            <div className="cs-card p-12 text-center bg-white">
              <Search className="mx-auto h-12 w-12 text-[#09090B] mb-4" strokeWidth={2} />
              <h3 className="text-2xl font-black uppercase text-[#09090B]">Nada encontrado</h3>
              <p className="mt-2 font-bold uppercase tracking-wide text-[#09090B]/70">
                {query ? `NENHUMA APRESENTAÇÃO COM "${query}".` : 'TENTE OUTRO FILTRO.'}
              </p>
            </div>
          )
        ) : (
          <motion.div
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={cardVariants}>
              <NewPresentationTile onClick={onNew} />
            </motion.div>
            
            {filtered.map((presentation) => (
              <motion.div key={presentation.id} variants={cardVariants}>
                <PresentationCard
                  presentation={presentation}
                  onEdit={onEdit}
                  onPresent={onPresent}
                  onDuplicate={onDuplicate}
                  onDelete={(p) => setDeleteTarget(p)}
                  formatRelativeDate={formatRelativeDate}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>

      {/* Modal de Exclusão estilizado para o neobrutalismo */}
      <Modal open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} maxWidth="max-w-md">
        <div className="border-[4px] border-[#09090B] bg-white p-6 shadow-[8px_8px_0px_0px_#09090B]">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center border-[3px] border-[#09090B] bg-[#FF0055] text-white shadow-[4px_4px_0px_0px_#09090B]">
              <Trash2 className="h-6 w-6" strokeWidth={2.5} />
            </span>
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight text-[#09090B]">Apagar apresentação?</h3>
              <p className="mt-3 text-sm font-bold uppercase tracking-wide leading-relaxed text-[#09090B]/80">
                <strong className="bg-[#FF0055] text-white px-1">"{deleteTarget?.title}"</strong> SERÁ REMOVIDA PARA SEMPRE. SESSÕES AO VIVO JÁ LANÇADAS NÃO SERÃO AFETADAS.
              </p>
            </div>
          </div>
          
          <div className="mt-8 flex items-center justify-end gap-4">
            <button 
              onClick={() => setDeleteTarget(null)}
              className="border-[3px] border-[#09090B] bg-white px-4 py-2 font-black uppercase tracking-wider text-[#09090B] hover:bg-[#F4F4F0] active:translate-x-[2px] active:translate-y-[2px]"
            >
              Cancelar
            </button>
            <button 
              onClick={confirmDelete} 
              disabled={deleting}
              className="cs-btn-base px-6 py-2 !bg-[#FF0055] !text-white disabled:opacity-50"
            >
              {deleting ? 'APAGANDO...' : 'SIM, APAGAR'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function NewPresentationTile({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cs-card group flex h-full min-h-[280px] w-full flex-col p-6 text-left hover:bg-[#E2FF32] outline-none"
    >
      <div className="flex h-full flex-col">
        <span className="flex h-16 w-16 items-center justify-center border-[4px] border-[#09090B] bg-white text-[#09090B] shadow-[4px_4px_0px_0px_#09090B] transition-transform group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:shadow-[2px_2px_0px_0px_#09090B] group-active:translate-y-1 group-active:translate-x-0 group-active:shadow-none">
          <Plus className="h-8 w-8" strokeWidth={4} />
        </span>
        
        <h3 className="mt-8 text-2xl font-black uppercase tracking-tight text-[#09090B] group-hover:underline decoration-[3px] underline-offset-4">
          Nova apresentação
        </h3>
        
        <p className="mt-3 text-sm font-bold uppercase tracking-wide leading-relaxed text-[#09090B]/80">
          Comece de um modelo ou em branco — decida em segundos.
        </p>
        
        <div className="mt-auto flex items-center gap-2 pt-6 text-sm font-black uppercase text-[#09090B]">
          CRIAR AGORA <ChevronRight className="h-5 w-5 border-[2px] border-[#09090B] rounded-full bg-white transition-transform group-hover:translate-x-2" strokeWidth={3} />
        </div>
      </div>
    </button>
  )
}

function EmptyDashboard({ onNew }) {
  return (
    <div className="cs-card border-[4px] bg-white p-12 text-center">
      <div className="mx-auto flex h-24 w-24 items-center justify-center border-[4px] border-[#09090B] bg-[#FF90E8] text-[#09090B] shadow-[8px_8px_0px_0px_#09090B] -rotate-3">
        <Sparkles className="h-12 w-12" strokeWidth={2.5} />
      </div>
      
      <h2 className="mt-8 text-3xl font-black uppercase tracking-tight text-[#09090B]">
        Sua primeira apresentação está a um clique.
      </h2>
      
      <p className="mx-auto mt-4 max-w-lg text-sm font-bold uppercase tracking-wide leading-relaxed text-[#09090B]/80">
        ESCOLHEMOS UMA COLEÇÃO DE MODELOS PROFISSIONAIS PARA VOCÊ LANÇAR MAIS RÁPIDO. PERSONALIZE TUDO ANTES DE IR AO VIVO.
      </p>
      
      <button 
        onClick={onNew} 
        className="cs-btn-base mt-8 inline-flex px-8 py-4 text-lg !bg-[#E2FF32] !text-[#09090B]"
      >
        <Plus className="mr-2 h-6 w-6" strokeWidth={3} />
        CRIAR PRIMEIRA APRESENTAÇÃO
      </button>
    </div>
  )
}