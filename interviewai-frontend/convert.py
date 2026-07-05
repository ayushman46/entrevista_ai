import os
import re

def to_jsx(html):
    jsx = html.replace('class=', 'className=')
    jsx = jsx.replace('for=', 'htmlFor=')
    jsx = jsx.replace('<!--', '{/*').replace('-->', '*/}')
    
    # Self close tags
    jsx = re.sub(r'<input([^>]*[^/])>', r'<input\1 />', jsx)
    jsx = re.sub(r'<img([^>]*[^/])>', r'<img\1 />', jsx)
    jsx = re.sub(r'<br([^>]*[^/])>', r'<br\1 />', jsx)
    jsx = re.sub(r'<hr([^>]*[^/])>', r'<hr\1 />', jsx)
    
    # Replace hrefs
    jsx = jsx.replace('href="./setup.html"', 'href="/setup"')
    jsx = jsx.replace('href="./resume.html"', 'href="/resume"')
    jsx = jsx.replace('href="./interview.html"', 'href="/interview"')
    jsx = jsx.replace('href="./index.html"', 'href="/"')
    
    # Replace style tags or inline styles if they are simple, though in this HTML there are none.
    # We must remove script tags
    jsx = re.sub(r'<script.*?</script>', '', jsx, flags=re.DOTALL)
    
    return jsx.strip()

def process_file(html_file, output_page):
    with open(f"../{html_file}", "r") as f:
        html = f.read()
    
    # Extract inside body
    body_match = re.search(r'<body>(.*?)</body>', html, re.DOTALL)
    if not body_match:
        return
        
    body_content = body_match.group(1)
    
    jsx_content = to_jsx(body_content)
    
    # Ensure directory exists
    os.makedirs(os.path.dirname(output_page), exist_ok=True)
    
    page_code = f"""
"use client";
import Link from "next/link";
import {{ useEffect }} from "react";
import {{ setupClientLogic }} from "@/lib/clientLogic";

export default function Page() {{
  useEffect(() => {{
    setupClientLogic();
  }}, []);

  return (
    <>
      {jsx_content}
    </>
  );
}}
"""
    with open(output_page, "w") as f:
        f.write(page_code)

process_file("index.html", "app/page.tsx")
process_file("setup.html", "app/setup/page.tsx")
process_file("resume.html", "app/resume/page.tsx")
process_file("interview.html", "app/interview/page.tsx")

# Write clientLogic.ts
os.makedirs("lib", exist_ok=True)
with open("lib/clientLogic.ts", "w") as f:
    f.write('''
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

  const nextInterview = document.querySelector("[data-next-interview]");
  if (nextInterview) {
    nextInterview.onclick = () => {
      window.location.href = "/interview";
    };
  }
}
''')

# Prepend tailwind to globals.css and replace it with styles.css
with open("../styles.css", "r") as f:
    css = f.read()

with open("app/globals.css", "w") as f:
    f.write('@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n' + css)

