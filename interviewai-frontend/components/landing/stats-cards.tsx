const stats = [
  ["94%", "interviewer confidence"],
  ["3x", "faster screening"],
  ["360°", "candidate context"],
];

export function StatsCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {stats.map(([value, label]) => (
        <div
          key={label}
          className="group rounded-[1.8rem] border border-white/10 bg-white/5 px-6 py-7 shadow-[0_24px_80px_-55px_rgba(0,0,0,0.6)] transition duration-300 hover:-translate-y-1 hover:border-white/15 hover:bg-white/7 hover:shadow-[0_30px_100px_-55px_rgba(124,58,237,0.22)]"
        >
          <p className="text-[2.8rem] font-semibold leading-none tracking-tight text-white">{value}</p>
          <p className="mt-2 max-w-[180px] text-lg leading-7 text-slate-400">{label}</p>
        </div>
      ))}
    </div>
  );
}
