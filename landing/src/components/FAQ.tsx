import { useState } from 'react';

const FAQ_ITEMS = [
  {
    q: 'How does Quiddo work?',
    a: "Think of it as a running tab for each kid. Every chore they complete and every pocket money day adds to their balance. When they want to buy something, you pay on your card and mark it as a spend in the app. Their balance goes down. No cash, no bank account.",
  },
  {
    q: 'So my kids never actually get the money?',
    a: "Right. The balance is a number that goes up and down. They can't take it out of a wallet because it was never in one. When they've saved up enough and want something, they ask you to buy it, you log the spend, and their balance drops. For younger kids especially, this tends to click pretty quickly.",
  },
  {
    q: 'Do my kids need their own device?',
    a: "Not for it to work, no. You can run the whole thing from your own phone. If your kids are old enough to care about their balance, giving them their own login to check it is useful, but plenty of parents manage everything themselves and just show the kids when they ask.",
  },
  {
    q: 'Can both parents use Quiddo?',
    a: "Yes. Add your partner from the app and you'll both see the same balances and approval queues. Works for separated families too, where two households are contributing to the same kids' pocket money.",
  },
  {
    q: "What's the difference between chores and responsibilities?",
    a: "Chores earn money directly. Approve the chore, the balance goes up. Responsibilities are different. They're the baseline stuff that has to happen before pocket money drops (making the bed, packing the bag). Miss too many and the weekly allowance doesn't unlock. You set the threshold.",
  },
  {
    q: 'Does Quiddo work with points or a custom currency?',
    a: "Yes. Dollars work, but a lot of families prefer points or their own currency, especially with younger kids. Call them whatever you want. You can even use different currencies for different children if that's useful.",
  },
  {
    q: 'Is there a limit to how many children I can add?',
    a: "Up to 12. One subscription, flat price, doesn't matter how many kids you have.",
  },
  {
    q: 'What happens after my 30-day trial?',
    a: "You'll be prompted to pick a plan. If you don't, the account goes read-only. You can still see everything, you just can't make changes. No credit card is needed to start.",
  },
];

export default function FAQ() {
  const [openFaqs, setOpenFaqs] = useState<Set<number>>(() => new Set(FAQ_ITEMS.map((_, i) => i)));

  function toggle(i: number) {
    setOpenFaqs(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

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
                onClick={() => toggle(i)}
              >
                <span>{item.q}</span>
                <span
                  className="text-lg text-bark-400 flex-shrink-0 transition-transform duration-200"
                  style={{ transform: openFaqs.has(i) ? 'rotate(180deg)' : 'none' }}
                >
                  {'\u2304'}
                </span>
              </button>
              {openFaqs.has(i) && (
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
