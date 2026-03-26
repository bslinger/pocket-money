import { useState } from 'react';

const FAQ_ITEMS = [
  {
    q: 'How does Quiddo work?',
    a: "It's a virtual ledger - think of it as a running tab for each kid. Every chore they complete and every pocket money day adds to their balance. When they want to buy something, you pay on your card and mark it as a spend in the app and their balance goes down.",
  },
  {
    q: 'So my kids never actually get the money?',
    a: "Right. The balance is a number that goes up and down. They can see what they've saved and what they've spent, and how long they need to wait to get that new book or toy. When they've saved up enough, they ask you to buy it, you log the spend, and their balance drops. For younger kids especially, this is a great way to start teaching them about money, and it tends to click quickly.",
  },
  {
    q: 'Do my kids need their own device?',
    a: "Not for it to work, no. You can run the whole thing from your own phone. If your kids are old enough to care about their balance, you can connect their device directly or send them a signup link, but plenty of parents manage everything themselves and just show the kids when they ask.",
  },
  {
    q: 'Can both parents use Quiddo?',
    a: "Yes! Add your partner from the app and you'll both see the same balances and approval queues. Works for separated families too, where two households are contributing to the same kids' pocket money and chore schedules.",
  },
  {
    q: "What's the difference between chores that earn and responsibilities?",
    a: "Some chores earn money directly. Approve the chore, the balance goes up. Responsibilities are different,  they're the jobs that are expected to be done before pocket money drops (cleaning their room, feeding the cat). Miss too many and the weekly allowance doesn't unlock. You set the threshold, or release a percentage based on how many were completed.",
  },
  {
    q: 'Does Quiddo work with points or a custom currency?',
    a: "Yes. Real money works, but a lot of families prefer points or their own currency, especially with younger kids. Call them whatever you want, assign a custom symbol. You can even use different currencies for different children or accounts if that's useful.",
  },
  {
    q: 'Is there a limit to how many children I can add?',
    a: "No limit. One subscription, flat price, add as many kids as you need.",
  },
  {
    q: 'What happens after my 30-day trial?',
    a: "You'll be prompted to pick a plan. If you don't, the account goes read-only. You can still see everything, you just can't make changes, and you can export all your data at any time. No credit card is needed to start.",
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
    <section id="faq" className="bg-white border-t border-bark-200 pt-10 pb-[72px] px-[5%]">
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
