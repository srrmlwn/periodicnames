import React from 'react';
import Header from './Header';
import PeriodicTable from './PeriodicTable';

const TermsPage: React.FC = () => (
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
          <h1 className="text-2xl font-bold text-slate-800 mb-1">Terms of Service</h1>
          <p className="text-xs text-slate-400 mb-8">Last updated May 3, 2026</p>

          <Section title="What you're buying">
            <p>Periodic Names sells custom print-on-demand t-shirts featuring your name spelled out with periodic table element tiles. Each item is printed to order by Printful and shipped directly to you.</p>
            <p>By placing an order you confirm you are at least 18 years old and are authorised to use the payment method provided.</p>
          </Section>

          <Section title="Pricing and payment">
            <p>All prices are in US dollars and include the cost of printing. Shipping costs and any applicable taxes are calculated at checkout.</p>
            <p>Payments are processed securely by Stripe. We never store your card details.</p>
          </Section>

          <Section title="Refunds and returns">
            <p>Because every item is made to order and personalised, <strong>all sales are final</strong>. We do not accept returns or offer refunds except in the following cases:</p>
            <ul>
              <li>The item arrives damaged or defective.</li>
              <li>The wrong item or size was shipped.</li>
            </ul>
            <p>If your order has a problem, email us within 14 days of delivery with a photo and we will arrange a replacement or refund at no cost to you.</p>
          </Section>

          <Section title="Shipping and delivery">
            <p>Orders are fulfilled and shipped by Printful. Production typically takes 2–5 business days, followed by shipping time depending on your location and the shipping method selected at checkout.</p>
            <p>Delivery estimates are not guarantees. We are not liable for delays caused by carriers, customs, or events outside our control.</p>
          </Section>

          <Section title="Intellectual property">
            <p>The Periodic Names app, element tile designs, and any generated artwork are owned by Periodic Names. By placing an order you receive a personal, non-commercial licence to use the printed item.</p>
            <p>You may not reproduce, resell, or use Periodic Names designs for commercial purposes without written permission.</p>
          </Section>

          <Section title="Limitation of liability">
            <p>To the fullest extent permitted by law, Periodic Names is not liable for any indirect, incidental, or consequential damages arising from your use of the site or purchase of products. Our total liability for any claim is limited to the amount you paid for the order in question.</p>
          </Section>

          <Section title="Changes to these terms">
            <p>We may update these terms from time to time. The current version is always at periodicnames.com/tos.html. Continued use of the site after changes constitutes acceptance of the new terms.</p>
          </Section>

          <Section title="Contact">
            <p>Questions? Email <a href="mailto:periodicnames.com@gmail.com" className="text-slate-600 underline underline-offset-2">periodicnames.com@gmail.com</a>.</p>
          </Section>
        </div>
      </main>

      <footer className="px-4 py-4 text-center text-xs text-slate-400">
        <a href="/privacy.html" className="hover:text-slate-600 transition-colors">Privacy Policy</a>
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

export default TermsPage;
