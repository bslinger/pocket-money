const HOW_STEPS = [
  { num: 1, title: 'Create your family', desc: 'Sign up, name your family, choose your currency. Add up to 12 kids with avatars and ages.' },
  { num: 2, title: 'Set up pocket money', desc: 'Choose an amount and a day. Quiddo credits each child\'s balance automatically every week.' },
  { num: 3, title: 'Add chores', desc: 'Create recurring chores with values. Kids claim them in their view, you approve with one tap.' },
  { num: 4, title: 'Watch them save', desc: 'Kids set goals and track progress. When they want to spend, you log it and the balance updates.' },
];

export default function HowItWorks() {
  return (
    <section id="how" className="bg-white border-t border-bark-200 py-[72px] px-[5%] text-center">
      <div className="max-w-[900px] mx-auto">
        <h2 className="font-display text-[34px] font-semibold text-bark-700 mb-2">How to get started</h2>
        <p className="text-base text-bark-500 mb-12">Up and running in under 5 minutes.</p>

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
          href="https://app.quiddo.com.au/register"
          className="inline-flex items-center gap-2 bg-eucalyptus-400 text-white px-10 py-[18px] rounded-full text-base font-semibold hover:bg-eucalyptus-500 transition-colors"
        >
          Get started →
        </a>
      </div>
    </section>
  );
}
