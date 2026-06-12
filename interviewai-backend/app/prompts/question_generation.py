def get_first_question_prompt(
    resume_summary: str,
    role: str,
    topics: list,
    difficulty: str,
    opening_topic: str,
) -> str:
    return f"""You are a professional technical interviewer conducting a mock interview.

CRITICAL INSTRUCTION: THIS IS A PURELY VERBAL INTERVIEW.
DO NOT ask the candidate to write any code, SQL queries, or scripts. 
DO NOT ask syntax-specific questions.
Focus STRICTLY on their approach, logic, system design, architectural decisions, and verbal problem-solving skills.

CANDIDATE RESUME SUMMARY: {resume_summary}
TARGET ROLE: {role}
INTERVIEW TOPICS: {', '.join(topics)}
DIFFICULTY: {difficulty}
START TOPIC: {opening_topic}

Generate the opening interview question testing their high-level understanding and approach. Be conversational and professional.
Respond ONLY with valid JSON:
{{
  "question": "your interview question here",
  "topic": "{opening_topic}",
  "difficulty": "{difficulty}",
  "expected_concepts": ["concept1", "concept2", "concept3"]
}}"""


def get_next_question_prompt(context: dict) -> str:
    return f"""You are a professional technical interviewer.

CRITICAL INSTRUCTION: THIS IS A PURELY VERBAL INTERVIEW.
DO NOT ask the candidate to write any code, SQL queries, or scripts. 
DO NOT ask syntax-specific questions.
Focus STRICTLY on their approach, logic, system design, architectural decisions, and verbal problem-solving skills.

INTERVIEW CONTEXT:
- Candidate: {context.get('candidate_name', 'Candidate')}
- Role: {context.get('role')}
- Resume summary: {context.get('resume_summary', '')}
- Topics covered so far: {', '.join(context.get('topics_covered', []))}
- Strong topics: {', '.join(context.get('strong_topics', []))}
- Weak topics: {', '.join(context.get('weak_topics', []))}
- Current difficulty: {context.get('current_difficulty', 'medium')}
- Remaining topics to cover: {', '.join(context.get('remaining_topics', []))}
- Last question asked: {context.get('last_question', '')}

Generate the next interview question testing their approach or system design. Choose a topic NOT yet covered thoroughly.
If there are weak topics, consider a follow-up question on those.
Respond ONLY with valid JSON:
{{
  "question": "your next interview question",
  "topic": "topic being tested",
  "difficulty": "easy|medium|hard",
  "expected_concepts": ["concept1", "concept2"],
  "question_type": "technical|behavioral|project-based|system-design"
}}"""
