const HOW_STEPS = [
  { num: 1, title: 'Create your family', desc: 'Sign up and give your family a name. Add each kid with a name and a weekly pocket money amount.' },
  { num: 2, title: 'Set up pocket money', desc: 'Pick a day and Quiddo handles the rest. The same amount drops into each kid\'s balance every week without you doing anything.' },
  { num: 3, title: 'Add chores', desc: 'Add chores with a dollar value attached. Kids pick them up from their own view and they land in your approval queue.' },
  { num: 4, title: 'They save, you pay', desc: 'When a kid wants to buy something, you pay on your card and log it. Their balance drops. That\'s the whole flow.' },
];

export default function HowItWorks() {
  return (
    <section id="how" className="bg-white border-t border-bark-200 py-[72px] px-[5%] text-center">
      <div className="max-w-[900px] mx-auto">
        <h2 className="font-display text-[34px] font-semibold text-bark-700 mb-2">How to get started</h2>
        <p className="text-base text-bark-500 mb-12">Takes about five minutes.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {HOW_STEPS.map(step => (
            <div key={step.num} className="text-center">
              <div className="w-11 h-11 rounded-full bg-eucalyptus-400 text-white font-display text-lg font-bold flex items-center justify-center mx-auto mb-3.5">
                {step.num}
              </div>
              <h3 className="font-display text-base font-semibold text-bark-700 mb-2">{step.title}</h3>
              <p className="text-[13px] text-bark-500 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>

        <a
          href="#waitlist-form"
          className="inline-flex items-center gap-2 bg-eucalyptus-400 text-white px-10 py-[18px] rounded-full text-base font-semibold hover:bg-eucalyptus-500 transition-colors"
        >
          Join the waitlist →
        </a>
      </div>
    </section>
  );
}
