export default function Pricing() {
  return (
    <section id="pricing" className="bg-bark-50 border-t border-bark-200 py-[72px] px-[5%] text-center">
      <div className="max-w-[700px] mx-auto">
        <h2 className="font-display text-[34px] font-semibold text-bark-700 mb-2">Simple pricing</h2>
        <p className="text-[15px] text-bark-500 mb-10">Per family. Not per child. Up to 12 kids on every plan.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
          {/* Annual — featured */}
          <div className="bg-eucalyptus-600 rounded-[14px] p-7 border-[1.5px] border-eucalyptus-600 text-white">
            <div className="inline-block bg-wattle-400 text-bark-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full mb-3">Best value</div>
            <div className="text-[11px] font-bold uppercase tracking-[0.6px] text-white/50 mb-2">Annual</div>
            <div className="font-display text-[38px] font-bold text-wattle-300 leading-none">
              $15<span className="text-[13px] font-normal text-white/40">/year</span>
            </div>
            <p className="text-[13px] text-white/55 mt-1">That's just $1.25/month</p>
            <p className="text-[13px] text-white/55 mt-2.5 mb-5 leading-snug">Save 37% vs monthly. The full Quiddo for the whole family.</p>
            <div className="flex flex-col gap-2 mb-6">
              {['Up to 12 children', 'Recurring chores + approval', 'Savings goals', 'Auto pocket money', 'Kid-facing view', 'Multi-parent access', 'Responsibilities mode'].map(f => (
                <div key={f} className="text-[13px] text-white/75 flex gap-2 items-start">
                  <span className="text-wattle-300 font-bold flex-shrink-0 mt-px">{'\u2713'}</span>{f}
                </div>
              ))}
            </div>
            <a
              href="https://app.quiddo.com.au/register"
              className="block w-full py-2.5 rounded-full text-sm font-semibold text-center bg-wattle-400 text-bark-700 hover:bg-wattle-300 transition-colors"
            >
              Get started
            </a>
          </div>

          {/* Monthly */}
          <div className="bg-white rounded-[14px] p-7 border-[1.5px] border-bark-200">
            <div className="text-[11px] font-bold uppercase tracking-[0.6px] text-bark-400 mb-2">Monthly</div>
            <div className="font-display text-[38px] font-bold text-bark-700 leading-none">
              $1.99<span className="text-[13px] font-normal text-bark-400">/month</span>
            </div>
            <p className="text-[13px] text-bark-500 mt-2.5 mb-5 leading-snug">All features, month to month. Cancel any time.</p>
            <div className="flex flex-col gap-2 mb-6">
              {['Up to 12 children', 'Recurring chores + approval', 'Savings goals', 'Auto pocket money', 'Kid-facing view', 'Multi-parent access', 'Responsibilities mode'].map(f => (
                <div key={f} className="text-[13px] text-bark-600 flex gap-2 items-start">
                  <span className="text-gumleaf-400 font-bold flex-shrink-0 mt-px">{'\u2713'}</span>{f}
                </div>
              ))}
            </div>
            <a
              href="https://app.quiddo.com.au/register"
              className="block w-full py-2.5 rounded-full text-sm font-semibold text-center border-[1.5px] border-bark-200 text-bark-700 hover:border-bark-300 transition-colors"
            >
              Get started
            </a>
          </div>
        </div>

        <p className="text-[13px] text-bark-400 mt-5">
          No lock-in contracts · Cancel any time · Prices in AUD
        </p>
      </div>
    </section>
  );
}
