
export function setupClientLogic() {
  const reveals = document.querySelectorAll(".reveal");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16 }
  );
  reveals.forEach((item) => observer.observe(item));

  const setupForm = document.querySelector('[data-save="candidate"]') as HTMLFormElement;
  if (setupForm) {
    setupForm.onsubmit = (event) => {
      event.preventDefault();
      const candidate = {
        name: (document.querySelector("#candidate-name") as HTMLInputElement)?.value.trim() || "Alex Morgan",
        role: (document.querySelector("#candidate-role") as HTMLInputElement)?.value.trim() || "Product Designer",
        level: (document.querySelector("#candidate-level") as HTMLSelectElement)?.value || "Mid level",
        focus: (document.querySelector("#candidate-focus") as HTMLTextAreaElement)?.value.trim() || "General role preparation",
      };
      window.localStorage.setItem("vitahire-candidate", JSON.stringify(candidate));
      window.location.href = "/resume";
    };
  }

  const resumeInput = document.querySelector("#resume-file") as HTMLInputElement;
  if (resumeInput) {
    resumeInput.onchange = () => {
      const fileName = resumeInput.files?.[0]?.name || "resume.pdf";
      window.localStorage.setItem("vitahire-resume", fileName);
      const preview = document.querySelector(".resume-preview strong");
      if (preview) {
        preview.textContent = fileName;
      }
    };
  }

  const interviewPage = document.querySelector("[data-name]");
  if (interviewPage) {
    const candidate = JSON.parse(window.localStorage.getItem("vitahire-candidate") || "{}");
    const resumeFile = window.localStorage.getItem("vitahire-resume");

    const name = candidate.name || "Alex Morgan";
    const role = candidate.role || "Product Designer";
    const focus = candidate.focus || "The candidate gives specific examples and strong outcome-based language.";

    const nameEl = document.querySelector("[data-name]");
    if (nameEl) nameEl.textContent = name;
    
    const roleEl = document.querySelector("[data-role]");
    if (roleEl) roleEl.textContent = role;
    
    const note = document.querySelector("[data-focus-note]");
    if (note) {
      note.textContent = `${focus}${resumeFile ? ` Resume uploaded: ${resumeFile}.` : ""}`;
    }
  }

  const nextInterview = document.querySelector("[data-next-interview]") as HTMLElement;
  if (nextInterview) {
    nextInterview.onclick = () => {
      window.location.href = "/interview";
    };
  }
}
