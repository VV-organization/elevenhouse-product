import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './auth/auth.css'
import './product.css'
import './modules.css'
import './dark.css'
import './product-polish.css'

createRoot(document.getElementById('product-root')!).render(<StrictMode><App /></StrictMode>)
