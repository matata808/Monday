import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/react'
import './index.css'
import App from './App.jsx'
import { AuthGate } from './components/AuthGate.jsx'
import { clerkEnabled } from './shared/clerk.js'

const app = (
  <AuthGate>
    <App />
  </AuthGate>
)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {clerkEnabled ? (
      <ClerkProvider
        publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
        afterSignOutUrl="/"
      >
        {app}
      </ClerkProvider>
    ) : (
      app
    )}
  </StrictMode>,
)
