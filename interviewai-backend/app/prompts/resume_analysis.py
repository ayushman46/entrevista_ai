RESUME_ANALYSIS_SYSTEM = """You are an expert technical recruiter and resume analyst.
Extract structured information from resumes and identify the most important technical
skills and experiences. Always respond in valid JSON only."""

def get_resume_analysis_prompt(resume_text: str) -> str:
    return f"""Analyze this resume and extract structured information.

RESUME TEXT:
{resume_text}

Respond ONLY with valid JSON in this exact format:
{{
  "name": "candidate full name",
  "email": "email if present",
  "phone": "phone if present",
  "skills": ["skill1", "skill2"],
  "technologies": ["tech1", "tech2"],
  "projects": [
    {{
      "name": "project name",
      "description": "brief description",
      "tech_stack": ["tech1", "tech2"]
    }}
  ],
  "experience": [
    {{
      "company": "company name",
      "role": "job title",
      "duration": "time period",
      "key_points": ["point1", "point2"]
    }}
  ],
  "education": [
    {{
      "degree": "degree type",
      "institution": "university name",
      "year": "graduation year"
    }}
  ],
  "certifications": ["cert1", "cert2"],
  "achievements": ["achievement1", "achievement2"],
  "summary": "2-3 sentence professional summary of this candidate"
}}"""


def get_interview_plan_prompt(resume_data: dict, role: str) -> str:
    return f"""Based on this candidate's resume and target role, create an interview plan.

CANDIDATE PROFILE:
- Skills: {', '.join(resume_data.get('skills', []))}
- Technologies: {', '.join(resume_data.get('technologies', []))}
- Experience: {len(resume_data.get('experience', []))} positions
- Projects: {len(resume_data.get('projects', []))} projects

TARGET ROLE: {role}

Create an interview plan. Respond ONLY with valid JSON:
{{
  "topics": ["topic1", "topic2", "topic3", "topic4", "topic5"],
  "difficulty": "easy|medium|hard",
  "estimated_questions": 12,
  "focus_areas": ["area1", "area2"],
  "opening_question_topic": "which topic to start with"
}}"""
