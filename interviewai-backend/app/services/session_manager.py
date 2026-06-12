import json
import os
import uuid
from datetime import datetime
from typing import Optional
from app.database import SessionLocal, SessionRecord
from app.config import settings

class SessionManager:
    """
    Production-grade SQLite-based session storage using SQLAlchemy ORM.
    """

    def create_session(self, resume_id: str, candidate_name: str, role: str, interview_plan: dict) -> dict:
        interview_id = str(uuid.uuid4())
        session = {
            "interview_id": interview_id,
            "resume_id": resume_id,
            "candidate_name": candidate_name,
            "role": role,
            "status": "active",
            "current_question_index": 0,
            "questions": [],
            "evaluations": [],
            "interview_context": {
                "candidate_name": candidate_name,
                "role": role,
                "resume_summary": "",
                "topics_covered": [],
                "strong_topics": [],
                "weak_topics": [],
                "remaining_topics": interview_plan.get("topics", []),
                "current_difficulty": interview_plan.get("difficulty", "medium"),
                "last_question": "",
                "total_planned": interview_plan.get("estimated_questions", 12),
            },
            "interview_plan": interview_plan,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }
        self._save(interview_id, session)
        return session

    def get_session(self, interview_id: str) -> Optional[dict]:
        with SessionLocal() as db:
            record = db.query(SessionRecord).filter(SessionRecord.interview_id == interview_id).first()
            if record:
                return json.loads(record.data)
        return None

    def update_session(self, interview_id: str, updates: dict) -> dict:
        session = self.get_session(interview_id)
        if not session:
            raise ValueError(f"Session {interview_id} not found")
        session.update(updates)
        session["updated_at"] = datetime.utcnow().isoformat()
        self._save(interview_id, session)
        return session

    def add_question_answer(
        self,
        interview_id: str,
        question: str,
        answer: str,
        evaluation: dict,
        topic: str,
    ) -> dict:
        session = self.get_session(interview_id)
        if not session:
            raise ValueError(f"Session {interview_id} not found")

        session["questions"].append({
            "index": len(session["questions"]),
            "question": question,
            "answer": answer,
            "topic": topic,
            "timestamp": datetime.utcnow().isoformat(),
        })
        session["evaluations"].append(evaluation)
        session["current_question_index"] = len(session["questions"])

        # Update context for adaptive questioning
        ctx = session["interview_context"]
        if topic not in ctx["topics_covered"]:
            ctx["topics_covered"].append(topic)
        if topic in ctx["remaining_topics"]:
            ctx["remaining_topics"].remove(topic)

        tech_score = evaluation.get("technical_score", 5)
        if tech_score >= 7 and topic not in ctx["strong_topics"]:
            ctx["strong_topics"].append(topic)
        elif tech_score < 6 and topic not in ctx["weak_topics"]:
            ctx["weak_topics"].append(topic)

        # Adjust difficulty based on evaluation
        diff_change = evaluation.get("difficulty_change", "maintain")
        if diff_change == "increase" and ctx["current_difficulty"] != "hard":
            ctx["current_difficulty"] = "hard" if ctx["current_difficulty"] == "medium" else "medium"
        elif diff_change == "decrease" and ctx["current_difficulty"] != "easy":
            ctx["current_difficulty"] = "easy" if ctx["current_difficulty"] == "medium" else "medium"

        ctx["last_question"] = question
        session["updated_at"] = datetime.utcnow().isoformat()
        self._save(interview_id, session)
        return session

    def close_session(self, interview_id: str) -> dict:
        session = self.get_session(interview_id)
        if session:
            session["status"] = "completed"
            session["updated_at"] = datetime.utcnow().isoformat()
            self._save(interview_id, session)
        return session

    def _save(self, interview_id: str, session: dict):
        with SessionLocal() as db:
            record = db.query(SessionRecord).filter(SessionRecord.interview_id == interview_id).first()
            if record:
                record.data = json.dumps(session)
            else:
                record = SessionRecord(interview_id=interview_id, data=json.dumps(session))
                db.add(record)
            db.commit()


session_manager = SessionManager()
