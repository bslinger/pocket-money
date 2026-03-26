import { useState, type FormEvent } from 'react';
import PhoneMockup from './PhoneMockup';

const LOOPS_FORM_URL = 'https://app.loops.so/api/newsletter-form/cmn6vgp1u0ktn0i3cvwyyl33j';

export default function Hero() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  async function handleEmailSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email || status === 'submitting' || status === 'success') return;
    setStatus('submitting');
    try {
      const body = new URLSearchParams({ email });
      const response = await fetch(LOOPS_FORM_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });
      if (response.ok) {
        setStatus('success');
        setEmail('');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  return (
    <section className="bg-bark-50 px-[5%]">
      <div className="mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-2 min-h-[calc(100vh-60px)] items-center gap-[60px] py-[60px]">
        {/* Phone mockup — hidden on mobile */}
        <div className="hidden md:flex order-first md:order-none">
          <PhoneMockup />
        </div>

        {/* Hero text */}
        <div>
          <div className="inline-flex items-center gap-1.5 bg-eucalyptus-50 text-eucalyptus-600 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-5 border border-eucalyptus-100">
            {'\uD83C\uDDE6\uD83C\uDDFA'} Made for Aussie families
          </div>
          <h1 className="font-display text-[52px] font-bold leading-[1.1] tracking-tight text-bark-700 mb-[18px]">
            Your kids.<br />Their money.<br /><em className="text-eucalyptus-400 not-italic">All sorted.</em>
          </h1>
          <p className="text-[17px] text-bark-500 leading-relaxed mb-8 max-w-[420px]">
            Track what your kids earn, spend, and save — without the forgotten IOUs, the Sunday cash scramble, or the spreadsheet you abandoned after a week.
          </p>

          <form id="waitlist-form" className="flex flex-col gap-3 max-w-[400px]" onSubmit={handleEmailSubmit}>
            <input
              id="waitlist-email"
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              disabled={status === 'success'}
              className="px-4 py-3.5 border-[1.5px] border-bark-200 rounded-[10px] text-[15px] text-bark-700 bg-white placeholder-bark-400 focus:outline-none focus:border-eucalyptus-400 transition-colors font-body disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={status === 'submitting' || status === 'success'}
              className="bg-eucalyptus-400 text-white py-4 rounded-[10px] text-[15px] font-semibold hover:bg-eucalyptus-500 transition-colors text-center disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {status === 'submitting' ? 'Joining…' : status === 'success' ? "You're in ✓" : 'Join the waitlist'}
            </button>
            {status === 'success' && (
              <p className="text-sm text-eucalyptus-600 text-center font-medium">
                You're on the list! We'll let you know when Quiddo launches.
              </p>
            )}
            {status === 'error' && (
              <p className="text-sm text-redearth-500 text-center">
                Something went wrong — please try again.{' '}
                <button type="button" className="underline" onClick={() => setStatus('idle')}>Retry</button>
              </p>
            )}
          </form>

        </div>
      </div>
    </section>
  );
}
