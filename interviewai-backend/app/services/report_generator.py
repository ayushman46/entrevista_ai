import os
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from app.config import settings


def generate_pdf_report(interview_id: str, report_data: dict, session: dict) -> str:
    """Generate a professional PDF interview report using ReportLab."""
    filename = f"report_{interview_id}.pdf"
    filepath = os.path.join(settings.REPORT_DIR, filename)

    doc = SimpleDocTemplate(
        filepath,
        pagesize=A4,
        rightMargin=0.75 * inch,
        leftMargin=0.75 * inch,
        topMargin=inch,
        bottomMargin=0.75 * inch,
    )

    styles = getSampleStyleSheet()
    story = []

    # Title
    title_style = ParagraphStyle(
        "Title", parent=styles["Title"],
        fontSize=24, textColor=colors.HexColor("#1a1a2e"),
        spaceAfter=6, alignment=TA_CENTER,
    )
    subtitle_style = ParagraphStyle(
        "Subtitle", parent=styles["Normal"],
        fontSize=12, textColor=colors.HexColor("#666"),
        alignment=TA_CENTER, spaceAfter=20,
    )
    heading_style = ParagraphStyle(
        "Heading", parent=styles["Heading2"],
        fontSize=14, textColor=colors.HexColor("#1a1a2e"),
        spaceBefore=16, spaceAfter=8, borderPad=4,
    )
    body_style = ParagraphStyle(
        "Body", parent=styles["Normal"],
        fontSize=10, leading=14, textColor=colors.HexColor("#333"),
    )
    bullet_style = ParagraphStyle(
        "Bullet", parent=styles["Normal"],
        fontSize=10, leading=14, textColor=colors.HexColor("#333"),
        leftIndent=16, bulletIndent=0,
    )

    # Header
    story.append(Paragraph("InterviewAI", title_style))
    story.append(Paragraph("Mock Interview Assessment Report", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#4f46e5")))
    story.append(Spacer(1, 16))

    # Candidate Info
    story.append(Paragraph("Candidate Information", heading_style))
    info_data = [
        ["Candidate", report_data.get("candidate_name", "N/A")],
        ["Role Applied For", report_data.get("role", "N/A").replace("_", " ").title()],
        ["Interview Date", report_data.get("date", datetime.now().strftime("%B %d, %Y"))],
        ["Questions Answered", str(len(session.get("questions", [])))],
        ["Hiring Recommendation", report_data.get("hiring_recommendation", "N/A")],
    ]
    info_table = Table(info_data, colWidths=[2 * inch, 4.5 * inch])
    info_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#f1f0ff")),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#ddd")),
        ("ROWBACKGROUNDS", (1, 0), (-1, -1), [colors.white, colors.HexColor("#fafafa")]),
        ("PADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 16))

    # Score Summary
    story.append(Paragraph("Performance Scores", heading_style))
    scores = [
        ["Category", "Score", "Rating"],
        ["Overall", f"{report_data.get('overall_score', 0):.1f}/10", _rating(report_data.get("overall_score", 0))],
        ["Technical", f"{report_data.get('technical_score', 0):.1f}/10", _rating(report_data.get("technical_score", 0))],
        ["Communication", f"{report_data.get('communication_score', 0):.1f}/10", _rating(report_data.get("communication_score", 0))],
        ["Confidence", f"{report_data.get('confidence_score', 0):.1f}/10", _rating(report_data.get("confidence_score", 0))],
    ]
    score_table = Table(scores, colWidths=[3 * inch, 1.5 * inch, 2 * inch])
    score_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#4f46e5")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#ddd")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f9f9ff")]),
        ("PADDING", (0, 0), (-1, -1), 8),
        ("ALIGN", (1, 0), (2, -1), "CENTER"),
    ]))
    story.append(score_table)
    story.append(Spacer(1, 16))

    # Strengths
    story.append(Paragraph("Key Strengths", heading_style))
    for s in report_data.get("strengths", []):
        story.append(Paragraph(f"✓  {s}", bullet_style))
    story.append(Spacer(1, 10))

    # Weaknesses
    story.append(Paragraph("Areas for Improvement", heading_style))
    for w in report_data.get("weaknesses", []):
        story.append(Paragraph(f"•  {w}", bullet_style))
    story.append(Spacer(1, 10))

    # Learning Roadmap
    story.append(Paragraph("Recommended Learning Roadmap", heading_style))
    for i, item in enumerate(report_data.get("learning_roadmap", []), 1):
        story.append(Paragraph(f"{i}.  {item}", bullet_style))
    story.append(Spacer(1, 10))

    # Summary
    story.append(Paragraph("Evaluator Summary", heading_style))
    story.append(Paragraph(report_data.get("summary", ""), body_style))
    story.append(Spacer(1, 16))

    # Interview Transcript
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#ddd")))
    story.append(Paragraph("Interview Transcript", heading_style))
    for i, q in enumerate(session.get("questions", []), 1):
        story.append(Paragraph(f"<b>Q{i}: {q['question']}</b>", body_style))
        story.append(Spacer(1, 4))
        story.append(Paragraph(f"<i>Answer: {q.get('answer', 'No answer recorded')}</i>", body_style))
        story.append(Spacer(1, 12))

    # Footer
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#ddd")))
    story.append(Spacer(1, 8))
    story.append(Paragraph(
        f"Generated by InterviewAI · {datetime.now().strftime('%B %d, %Y at %H:%M UTC')}",
        ParagraphStyle("footer", parent=styles["Normal"], fontSize=8,
                       textColor=colors.HexColor("#999"), alignment=TA_CENTER)
    ))

    doc.build(story)
    return filename


def _rating(score: float) -> str:
    if score >= 8.5:
        return "Excellent"
    elif score >= 7:
        return "Good"
    elif score >= 5.5:
        return "Fair"
    else:
        return "Needs Work"
