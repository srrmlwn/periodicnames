import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import PrivacyPage from './components/PrivacyPage.tsx'
import TermsPage from './components/TermsPage.tsx'
import './index.css'

const path = window.location.pathname;

let root: React.ReactNode;
if (path === '/privacy') {
  root = <PrivacyPage />;
} else if (path === '/terms') {
  root = <TermsPage />;
} else {
  root = <App />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {root}
  </React.StrictMode>,
)
