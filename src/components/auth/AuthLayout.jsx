import { ArrowLeft } from 'lucide-react'
import Logo from '../ui/Logo'
import ConversationArtwork from '../ui/ConversationArtwork'

export default function AuthLayout({ title, subtitle, onBack, children, footer }) {
  return (
    <div className="fala-app auth-page">
      <header className="auth-header">
        <Logo />
        {onBack && (
          <button type="button" onClick={onBack} className="fala-link">
            <ArrowLeft size={16} />
            Participar de uma apresentação
          </button>
        )}
      </header>
      <main className="auth-main">
        <ConversationArtwork />
        <section className="auth-form">
          <h1>{title}</h1>
          {subtitle && <p className="auth-form__subtitle">{subtitle}</p>}
          {children}
          {footer && <div className="auth-form__footer">{footer}</div>}
        </section>
      </main>
      <footer className="public-footer">
        <span>Fala SEC / Acesso institucional</span>
        <img src="/brasao-bahia.png" alt="" className="h-12" />
      </footer>
    </div>
  )
}
