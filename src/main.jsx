import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './design.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'

const unregisterLegacyServiceWorkers = async () => {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
  const registrations = await navigator.serviceWorker.getRegistrations()
  if (!registrations.length) return

  await Promise.all(registrations.map((registration) => registration.unregister()))

  const cleanupKey = 'cloudspeak-legacy-service-worker-cleaned'
  if (typeof sessionStorage !== 'undefined' && !sessionStorage.getItem(cleanupKey)) {
    sessionStorage.setItem(cleanupKey, '1')
    window.location.reload()
  }
}

void unregisterLegacyServiceWorkers().catch(() => {})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
