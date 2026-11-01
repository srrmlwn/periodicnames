import React from 'react';
import Header from './Header';
import PeriodicTable from './PeriodicTable';
import { LEGAL_UPDATED, SUPPORT_EMAIL } from '../data/contact';

const TermsPage: React.FC = () => (
  <div className="min-h-screen">
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 flex items-center justify-center">
      <PeriodicTable />
    </div>

    <div className="relative z-10 flex flex-col" style={{ minHeight: '100dvh' }}>
      <div className="px-4 pt-4 shrink-0">
        <Header />
      </div>

      <main className="mx-auto w-full max-w-2xl px-6 py-10 flex-1">
        <a href="/" className="nb-btn bg-white text-sm px-3 py-1.5 mb-8">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Periodic Names
        </a>

        <div className="nb-card px-6 py-7 sm:px-8 sm:py-8">
          <h1 className="text-3xl font-bold text-ink mb-1">Terms of Service</h1>
          <p className="text-xs font-bold text-muted mb-8">Last updated {LEGAL_UPDATED}</p>

          <Section title="Who we are">
            <p>Periodic Names (periodicnames.com) is run by After Hours Apps. "We" and "us" in these terms means After Hours Apps.</p>
          </Section>

          <Section title="What you're buying">
            <p>Periodic Names sells custom print-on-demand t-shirts with your name spelled out in periodic table element tiles. Each shirt is printed to order by our print partner, Printful, and shipped directly to you.</p>
            <p>Where a name can't be spelled with real elements, we fill the gaps with made-up "newly discovered" elements marked NEW. These are part of the fun, not real chemistry.</p>
            <p>By placing an order you confirm you are at least 18 years old and are authorised to use the payment method provided.</p>
          </Section>

          <Section title="Your design">
            <p>You choose the name, caption, colour, size and placement. Please check them carefully before you pay: we print exactly what you see in the preview, including any spelling mistakes.</p>
            <p>You must have the right to use any text you add. We may refuse or cancel, with a full refund, any order whose text we consider offensive or infringing.</p>
            <p>Colours on screen and in previews are approximate; printed colours can vary slightly.</p>
          </Section>

          <Section title="Pricing and payment">
            <p>All prices are in US dollars. The price shown at checkout is the total you pay and includes standard shipping within the United States.</p>
            <p>Payments are processed securely by Stripe. We never see or store your card details.</p>
          </Section>

          <Section title="Shipping and delivery">
            <p>We currently ship to US addresses only. Your order goes to print as soon as payment is confirmed. Production usually takes 2–5 business days, and US delivery usually takes a further 3–7 business days. Printful emails you a tracking link when your order ships.</p>
            <p>Delivery estimates are not guarantees. We are not liable for delays caused by carriers or events outside our control.</p>
          </Section>

          <Section title="Cancellations">
            <p>Because printing starts quickly, we can only cancel an order that hasn't entered production. If you need to cancel or change an order, reply to your confirmation email straight away and we'll do our best.</p>
          </Section>

          <Section title="Refunds and returns">
            <p>Because every item is made to order and personalised, <strong>all sales are final</strong>. We do not accept returns or offer refunds for a change of mind or a wrong size chosen, except in the following cases:</p>
            <ul>
              <li>The item arrives damaged, defective or misprinted.</li>
              <li>The item doesn't match the design and options you ordered.</li>
              <li>The order never arrives.</li>
            </ul>
            <p>If your order has a problem, email us within 14 days of delivery (or of the expected delivery date, for a lost order) with your order details and a photo, and we will arrange a replacement or refund at no cost to you.</p>
          </Section>

          <Section title="Intellectual property">
            <p>The Periodic Names app, element tile designs, and any generated artwork are owned by After Hours Apps. By placing an order you receive a personal, non-commercial licence to use the printed item.</p>
            <p>You may not reproduce, resell, or use Periodic Names designs for commercial purposes without written permission. Images and videos you create with the share feature are yours to post on social media.</p>
          </Section>

          <Section title="Limitation of liability">
            <p>To the fullest extent permitted by law, we are not liable for any indirect, incidental, or consequential damages arising from your use of the site or purchase of products. Our total liability for any claim is limited to the amount you paid for the order in question.</p>
          </Section>

          <Section title="Changes to these terms">
            <p>We may update these terms from time to time. The current version is always at periodicnames.com/tos.html, and the terms in force when you placed an order apply to that order.</p>
          </Section>

          <Section title="Contact">
            <p>Questions or a problem with an order? Email <a href={`mailto:${SUPPORT_EMAIL}`} className="text-ink font-bold underline decoration-2 underline-offset-2">{SUPPORT_EMAIL}</a>, or simply reply to your order confirmation email.</p>
          </Section>
        </div>
      </main>

      <footer className="px-4 py-5 text-center text-xs font-medium text-muted">
        <a href="/privacy.html" className="underline decoration-2 underline-offset-2 hover:text-ink">Privacy Policy</a>
        <span className="mx-2">·</span>
        <a href="/" className="underline decoration-2 underline-offset-2 hover:text-ink">Periodic Names</a>
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
    <h2 className="inline-block text-sm font-bold text-ink uppercase tracking-wider mb-3 bg-pop-yellow border-2 border-ink px-1.5">{title}</h2>
    <div className="space-y-3 text-sm text-ink leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_strong]:text-ink [&_a]:underline [&_a]:underline-offset-2">
      {children}
    </div>
  </section>
);

export default TermsPage;
