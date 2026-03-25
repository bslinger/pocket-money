import { useState } from 'react';

const FAQ_ITEMS = [
  {
    q: 'How does Quiddo work?',
    a: "Quiddo is a virtual ledger \u2014 it tracks what your kids have earned and spent without holding any real money. You pay pocket money and chore rewards in cash as you normally would, and Quiddo records the balance. Think of it as a digital version of the running tally you used to keep in your head.",
  },
  {
    q: 'Do my kids need their own device?',
    a: "Not necessarily. Parents manage everything from the parent view on their own device. Kids can have their own login to see their balance, goals, and chores \u2014 but it\u2019s optional, especially for younger children. The parent view works perfectly well without kids having their own device.",
  },
  {
    q: 'Can both parents use Quiddo?',
    a: "Yes \u2014 you can invite your partner, co-parent, or another carer to your family. All adults see the same balances and can approve chores from their own devices. This works well for separated families too, where both households want to stay in sync.",
  },
  {
    q: "What\u2019s the difference between chores and responsibilities?",
    a: "Chores earn money or points directly \u2014 the balance goes up when the chore is approved. Responsibilities are things that must be done before that week\u2019s pocket money is released (making the bed, packing the school bag). They don\u2019t earn directly \u2014 they\u2019re the price of admission. You set what percentage needs to be completed before the weekly allowance unlocks.",
  },
  {
    q: 'Does Quiddo work with real dollars and points?',
    a: "Both. You can track in Australian dollars, or create your own family currency \u2014 coins, stars, \u201cSmith Bucks\u201d, whatever works for your family. Younger kids often respond better to points than money concepts. You can even set different currencies for different children if needed.",
  },
  {
    q: 'Is there a limit to how many children I can add?',
    a: "Every plan supports up to 12 children on a single family subscription. No per-child fees \u2014 ever.",
  },
  {
    q: 'Is Quiddo available in Australia?',
    a: "Quiddo is built specifically for Australian families. It supports Australian dollars natively, and is designed around how Aussie families actually handle pocket money \u2014 with cash, without debit cards, and with a healthy dose of \u201cyou\u2019ve got to earn it first\u201d.",
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
