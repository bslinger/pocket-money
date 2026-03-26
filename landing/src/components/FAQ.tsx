import { useState } from 'react';

const FAQ_ITEMS = [
  {
    q: 'How does Quiddo work?',
    a: "Quiddo is a virtual ledger — it tracks what your kids have earned and saved without holding any real money. Kids earn a balance through chores and weekly pocket money. When they want to buy something, you pay on your own card and log it as a spend in Quiddo. Their balance goes down. No cash changes hands, no separate bank account needed.",
  },
  {
    q: 'So my kids never actually get the money?',
    a: "Exactly — that's the point. The balance is virtual. It represents what they've earned and what they can ask you to spend on their behalf. When they want something, you buy it on your card and log it as a spend. They learn to wait and to save without you ever needing to handle cash.",
  },
  {
    q: 'Do my kids need their own device?',
    a: "Not necessarily. Parents manage everything from the parent view on their own device. Kids can have their own login to see their balance, goals, and chores — but it's optional, especially for younger children. The parent view works perfectly well on its own.",
  },
  {
    q: 'Can both parents use Quiddo?',
    a: "Yes — you can invite your partner, co-parent, or another carer to your family. All adults see the same balances and can approve chores and log spends from their own devices. Works well for separated families who want to stay in sync across two households.",
  },
  {
    q: "What's the difference between chores and responsibilities?",
    a: "Chores earn money directly — the balance goes up when the chore is approved. Responsibilities are things that must be done before that week's pocket money is released (making the bed, packing the school bag). They don't earn directly — they're the price of admission. You set what percentage needs to be completed before the weekly allowance unlocks.",
  },
  {
    q: 'Does Quiddo work with points or a custom currency?',
    a: "Yes. You can track in Australian dollars, or create your own family currency — coins, stars, 'Smith Bucks', whatever works for your family. Younger kids often respond better to points than money concepts. You can even set different currencies for different children if needed.",
  },
  {
    q: 'Is there a limit to how many children I can add?',
    a: "Every plan supports up to 12 children on a single family subscription. No per-child fees — ever.",
  },
  {
    q: 'What happens after my 30-day trial?',
    a: "At the end of your trial you'll be asked to choose a plan. If you don't subscribe, your account becomes read-only — you can still see all your data, but can't make changes until you subscribe. No credit card is required to start the trial.",
  },
];

export default function FAQ() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <section id="faq" className="bg-white border-t border-bark-200 py-[72px] px-[5%]">
      <div className="max-w-[720px] mx-auto">
        <h2 className="font-display text-[34px] font-semibold text-bark-700 text-center mb-10">Frequently asked questions</h2>

        <div>
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} className="border-b border-bark-200">
              <button
                type="button"
                className="w-full bg-transparent py-[18px] flex justify-between items-center text-left text-[15px] font-medium text-bark-700 hover:text-eucalyptus-400 transition-colors gap-3"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <span>{item.q}</span>
                <span
                  className="text-lg text-bark-400 flex-shrink-0 transition-transform duration-200"
                  style={{ transform: openFaq === i ? 'rotate(180deg)' : 'none' }}
                >
                  {'\u2304'}
                </span>
              </button>
              {openFaq === i && (
                <div className="pb-[18px] text-sm text-bark-500 leading-[1.7]">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
