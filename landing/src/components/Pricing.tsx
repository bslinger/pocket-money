const FEATURES = [
  'Up to 12 children',
  'Recurring chores + approval',
  'Savings goals',
  'Auto pocket money',
  'Kid-facing view',
  'Multi-parent access',
  'Responsibilities mode',
];

export default function Pricing() {
  return (
    <section id="pricing" className="bg-bark-50 border-t border-bark-200 pt-10 pb-[72px] px-[5%] text-center">
      <div className="max-w-[700px] mx-auto">
        <h2 className="font-display text-[34px] font-semibold text-bark-700 mb-2">Simple pricing</h2>
        <p className="text-[15px] text-bark-500 mb-10">Per family. Not per child. Up to 12 kids on every plan.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Monthly */}
          <div className="bg-white rounded-[14px] p-7 border-[1.5px] border-bark-200 flex flex-col items-center text-center">
            <div className="text-[11px] font-bold uppercase tracking-[0.6px] text-bark-400 mb-2">Monthly</div>
            <div className="font-display text-[38px] font-bold text-bark-700 leading-none">
              $1.99<span className="text-[13px] font-normal text-bark-400">/month</span>
            </div>
            <p className="text-[13px] text-bark-500 mt-2.5 leading-snug">Month to month. Cancel any time.</p>
            <a
              href="#waitlist-form"
              className="block w-full mt-6 py-2.5 rounded-full text-sm font-semibold text-center border-[1.5px] border-bark-200 text-bark-700 hover:border-bark-300 transition-colors"
            >
              Join the waitlist
            </a>
          </div>

          {/* Annual — featured */}
          <div className="relative bg-eucalyptus-600 rounded-[14px] p-7 border-[1.5px] border-eucalyptus-600 text-white flex flex-col items-center text-center">
            <div className="absolute top-4 right-4 bg-wattle-400 text-bark-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full">Best value</div>
            <div className="text-[11px] font-bold uppercase tracking-[0.6px] text-white/50 mb-2">Annual</div>
            <div className="font-display text-[38px] font-bold text-wattle-300 leading-none">
              $15<span className="text-[13px] font-normal text-white/40">/year</span>
            </div>
            <p className="text-[13px] text-white/55 mt-1">That's just $1.25/month. Save 37%.</p>
            <a
              href="#waitlist-form"
              className="block w-full mt-6 py-2.5 rounded-full text-sm font-semibold text-center bg-wattle-400 text-bark-700 hover:bg-wattle-300 transition-colors"
            >
              Join the waitlist
            </a>
          </div>
        </div>

        {/* Shared features */}
        <div className="mt-8 bg-white rounded-[14px] border border-bark-200 px-7 py-6 text-left">
          <p className="text-[11px] font-bold uppercase tracking-[0.6px] text-bark-400 mb-4">Everything included on both plans</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {FEATURES.map(f => (
              <div key={f} className="text-[13px] text-bark-600 flex gap-2 items-start">
                <span className="text-gumleaf-400 font-bold flex-shrink-0 mt-px">{'\u2713'}</span>{f}
              </div>
            ))}
          </div>
        </div>

        <p className="text-[13px] text-bark-400 mt-5">
          All plans include a 30-day free trial · No credit card required · Cancel any time
        </p>
      </div>
    </section>
  );
}
