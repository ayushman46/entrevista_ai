export function BackgroundEffects() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:84px_84px] opacity-20" />
      <div className="absolute -left-32 top-0 h-[34rem] w-[34rem] rounded-full bg-violet-600/30 blur-[140px]" />
      <div className="absolute right-[-10rem] top-[8rem] h-[32rem] w-[32rem] rounded-full bg-emerald-400/16 blur-[140px]" />
      <div className="absolute bottom-[-12rem] left-1/2 h-[24rem] w-[24rem] -translate-x-1/2 rounded-full bg-sky-400/10 blur-[120px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.36),transparent_28%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.14),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.10),transparent_28%)]" />
    </div>
  );
}
