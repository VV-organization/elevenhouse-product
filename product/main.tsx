import {DemoShell} from './demo/DemoShell'
import {DemoFrame} from './demo/DemoFrame'
import {showcaseView} from './demo/showcase-model'
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
import './components/entrance-motion.css'

const demoQuery=new URLSearchParams(window.location.search)
const content=demoQuery.get('demo')==='1'?<DemoShell/>:demoQuery.has('demoFrame')?<DemoFrame view={showcaseView(demoQuery.get('demoFrame'))}/>:<App/>
createRoot(document.getElementById('product-root')!).render(<StrictMode>{content}</StrictMode>)
