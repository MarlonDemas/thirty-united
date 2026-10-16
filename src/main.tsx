import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { LazyMotion, domAnimation } from 'motion/react'
import './index.css'
import App from './App.tsx'
import { captureInviteKey } from './lib/inviteKey'

captureInviteKey()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LazyMotion features={domAnimation} strict>
      <App />
    </LazyMotion>
  </StrictMode>,
)
