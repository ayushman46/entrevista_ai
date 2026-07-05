export function WorkflowCards() {
  return (
    <section id="workflow" className="mt-8 grid gap-4 md:grid-cols-3">
      {[
        {
          step: "01",
          title: "Upload resume",
          description: "Drop a PDF or DOCX and let the platform extract candidate context.",
        },
        {
          step: "02",
          title: "Pick role and name",
          description: "Add the candidate name and the exact role they are preparing for.",
        },
        {
          step: "03",
          title: "Start interview",
          description: "Launch the interview and move straight into the candidate UI.",
        },
      ].map((item) => (
        <article
          key={item.step}
          className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-white/15 hover:bg-white/7"
        >
          <p className="text-sm font-semibold tracking-[0.3em] text-slate-400">{item.step}</p>
          <h3 className="mt-4 text-xl font-semibold text-white">{item.title}</h3>
          <p className="mt-3 text-sm leading-7 text-slate-400">{item.description}</p>
        </article>
      ))}
    </section>
  );
}
