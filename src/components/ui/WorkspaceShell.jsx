import { FolderClosed, PanelsTopLeft, LogOut, MessageCircle } from 'lucide-react'
import Logo from './Logo'

export default function WorkspaceShell({
  children,
  active = 'presentations',
  onPresentations,
  onListening,
  onTemplates,
  onLogout,
  name,
  email,
}) {
  return (
    <div className="fala-app workspace">
      <aside className="workspace-sidebar">
        <Logo />
        <nav className="workspace-nav" aria-label="Navegação do estúdio">
          <button
            type="button"
            aria-current={active === 'presentations' ? 'page' : undefined}
            onClick={onPresentations}
          >
            <FolderClosed size={17} />
            Apresentações
          </button>
          <button
            type="button"
            aria-current={active === 'templates' ? 'page' : undefined}
            onClick={onTemplates}
          >
            <PanelsTopLeft size={17} />
            Modelos
          </button>
          <button
            type="button"
            aria-current={active === 'listening' ? 'page' : undefined}
            onClick={onListening}
          >
            <MessageCircle size={17} />
            Escutas
          </button>
        </nav>
        <div className="workspace-sidebar__footer">
            <img src="/brasao-bahia.png" alt="" /> 
         </div>
      </aside>
      <div className="workspace-content">
        <header className="workspace-topbar">
          <div className="workspace-mobile-logo">
            <Logo size="sm" />
          </div>
          <span>Estúdio / {active === 'templates' ? 'Modelos' : active === 'listening' ? 'Escutas' : 'Apresentações'}</span>
          <div className="workspace-account">
            <span title={email}>{name || 'Fala SEC'}</span>
            {onLogout && (
              <button type="button" onClick={onLogout} aria-label="Sair da conta" title="Sair da conta">
                <LogOut size={16} />
              </button>
            )}
          </div>
        </header>
        <main className="workspace-main">{children}</main>
      </div>
    </div>
  )
}
