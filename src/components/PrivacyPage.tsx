import React from 'react';
import Header from './Header';
import PeriodicTable from './PeriodicTable';

const PrivacyPage: React.FC = () => (
  <div className="min-h-screen bg-slate-50">
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 flex items-center justify-center">
      <PeriodicTable highlightedSymbols={[]} />
    </div>

    <div className="relative z-10 flex flex-col" style={{ minHeight: '100dvh' }}>
      <div className="px-4 pt-4 shrink-0">
        <Header />
      </div>

      <main className="mx-auto w-full max-w-2xl px-6 py-10 flex-1">
        <a href="/" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors mb-8">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Periodic Names
        </a>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-8 py-8 shadow-sm border border-slate-100">
          <h1 className="text-2xl font-bold text-slate-800 mb-1">Privacy Policy</h1>
          <p className="text-xs text-slate-400 mb-8">Last updated May 1, 2026</p>

          <Section title="What we collect">
            <p>When you place an order, we collect your name, email address, and shipping address. This information is required to fulfill and ship your order.</p>
            <p>The name you type into the app is processed entirely in your browser and is never sent to our servers.</p>
          </Section>

          <Section title="How we use it">
            <p>Your contact and shipping information is used solely to fulfill your print-on-demand order and to send you a shipping confirmation.</p>
            <p>We do not use your information for marketing, and we do not sell or rent it to third parties.</p>
          </Section>

          <Section title="Who we share it with">
            <p>We share your order details with the following services, which are necessary to complete your purchase:</p>
            <ul>
              <li><strong>Stripe</strong> — processes your payment. Your card details go directly to Stripe and are never seen or stored by us. Stripe's privacy policy is at stripe.com/privacy.</li>
              <li><strong>Printful</strong> — prints and ships your order. Printful receives your name, email, and shipping address. Printful's privacy policy is at printful.com/policies/privacy.</li>
            </ul>
            <p>No other third parties receive your personal information.</p>
          </Section>

          <Section title="Payment security">
            <p>All payment processing is handled by Stripe, a PCI-DSS Level 1 certified provider. We never store your payment card details.</p>
            <p>All data in transit is encrypted via HTTPS/TLS.</p>
          </Section>

          <Section title="Data retention">
            <p>Order records are retained for as long as necessary to fulfil the order and comply with accounting obligations. You may contact us to request deletion of your personal data once your order is complete.</p>
          </Section>

          <Section title="Your rights">
            <p>You may request access to, correction of, or deletion of any personal data we hold about you. To make a request, email us at the address below.</p>
          </Section>

          <Section title="Contact">
            <p>Questions about this policy? Email <a href="mailto:hello@periodicnames.com" className="text-slate-600 underline underline-offset-2">hello@periodicnames.com</a>.</p>
          </Section>
        </div>
      </main>

      <footer className="px-4 py-4 text-center text-xs text-slate-400">
        <a href="/terms" className="hover:text-slate-600 transition-colors">Terms of Service</a>
        <span className="mx-2">·</span>
        <a href="/" className="hover:text-slate-600 transition-colors">Periodic Names</a>
      </footer>
    </div>
  </div>
);

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, children }) => (
  <section className="mb-7">
    <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">{title}</h2>
    <div className="space-y-3 text-sm text-slate-600 leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_strong]:text-slate-700 [&_a]:underline [&_a]:underline-offset-2">
      {children}
    </div>
  </section>
);

export default PrivacyPage;
