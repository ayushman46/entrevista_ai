const faqs = [
  {
    q: "How does the interview use the resume?",
    a: "It extracts the key projects, skills, and experience signals to generate context-aware questions.",
  },
  {
    q: "Can candidates interview for a specific role?",
    a: "Yes. The candidate enters a target role before starting, and the flow adapts accordingly.",
  },
  {
    q: "Does the report change after each session?",
    a: "Each session generates a new score summary, feedback, and hiring recommendation.",
  },
];

export function FaqSection() {
  return (
    <section id="faq" className="mt-8 grid gap-4 lg:grid-cols-3">
      {faqs.map((item) => (
        <article
          key={item.q}
          className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 transition duration-300 hover:-translate-y-1 hover:border-white/15 hover:bg-white/7"
        >
          <h3 className="text-xl font-semibold text-white">{item.q}</h3>
          <p className="mt-3 text-sm leading-7 text-slate-400">{item.a}</p>
        </article>
      ))}
    </section>
  );
}
