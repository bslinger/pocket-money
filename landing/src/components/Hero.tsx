import { useState, type FormEvent } from 'react';
import PhoneMockup from './PhoneMockup';

export default function Hero() {
  const [email, setEmail] = useState('');

  function handleEmailSubmit(e: FormEvent) {
    e.preventDefault();
    const dest = email
      ? `https://app.quiddo.com.au/register?email=${encodeURIComponent(email)}`
      : 'https://app.quiddo.com.au/register';
    window.location.href = dest;
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

          <form className="flex flex-col gap-3 max-w-[400px]" onSubmit={handleEmailSubmit}>
            <input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="px-4 py-3.5 border-[1.5px] border-bark-200 rounded-[10px] text-[15px] text-bark-700 bg-white placeholder-bark-400 focus:outline-none focus:border-eucalyptus-400 transition-colors font-body"
            />
            <button
              type="submit"
              className="bg-eucalyptus-400 text-white py-4 rounded-[10px] text-[15px] font-semibold hover:bg-eucalyptus-500 transition-colors text-center"
            >
              Get started — from just $1.25/month
            </button>
            <p className="text-xs text-bark-400 text-center">
              By signing up you agree to our{' '}
              <a href="#" className="text-eucalyptus-400 hover:underline">Terms</a>
              {' '}and{' '}
              <a href="#" className="text-eucalyptus-400 hover:underline">Privacy Policy</a>
            </p>
          </form>

          <p className="text-sm text-bark-500 mt-2 text-center max-w-[400px]">
            Already have an account?{' '}
            <a href="https://app.quiddo.com.au/login" className="text-eucalyptus-400 font-semibold hover:underline">Log in</a>
          </p>
        </div>
      </div>
    </section>
  );
}
