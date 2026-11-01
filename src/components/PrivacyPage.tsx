import React from 'react';
import Header from './Header';
import PeriodicTable from './PeriodicTable';
import { LEGAL_UPDATED, SUPPORT_EMAIL } from '../data/contact';

const PrivacyPage: React.FC = () => (
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
          <h1 className="text-3xl font-bold text-ink mb-1">Privacy Policy</h1>
          <p className="text-xs font-bold text-muted mb-8">Last updated {LEGAL_UPDATED}</p>

          <Section title="Who we are">
            <p>Periodic Names (periodicnames.com) is run by After Hours Apps. This policy explains what we collect and why.</p>
          </Section>

          <Section title="Spelling a name">
            <p>Spelling a name with the periodic table happens entirely in your browser. Share images and videos are also made in your browser and are only sent wherever you choose to share them.</p>
            <p>A link to a name (for example periodicnames.com/ada) contains that name, so it reaches our hosting provider like any web address you visit.</p>
            <p>We use PostHog for anonymous, cookieless analytics: which pages are visited and which features are used, for example that a name was spelled, a share video was made or the shirt designer was opened. We never send the names you type (name links are recorded as /[name]), PostHog sets no cookies and stores nothing in your browser, and IP addresses are discarded. We don't use advertising or tracking cookies.</p>
            <p>The site's font is loaded from Google Fonts, which receives your IP address when the page loads.</p>
          </Section>

          <Section title="What we collect when you order">
            <ul>
              <li><strong>Your design:</strong> the name and caption you entered, and your colour, size and placement choices.</li>
              <li><strong>Your contact and shipping details:</strong> your name, email address and US shipping address, entered on Stripe's checkout page.</li>
              <li><strong>Payment:</strong> handled entirely by Stripe. We never see or store your card details.</li>
            </ul>
            <p>To print your shirt we store an image of your design and a picture of your shirt at hard-to-guess web addresses that aren't listed anywhere. These are also created when you tap "See it on a model" (the design is sent to Printful to make the photo) or start checkout, even if you don't finish your order.</p>
          </Section>

          <Section title="How we use it">
            <p>We use your information only to make, ship and support your order: to send it to the printer, to email you an order confirmation, to let Printful email you shipping updates, and to answer you if you contact us.</p>
            <p>We do not use your information for marketing, and we do not sell or rent it to anyone.</p>
          </Section>

          <Section title="Who we share it with">
            <p>We share order details only with the services needed to complete your purchase:</p>
            <ul>
              <li><strong>Stripe</strong> processes your payment and sends your receipt. See stripe.com/privacy.</li>
              <li><strong>Printful</strong> prints and ships your order and receives your design, name, email and shipping address. See printful.com/policies/privacy.</li>
              <li><strong>Resend</strong> delivers our order confirmation email. See resend.com/legal/privacy-policy.</li>
              <li><strong>PostHog</strong> receives anonymous usage events, including that an order was paid (amount, shirt colour and size, but no name, email or address). See posthog.com/privacy.</li>
              <li><strong>Vercel</strong> hosts the site, stores your design images, and keeps short-lived service logs that can include order details. See vercel.com/legal/privacy-policy.</li>
              <li><strong>Google</strong> hosts our support inbox (Gmail), so emails you send us are stored there.</li>
            </ul>
          </Section>

          <Section title="Security">
            <p>All data in transit is encrypted via HTTPS/TLS. Payment processing is handled by Stripe, a PCI-DSS Level 1 certified provider.</p>
          </Section>

          <Section title="Data retention">
            <p>We keep order records for as long as needed to fulfil and support your order and to meet tax and accounting obligations. Service logs are deleted automatically within days. You can ask us to delete your personal data once your order is complete, except where we must keep it by law.</p>
          </Section>

          <Section title="Children">
            <p>Ordering is for adults 18 and over. Many people make shirts with their children's names; we use those names only to print the order.</p>
          </Section>

          <Section title="Your rights">
            <p>You may request access to, correction of, or deletion of the personal data we hold about you. Email us at the address below and we'll respond within 30 days.</p>
          </Section>

          <Section title="Changes">
            <p>If we change this policy, we will update this page and the date above.</p>
          </Section>

          <Section title="Contact">
            <p>Questions about this policy? Email <a href={`mailto:${SUPPORT_EMAIL}`} className="text-ink font-bold underline decoration-2 underline-offset-2">{SUPPORT_EMAIL}</a>.</p>
          </Section>
        </div>
      </main>

      <footer className="px-4 py-5 text-center text-xs font-medium text-muted">
        <a href="/tos.html" className="underline decoration-2 underline-offset-2 hover:text-ink">Terms of Service</a>
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

export default PrivacyPage;
