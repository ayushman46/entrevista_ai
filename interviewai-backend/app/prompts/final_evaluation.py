def get_final_evaluation_prompt(
    candidate_name: str,
    role: str,
    resume_summary: str,
    all_evaluations: list,
    questions_and_answers: list,
) -> str:
    qa_text = "\n".join([
        f"Q{i+1}: {qa['question']}\nA: {qa['answer']}\nScore: {qa.get('score', 'N/A')}/10"
        for i, qa in enumerate(questions_and_answers)
    ])

    avg_technical = sum(e.get('technical_score', 0) for e in all_evaluations) / max(len(all_evaluations), 1)
    avg_communication = sum(e.get('communication_score', 0) for e in all_evaluations) / max(len(all_evaluations), 1)
    avg_confidence = sum(e.get('confidence_score', 0) for e in all_evaluations) / max(len(all_evaluations), 1)

    return f"""You are a senior technical hiring manager writing a comprehensive interview assessment.

CANDIDATE: {candidate_name}
TARGET ROLE: {role}
RESUME SUMMARY: {resume_summary}

AGGREGATE SCORES:
- Average Technical Score: {avg_technical:.1f}/10
- Average Communication Score: {avg_communication:.1f}/10
- Average Confidence Score: {avg_confidence:.1f}/10

INTERVIEW TRANSCRIPT:
{qa_text}

Write a comprehensive final evaluation. Respond ONLY with valid JSON:
{{
  "overall_score": 7.2,
  "technical_score": 7.0,
  "communication_score": 6.8,
  "confidence_score": 7.5,
  "topic_scores": [
    {{
      "topic": "Python",
      "score": 8,
      "questions_asked": 3,
      "assessment": "Strong fundamentals, good with async concepts"
    }}
  ],
  "strengths": [
    "strength 1",
    "strength 2",
    "strength 3"
  ],
  "weaknesses": [
    "weakness 1",
    "weakness 2"
  ],
  "learning_roadmap": [
    "Study X to improve in Y",
    "Practice Z by doing A"
  ],
  "hiring_recommendation": "Strong Hire|Hire|Maybe|No Hire",
  "hiring_justification": "2-3 sentence justification for the recommendation",
  "summary": "3-4 sentence executive summary of this candidate"
}}"""
