import os
import re

def main():
    prompt_file = '/Users/ayush/Downloads/AI_interview/GEMINI_CLI_PROMPT.md'
    with open(prompt_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Regex to match ## FILE: `filename` and then ```language...```
    pattern = re.compile(r'## FILE:\s*`([^`]+)`\s*\n+```[a-z]*\n(.*?)```', re.DOTALL)
    matches = pattern.findall(content)

    for filename, file_content in matches:
        # Determine the project based on the first directory or project structure context
        # Some paths are absolute to the project root, some don't have project root prefix.
        # Looking at the markdown, the paths start with app/, schemas/, components/, etc.
        # But wait, in the prompt, there's no project prefix in the '## FILE:' line for most files.
        # Wait, the markdown says "interviewai-backend/app/..."? No, it says "## FILE: app/config.py"
        # We need to distinguish between backend and frontend files.
        
        filepath = filename.strip()
        
        # Heuristic to place in correct project
        is_frontend = filepath.startswith('components/') or filepath.startswith('app/layout.tsx') or filepath.startswith('app/page.tsx') or filepath.startswith('app/upload/') or filepath.startswith('app/interview/') or filepath.startswith('app/report/') or filepath.startswith('hooks/') or filepath.startswith('services/api.ts') or filepath.startswith('store/') or filepath.startswith('types/') or filepath.startswith('tailwind.config.ts') or filepath.startswith('next.config.ts') or filepath.startswith('package.json') or filepath.startswith('app/globals.css') or filepath.startswith('interviewai-frontend/')
        
        is_backend = filepath.startswith('app/') and filepath.endswith('.py') or filepath == 'requirements.txt' or filepath == '.env.example' or filepath == 'render.yaml' or filepath.startswith('interviewai-backend/')
        
        if is_frontend:
            if filepath.startswith('interviewai-frontend/'):
                filepath = filepath.replace('interviewai-frontend/', '')
            full_path = os.path.join('interviewai-frontend', filepath)
        elif is_backend:
            if filepath.startswith('interviewai-backend/'):
                filepath = filepath.replace('interviewai-backend/', '')
            full_path = os.path.join('interviewai-backend', filepath)
        else:
            print(f"Skipping or unknown project for {filepath}")
            continue
            
        os.makedirs(os.path.dirname(full_path) or '.', exist_ok=True)
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(file_content)
        print(f"Created {full_path}")

if __name__ == '__main__':
    main()