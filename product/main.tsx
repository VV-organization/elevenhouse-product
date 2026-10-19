import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './auth/auth.css'
import './product.css'
import './modules.css'
import './dark.css'
import './data-visual-palette.css'
import './product-polish.css'
import './hover-feedback.css'

createRoot(document.getElementById('product-root')!).render(<StrictMode><App /></StrictMode>)
