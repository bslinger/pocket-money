const WHY_FEATURES = [
  { emoji: '\uD83D\uDCB0', title: 'Track any currency', desc: 'Real dollars, stars, coins, or your own family currency. Works for every age and stage.' },
  { emoji: '\uD83E\uDDF9', title: 'Chore approval loop', desc: 'Kids claim chores, you approve with one tap. Balance updates instantly \u2014 no cash needed.' },
  { emoji: '\uD83C\uDFAF', title: 'Savings goals', desc: 'Kids set goals and watch progress bars fill up. More motivating than any piggy bank.' },
  { emoji: '\uD83D\uDCCB', title: 'Responsibilities vs chores', desc: 'Separate \u201cmust do\u201d responsibilities from paid chores. Pocket money only releases when responsibilities are done.' },
  { emoji: '\uD83D\uDC68\u200D\uD83D\uDC69\u200D\uD83D\uDC67\u200D\uD83D\uDC66', title: 'Up to 12 kids', desc: 'One family plan covers everyone \u2014 no per-child fees. Big families finally get a fair deal.' },
  { emoji: '\u26A1', title: 'Auto pocket money', desc: 'Set it once. Quiddo adds pocket money every Sunday automatically. Never forget again.' },
];

export default function Features() {
  return (
    <>
      {/* WHAT IS QUIDDO */}
      <section className="bg-white border-t border-bark-200 py-[72px] px-[5%] text-center">
        <div className="max-w-[680px] mx-auto">
          <h2 className="font-display text-[34px] font-semibold text-bark-700 mb-5">What is Quiddo?</h2>
          <p className="text-base text-bark-500 leading-[1.8] mb-4">
            Quiddo is a pocket money app built for Australian families who pay their kids in cash. It's not a bank, not a debit card, not a fintech product. It's a simple ledger that tracks what each child has earned, spent, and saved — so you're always in sync and nobody's arguing about how much is owed.
          </p>
          <p className="text-base text-bark-500 leading-[1.8] mb-4">
            As a parent, <strong className="text-bark-600">you stay in control</strong> — you own the money, you approve the chores, you release the pocket money. Your kids get a view of their own balance and goals that makes saving feel real. No bank account required. No monthly fees per child. No surprises.
          </p>
          <p className="text-base text-bark-500 leading-[1.8]">
            Works for real dollars, points, stars, or whatever currency your family uses. Up to <strong className="text-bark-600">12 kids on one family plan.</strong>
          </p>
        </div>
      </section>

      {/* WHY USE QUIDDO */}
      <section className="bg-bark-50 py-[72px] px-[5%] text-center">
        <div className="max-w-[560px] mx-auto mb-14">
          <h2 className="font-display text-[34px] font-semibold text-bark-700 mb-4">Why use Quiddo?</h2>
          <p className="text-base text-bark-500">Everything a modern Australian family needs. Nothing you don't.</p>
        </div>
        <div
          className="max-w-[660px] mx-auto bg-white rounded-[14px] overflow-hidden"
          style={{ border: '1px solid #EBE4D6' }}
        >
          <div className="grid grid-cols-2">
            {WHY_FEATURES.map((feat, i) => {
              const isRightCol = i % 2 === 1;
              const isLastRow = i >= WHY_FEATURES.length - 2;
              return (
                <div
                  key={feat.title}
                  className="px-7 py-8 text-center"
                  style={{
                    borderBottom: isLastRow ? 'none' : '1px solid #EBE4D6',
                    borderRight: isRightCol ? 'none' : '1px solid #EBE4D6',
                  }}
                >
                  <div className="w-[52px] h-[52px] rounded-[14px] bg-eucalyptus-50 flex items-center justify-center text-2xl mx-auto mb-3.5">
                    {feat.emoji}
                  </div>
                  <h3 className="font-display text-[17px] font-semibold text-bark-700 mb-2">{feat.title}</h3>
                  <p className="text-sm text-bark-500 leading-relaxed">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* WHAT YOU GET */}
      <section className="bg-eucalyptus-50 border-t border-eucalyptus-100 border-b border-b-eucalyptus-100 py-[72px] px-[5%]">
        <div className="max-w-[900px] mx-auto">
          <h2 className="font-display text-[34px] font-semibold text-bark-700 text-center mb-10">What you get</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-sm font-bold text-eucalyptus-600 uppercase tracking-[0.6px] mb-4">Included in every plan</h3>
              <ul className="flex flex-col gap-2.5">
                {[
                  'Up to 12 child profiles per family',
                  'Balance tracking for each child',
                  'Recurring and one-off chores',
                  'Chore approval workflow',
                  'Savings goals with progress tracking',
                  'Responsibilities vs paid chores split',
                  'Custom family currency name',
                  'Works on iOS and Android',
                ].map(item => (
                  <li key={item} className="flex gap-2.5 text-sm text-bark-600 items-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-eucalyptus-400 flex-shrink-0 mt-[7px]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-bold text-eucalyptus-600 uppercase tracking-[0.6px] mb-4">How to get started</h3>
              <ul className="flex flex-col gap-2.5">
                {[
                  'Sign up with your email \u2014 no credit card needed for trial',
                  'Set up your family name and currency type',
                  'Add your children and their pocket money amounts',
                  'Create your first chore and watch it go',
                  'Download the app for iOS or Android',
                  'Invite your partner or co-parent to join',
                ].map(item => (
                  <li key={item} className="flex gap-2.5 text-sm text-bark-600 items-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-eucalyptus-400 flex-shrink-0 mt-[7px]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
