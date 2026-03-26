const WHY_FEATURES = [
    {
        emoji: '💳',
        title: 'No cash necessary',
        desc: 'No cash changes hands, if you don\'t want. Kids build up a digital balance and you settle purchases on your own card when they\'re ready to spend.'
    },
    {
        emoji: '🧹',
        title: 'Chore approvals',
        desc: 'Kids complete up a chore and it lands in your queue. Approve it and their balance goes up straight away.'
    },
    {
        emoji: '🎯',
        title: 'Savings goals',
        desc: 'Pick a goal, track what\'s missing. Kids can see at a glance how many more chores get them there.'
    },
    {
        emoji: '📋',
        title: 'Responsibilities vs chores',
        desc: 'Some things kids just have to do. Other things they get paid for. Quiddo tracks both and holds the weekly allowance until the basics are ticked off.'
    },
    {
        emoji: '👨‍👩‍👧‍👦',
        title: 'Up to 12 kids',
        desc: 'Whether you\'ve got one kid or six, it\'s the same price. Up to 12 children on every plan.'
    },
    {
        emoji: '⚡',
        title: 'Auto pocket money',
        desc: 'Set a day and an amount once. Every week Quiddo drops it into each kid\'s balance without you doing anything.'
    },
];

export default function Features() {
    return (
        <>
            {/* WHAT IS QUIDDO */}
            <section className="bg-white border-t border-bark-200 pt-10 pb-[72px] px-[5%] text-center">
                <div className="max-w-[680px] mx-auto">
                    <h2 className="font-display text-[34px] font-semibold text-bark-700 mb-5">What is Quiddo?</h2>
                    <p className="text-base text-bark-500 leading-[1.8] mb-4">
                        We built Quiddo because with four kids it was becoming a nightmare remembering who had what
                        money left over from birthdays, and which kid had spent their last five bucks on a toy that
                        probably broke the next day. We tried a spreadsheet, but that lasted about a fortnight; who has
                        time to find the right sheet, add new rows, fix formulas?</p>
                    <p className="text-base text-bark-500 leading-[1.8] mb-4">Quiddo is a simple tracker. Kids earn a
                        balance through chores and weekly pocket money. When they want to buy something, you pay on your
                        card and log it as a spend. They can view their balance and savings goals on their device or
                        yours.
                    </p>
                    <p className="text-base text-bark-500 leading-[1.8] mb-4">
                        You own the money the whole time. Your kids see their balance and goals in real time, which is
                        actually what makes it click for them. No bank account, no debit card, no minimum age.
                    </p>
                    <p className="text-base text-bark-500 leading-[1.8]">
                        Works in dollars or whatever currency your family uses. One plan covers up to <strong
                        className="text-bark-600">12 kids.</strong>
                    </p>
                </div>
            </section>

            {/* WHY USE QUIDDO */}
            <section className="bg-bark-50 pt-10 pb-[72px] px-[5%] text-center">
                <div className="max-w-[560px] mx-auto mb-14">
                    <h2 className="font-display text-[34px] font-semibold text-bark-700 mb-4">Why use Quiddo?</h2>
                    <p className="text-base text-bark-500">The bullet points.</p>
                </div>
                <div
                    className="max-w-[660px] mx-auto bg-white rounded-[14px] overflow-hidden"
                    style={{border: '1px solid #EBE4D6'}}
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2">
                        {WHY_FEATURES.map((feat, i) => {
                            const isRightCol = i % 2 === 1;
                            const isLastRow = i >= WHY_FEATURES.length - 2;
                            const isLastItem = i === WHY_FEATURES.length - 1;
                            return (
                                <div
                                    key={feat.title}
                                    className={[
                                        'px-5 py-5',
                                        !isLastItem ? 'border-b border-[#EBE4D6]' : '',
                                        isLastRow && !isLastItem ? 'sm:border-b-0' : '',
                                        !isRightCol ? 'sm:border-r sm:border-[#EBE4D6]' : '',
                                    ].filter(Boolean).join(' ')}
                                >
                                    <div className="flex items-center gap-2.5 mb-2">
                                        <div
                                            className="w-[36px] h-[36px] rounded-[10px] bg-eucalyptus-50 flex items-center justify-center text-lg flex-shrink-0">
                                            {feat.emoji}
                                        </div>
                                        <h3 className="font-display text-[17px] font-semibold text-bark-700 text-left">{feat.title}</h3>
                                    </div>
                                    <p className="text-sm text-bark-500 leading-relaxed text-left">{feat.desc}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* WHAT YOU GET */}
            <section
                className="bg-eucalyptus-50 border-t border-eucalyptus-100 border-b border-b-eucalyptus-100 pt-10 pb-[72px] px-[5%]">
                <div className="max-w-[900px] mx-auto">
                    <h2 className="font-display text-[34px] font-semibold text-bark-700 text-center mb-10">What you
                        get</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div>
                            <h3 className="text-sm font-bold text-eucalyptus-600 uppercase tracking-[0.6px] mb-4">Included
                                in every plan</h3>
                            <ul className="flex flex-col gap-2.5">
                                {[
                                    'Up to 12 child profiles per family',
                                    'Virtual balance tracking for each child',
                                    'Recurring and one-off chores',
                                    'Chore approval workflow',
                                    'Complete history of chore completion (or chore procrastination)',
                                    'Savings goals with progress tracking',
                                    'Responsibilities vs paid chores split',
                                    'Custom family currency name',
                                    'Works on iOS and Android',
                                ].map(item => (
                                    <li key={item} className="flex gap-2.5 text-sm text-bark-600 items-start">
                                        <span
                                            className="w-1.5 h-1.5 rounded-full bg-eucalyptus-400 flex-shrink-0 mt-[7px]"/>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-eucalyptus-600 uppercase tracking-[0.6px] mb-4">How to
                                get started</h3>
                            <ul className="flex flex-col gap-2.5">
                                {[
                                    'Sign up with your email. No credit card needed for the trial.',
                                    'Set up your family name and currency type',
                                    'Add your children and their weekly pocket money amounts',
                                    'Create your first chore and watch it go',
                                    'Download the app for iOS or Android',
                                    'Invite your partner or co-parent to join',
                                    'Set the older kids up on their own devices to view balances and see their chores'
                                ].map(item => (
                                    <li key={item} className="flex gap-2.5 text-sm text-bark-600 items-start">
                                        <span
                                            className="w-1.5 h-1.5 rounded-full bg-eucalyptus-400 flex-shrink-0 mt-[7px]"/>
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
