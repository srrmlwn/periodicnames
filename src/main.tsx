import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import PrivacyPage from './components/PrivacyPage.tsx'
import TermsPage from './components/TermsPage.tsx'
import './index.css'
import { initAnalytics } from './utils/analytics'

const path = window.location.pathname;

let root: React.ReactNode;
if (path === '/privacy.html') {
  root = <PrivacyPage />;
} else if (path === '/tos.html') {
  root = <TermsPage />;
} else {
  root = <App />;
}

if (document.readyState === 'complete') initAnalytics();
else window.addEventListener('load', initAnalytics, { once: true });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {root}
  </React.StrictMode>,
)
