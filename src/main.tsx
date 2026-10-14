import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { LazyMotion, domAnimation } from 'motion/react'
import { ConvexProvider, ConvexReactClient } from 'convex/react'
import { z } from 'zod'
import './index.css'
import App from './App.tsx'
import { captureInviteKey } from './lib/inviteKey'

// Skip zod 4's Function("") JIT probe: it trips the CSP (no 'unsafe-eval').
z.config({ jitless: true })

captureInviteKey()

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConvexProvider client={convex}>
      <LazyMotion features={domAnimation} strict>
        <App />
      </LazyMotion>
    </ConvexProvider>
  </StrictMode>,
)
