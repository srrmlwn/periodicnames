import React, { useEffect, useState } from 'react';
import Header from './Header';
import PeriodicTable from './PeriodicTable';
import { SUPPORT_EMAIL } from '../data/contact';

type Stage = 'received' | 'printing' | 'shipped' | 'problem' | 'canceled';

interface Shipment {
  carrier: string;
  trackingNumber: string;
  trackingUrl: string;
  shippedAt: string | null;
}

interface OrderStatus {
  stage: Stage;
  placedAt: string;
  shirt: { color: string; size: string } | null;
  shipments: Shipment[];
}

type LoadState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; order: OrderStatus };

const STEPS: { stage: Stage; label: string; detail: string }[] = [
  { stage: 'received', label: 'Order received', detail: 'Your design is with our print partner.' },
  { stage: 'printing', label: 'Printing', detail: 'Usually 2–5 business days.' },
  { stage: 'shipped', label: 'Shipped', detail: 'US delivery usually takes 3–7 business days.' },
];

const STAGE_INDEX: Record<Stage, number> = { received: 0, printing: 1, shipped: 2, problem: 1, canceled: -1 };

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function readParams(): { id: string; key: string } | null {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const key = params.get('key');
  return id && key ? { id, key } : null;
}

const Steps: React.FC<{ stage: Stage }> = ({ stage }) => {
  const current = STAGE_INDEX[stage];
  return (
    <ol className="space-y-3 mb-6">
      {STEPS.map((step, i) => {
        const done = i <= current;
        return (
          <li key={step.stage} className="flex gap-3 items-start">
            <span className={`w-7 h-7 shrink-0 flex items-center justify-center rounded-md border-2 border-ink text-sm font-bold ${done ? 'bg-pop-yellow' : 'bg-white text-ink/30 border-ink/30'}`}>
              {done ? '✓' : i + 1}
            </span>
            <div>
              <p className={`font-bold ${done ? 'text-ink' : 'text-ink/40'}`}>{step.label}</p>
              {i === current && <p className="text-sm text-muted">{step.detail}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
};

const ShipmentCard: React.FC<{ shipment: Shipment }> = ({ shipment }) => (
  <div className="border-[3px] border-ink rounded-lg p-4 mb-3">
    <p className="text-sm text-muted">{shipment.carrier}{shipment.shippedAt ? ` · shipped ${formatDate(shipment.shippedAt)}` : ''}</p>
    <p className="font-bold text-ink break-all mb-3">{shipment.trackingNumber}</p>
    <a href={shipment.trackingUrl} target="_blank" rel="noopener noreferrer" className="nb-btn bg-pop-yellow px-4 py-2">Track your package</a>
  </div>
);

const Notice: React.FC<{ stage: Stage }> = ({ stage }) => {
  if (stage === 'problem') {
    return <p className="text-sm text-ink mb-6 border-2 border-ink bg-pop-coral/30 rounded-md px-3 py-2">There's a hold-up with your order. We've been alerted and will email you if we need anything.</p>;
  }
  if (stage === 'canceled') {
    return <p className="text-sm text-ink mb-6 border-2 border-ink bg-pop-coral/30 rounded-md px-3 py-2">This order was canceled. If you didn't expect this, please email us.</p>;
  }
  return null;
};

const OrderDetails: React.FC<{ order: OrderStatus }> = ({ order }) => (
  <>
    <p className="text-sm font-medium text-muted mb-6">
      Placed {formatDate(order.placedAt)}{order.shirt ? ` · ${order.shirt.color} · ${order.shirt.size}` : ''}
    </p>
    <Notice stage={order.stage} />
    {order.stage !== 'canceled' && <Steps stage={order.stage} />}
    {order.shipments.map(s => <ShipmentCard key={s.trackingNumber} shipment={s} />)}
  </>
);

const OrderStatusPage: React.FC = () => {
  const [state, setState] = useState<LoadState>({ kind: 'loading' });

  useEffect(() => {
    const params = readParams();
    if (!params) {
      setState({ kind: 'error', message: 'This order link is incomplete. Use the link from your order email.' });
      return;
    }
    fetch(`/api/order/status?id=${encodeURIComponent(params.id)}&key=${encodeURIComponent(params.key)}`)
      .then(async res => {
        if (res.status === 404) throw new Error('We couldn\'t find this order. Use the link from your order email.');
        if (!res.ok) throw new Error('We couldn\'t load your order right now. Please try again in a minute.');
        setState({ kind: 'ready', order: (await res.json()) as OrderStatus });
      })
      .catch((err: Error) => setState({ kind: 'error', message: err.message }));
  }, []);

  return (
    <div className="min-h-screen">
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 flex items-center justify-center">
        <PeriodicTable />
      </div>
      <div className="relative z-10 flex flex-col" style={{ minHeight: '100dvh' }}>
        <div className="px-4 pt-4 shrink-0">
          <Header />
        </div>
        <main className="mx-auto w-full max-w-md px-6 py-10 flex-1">
          <div className="nb-card px-6 py-7">
            <h1 className="text-2xl font-bold text-ink mb-1">Your order</h1>
            {state.kind === 'loading' && <p className="text-sm text-muted">Checking with the printer…</p>}
            {state.kind === 'error' && <p className="text-sm text-ink">{state.message}</p>}
            {state.kind === 'ready' && <OrderDetails order={state.order} />}
            <p className="text-sm text-muted mt-6">
              Questions? Email <a href={`mailto:${SUPPORT_EMAIL}`} className="text-ink font-bold underline decoration-2 underline-offset-2">{SUPPORT_EMAIL}</a>.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default OrderStatusPage;
