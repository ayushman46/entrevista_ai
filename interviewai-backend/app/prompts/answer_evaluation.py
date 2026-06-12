def get_evaluation_prompt(
    question: str,
    answer: str,
    expected_concepts: list,
    topic: str,
    role: str,
    current_difficulty: str,
) -> str:
    return f"""You are an expert technical interviewer evaluating a candidate's answer.

ROLE BEING INTERVIEWED FOR: {role}
TOPIC: {topic}
CURRENT DIFFICULTY: {current_difficulty}

QUESTION ASKED:
{question}

EXPECTED CONCEPTS TO COVER:
{', '.join(expected_concepts)}

CANDIDATE'S ANSWER:
{answer}

Evaluate this answer rigorously and fairly. Consider:
1. Technical correctness and accuracy
2. Completeness - did they cover the key concepts?
3. Communication clarity and structure
4. Practical understanding vs rote memorization
5. Confidence level inferred from the answer

Respond ONLY with valid JSON:
{{
  "technical_score": 7,
  "communication_score": 6,
  "confidence_score": 7,
  "answer_quality": "Good",
  "missing_concepts": ["concept not mentioned", "another gap"],
  "what_they_got_right": ["correct point 1", "correct point 2"],
  "follow_up_required": true,
  "follow_up_reason": "why follow-up is needed",
  "difficulty_change": "increase|maintain|decrease",
  "topic": "{topic}",
  "next_question": "if follow_up_required is true, write the follow-up question here, else write empty string",
  "feedback": "2-3 sentence constructive feedback on their answer"
}}

Scoring guide:
- 9-10: Exceptional, complete answer covering all concepts
- 7-8: Good answer with minor gaps
- 5-6: Adequate but missing important points
- 3-4: Significant gaps, major concepts missing
- 1-2: Very poor, mostly incorrect or irrelevant"""
