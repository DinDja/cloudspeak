import { useAuth } from '../../hooks/useAuth'
import { FullPageLoader } from '../ui/Spinner'

export default function AuthGuard({ gate, children }) {
  const { status } = useAuth()
  if (status === 'loading') return <FullPageLoader label="Verificando acesso..." />
  if (status !== 'verified') return gate ?? null
  return children
}
