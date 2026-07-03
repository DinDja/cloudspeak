import { motion } from 'framer-motion'
import { ArrowLeft, ShieldCheck, Wifi, BarChart3, Cloud, MessageSquareText, Users } from 'lucide-react'
import Logo from '../ui/Logo'
import Badge from '../ui/Badge'
import {
  IconArrowLeft,
  IconShield,
} from '../icons/Icons'

export default function AuthLayout({ title, subtitle, onBack, children, footer }) {
  return (
    <div className="relative min-h-[100dvh] overflow-hidden font-sans text-[#09090B] bg-[#F4F4F0]">
      <div className="pointer-events-none absolute inset-0 cs-grid opacity-30 cs-mask-radial" />

      <div className="relative z-10 mx-auto flex min-h-[100dvh] max-w-7xl flex-col items-stretch px-6 py-8 lg:flex-row lg:px-10">
        <aside className="hidden flex-1 items-center lg:flex">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-lg"
          >
            <h2 className="text-4xl font-black uppercase tracking-tight text-[#09090B] sm:text-5xl">
              Faça parte do{' '}
              <span className="cs-gradient-text">estúdio Fala Secti</span>
            </h2>
            <p className="mt-4 text-base font-bold leading-relaxed text-slate-600">
              Acesso dedicado para a equipe da SECTI Bahia. Crie apresentações profissionais, engaje o público em tempo real e colete dados para suas decisões.
            </p>
            <div className="mt-8 grid gap-3">
              {[
                { icon: BarChart3, label: 'Enquetes e rankings ao vivo' },
                { icon: Cloud, label: 'Nuvem de palavras interativa' },
                { icon: MessageSquareText, label: 'Q&A com moderação em tempo real' },
                { icon: Users, label: 'Seleção de times com vagas' },
              ].map((row) => (
                <div key={row.label} className="flex items-center gap-3 border-2 border-[#09090B] bg-white p-3 shadow-[3px_3px_0px_0px_#09090B]">
                  <span className="flex h-10 w-10 items-center justify-center border-2 border-[#09090B] bg-[#09090B] text-white">
                    <row.icon className="h-4 w-4" />
                  </span>
                  <p className="text-sm font-bold text-slate-700">{row.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-10 flex items-center gap-3 text-xs font-black uppercase tracking-widest text-[#09090B]">
              <Wifi className="h-4 w-4" />
              Funciona em qualquer navegador · sem instalação
            </div>
          </motion.div>
        </aside>

        <main className="flex flex-1 items-center justify-center">
          <motion.div
            className="w-full max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="mb-8 flex flex-col items-center text-center">
              <Logo size="md" />
            </div>

            <div className="relative border-[3px] border-[#09090B] bg-white p-7 shadow-[8px_8px_0px_0px_#09090B] sm:p-9">
              <div className="absolute inset-x-0 top-0 h-1.5 bg-[#09090B]" />
              <h1 className="text-2xl font-black uppercase tracking-tight text-[#09090B]">{title}</h1>
              {subtitle && <p className="mt-2 text-sm font-bold leading-relaxed text-slate-600">{subtitle}</p>}
              <div className="mt-8">{children}</div>
            </div>

            <div className="mt-8 flex items-center justify-between">
              {onBack ? (
                <button
                  type="button"
                  onClick={onBack}
                  className="inline-flex items-center gap-1.5 border-2 border-transparent px-2 py-1 text-xs font-black uppercase tracking-widest text-[#09090B] transition-all duration-100 hover:border-[#09090B] hover:bg-[#E2FF32] hover:shadow-[2px_2px_0px_0px_#09090B] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                >
                  <ArrowLeft className="h-4 w-4" /> Voltar
                </button>
              ) : <span />}
              {footer}
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  )
}
