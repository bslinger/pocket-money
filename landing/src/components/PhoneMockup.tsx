function IconGrid() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[13px] h-[13px]">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}
function IconUsers() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[13px] h-[13px]">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function IconCheckSquare() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[13px] h-[13px]">
      <polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}
function IconTarget() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[13px] h-[13px]">
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
    </svg>
  );
}
function IconCoins() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[13px] h-[13px]">
      <circle cx="8" cy="8" r="6" /><path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
      <path d="M7 6h1v4" /><path d="m16.71 13.88.7.71-2.82 2.82" />
    </svg>
  );
}

export default function PhoneMockup() {
  const kids = [
    { initial: 'A', name: 'Aisha', bal: '$58.50', goal: 'Roller skates', goalAmt: '$12.50', goalTotal: '$45', bar: 28, color: '#8b5cf6' },
    { initial: 'T', name: 'Tom',   bal: '$43.00', goal: 'LEGO set',      goalAmt: '$5.00',  goalTotal: '$30', bar: 17, color: '#0ea5e9' },
    { initial: 'P', name: 'Priya', bal: '$27.80', goal: 'Nintendo game', goalAmt: '$27.80', goalTotal: '$60', bar: 46, color: '#10b981' },
  ];

  return (
    <div className="relative flex justify-center">
      {/* Floating badge top-left */}
      <div className="absolute top-[60px] left-[-20px] bg-white rounded-[12px] px-3.5 py-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.12)] border border-bark-200 whitespace-nowrap z-10">
        <div className="text-[10px] text-bark-500 mb-0.5">Paid this month</div>
        <div className="font-display text-lg font-bold text-wattle-400">$86.00</div>
      </div>

      {/* Phone frame */}
      <div className="w-[260px] bg-[#1C1A18] rounded-[44px] p-2.5 shadow-[0_32px_80px_rgba(0,0,0,0.25)]">
        <div className="bg-bark-100 rounded-[36px] overflow-hidden h-[500px] flex flex-col">
          {/* Notch */}
          <div className="bg-[#1C1A18] h-[26px] flex items-center justify-center flex-shrink-0 rounded-t-[36px]">
            <div className="bg-[#333] w-[80px] h-[14px] rounded-full" />
          </div>

          {/* App nav bar */}
          <div className="bg-white border-b border-bark-200 px-3 flex items-center justify-between h-[36px] flex-shrink-0">
            <div className="flex items-center gap-1.5">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[13px] h-[13px] text-eucalyptus-400">
                <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
              </svg>
              <span className="font-display text-[13px] font-semibold text-eucalyptus-400">Quiddo</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-[18px] h-[18px] rounded-[4px] bg-eucalyptus-400 flex items-center justify-center text-[8px] font-bold text-white">B</div>
              <span className="text-[9px] font-medium text-bark-600">Ben's Family</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-[9px] h-[9px] text-bark-500">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>

          {/* Screen content */}
          <div className="flex-1 overflow-hidden px-2.5 py-2 flex flex-col gap-2">
            <div className="text-[8px] font-semibold text-bark-500 uppercase tracking-wide">Kids</div>
            <div className="flex gap-1.5 overflow-hidden">
              {kids.map(kid => (
                <div key={kid.name} className="bg-white rounded-[10px] border border-bark-200 flex flex-col overflow-hidden flex-1 min-w-0">
                  <div className="p-1.5 flex items-center gap-1">
                    <div
                      className="w-[20px] h-[20px] rounded-full flex items-center justify-center text-[8px] font-bold text-white flex-shrink-0"
                      style={{ backgroundColor: kid.color }}
                    >
                      {kid.initial}
                    </div>
                    <span className="text-[9px] font-semibold text-bark-700 truncate">{kid.name}</span>
                  </div>
                  <div className="px-1.5 font-bold text-[13px] text-bark-700 tabular-nums">{kid.bal}</div>
                  <div className="px-1.5 pt-1 pb-1.5 flex-1">
                    <div className="text-[7px] text-bark-500 truncate">{kid.goal}</div>
                    <div className="flex justify-between text-[7px] mt-0.5">
                      <span className="text-wattle-600 font-medium">{kid.goalAmt}</span>
                      <span className="text-bark-400">{kid.goalTotal}</span>
                    </div>
                    <div className="w-full bg-bark-200 rounded-full h-[3px] mt-0.5 overflow-hidden">
                      <div className="bg-wattle-400 h-full rounded-full" style={{ width: `${kid.bar}%` }} />
                    </div>
                  </div>
                  <div className="flex border-t border-bark-200">
                    <div className="flex-1 flex items-center justify-center gap-0.5 py-1 text-redearth-400">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-[8px] h-[8px]"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      <span className="text-[7px] font-medium">Spend</span>
                    </div>
                    <div className="w-px bg-bark-200" />
                    <div className="flex-1 flex items-center justify-center gap-0.5 py-1 text-gumleaf-400">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-[8px] h-[8px]"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      <span className="text-[7px] font-medium">Add</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-1.5">
              <div className="bg-white rounded-lg px-2 py-1.5 border border-bark-200">
                <div className="text-[7px] text-bark-500 uppercase tracking-[0.4px]">Family Balance</div>
                <div className="font-bold text-[14px] text-bark-700 tabular-nums mt-0.5">$129.30</div>
              </div>
              <div className="bg-white rounded-lg px-2 py-1.5 border border-bark-200">
                <div className="text-[7px] text-bark-500 uppercase tracking-[0.4px]">Paid This Month</div>
                <div className="font-bold text-[14px] text-bark-700 tabular-nums mt-0.5">$86.00</div>
              </div>
            </div>

            {/* Pending approvals card */}
            <div className="bg-white rounded-[10px] border border-wattle-200 overflow-hidden">
              <div className="px-2.5 py-1.5 flex items-center justify-between border-b border-bark-200">
                <div className="flex items-center gap-1">
                  <span className="text-[9px] font-semibold text-bark-700">Needs your approval</span>
                  <span className="text-[8px] font-bold px-1 py-px rounded bg-wattle-50 text-wattle-600 border border-wattle-200">2</span>
                </div>
                <span className="text-[8px] font-semibold border border-gumleaf-200 text-gumleaf-600 rounded px-1.5 py-0.5">Approve all</span>
              </div>
              {[
                { initial: 'P', name: 'Priya', chore: '\uD83C\uDF7D\uFE0F Wash the dishes', color: '#10b981' },
                { initial: 'A', name: 'Aisha', chore: '\uD83E\uDDF9 Vacuum lounge',        color: '#8b5cf6' },
              ].map((row, i) => (
                <div key={row.name} className={`flex items-center gap-1.5 px-2.5 py-1.5 ${i === 0 ? 'border-b border-bark-200' : ''}`}>
                  <div
                    className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-[7px] font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: row.color }}
                  >
                    {row.initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[8px] font-medium text-bark-700 truncate">{row.chore}</div>
                    <div className="text-[7px] text-bark-500">{row.name}</div>
                  </div>
                  <div className="w-[18px] h-[18px] rounded border border-gumleaf-200 flex items-center justify-center text-[9px] text-gumleaf-600 flex-shrink-0">{'\u2713'}</div>
                  <div className="w-[18px] h-[18px] rounded border border-redearth-200 flex items-center justify-center text-[9px] text-redearth-600 flex-shrink-0">{'\u2715'}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom nav */}
          <div className="bg-white border-t border-bark-200 flex flex-shrink-0 py-1.5">
            {[
              { Icon: IconGrid,        label: 'Dashboard',    active: true  },
              { Icon: IconUsers,       label: 'Kids',         active: false },
              { Icon: IconCheckSquare, label: 'Chores',       active: false },
              { Icon: IconTarget,      label: 'Goals',        active: false },
              { Icon: IconCoins,       label: 'Pocket Money', active: false },
            ].map(tab => (
              <div
                key={tab.label}
                className={`flex-1 flex flex-col items-center gap-0.5 text-[6px] font-medium ${tab.active ? 'text-eucalyptus-500' : 'text-bark-400'}`}
              >
                <tab.Icon />
                <span className="leading-tight text-center">{tab.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating badge bottom-right */}
      <div className="absolute bottom-[80px] right-[-20px] bg-white rounded-[12px] px-3.5 py-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.12)] border border-bark-200 whitespace-nowrap z-10">
        <div className="text-[10px] text-bark-500 mb-0.5">Aisha just earned</div>
        <div className="font-display text-lg font-bold text-gumleaf-400">+$1.50 {'\u2713'}</div>
      </div>
    </div>
  );
}
