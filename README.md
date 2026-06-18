ENTREVISTA AI THE ULTIMATE INTERVIEW PREPARATION PLATFORM

INTRODUCTION
Entrevista AI is a cutting edge artificial intelligence powered platform designed to revolutionize the way candidates prepare for technical interviews. By leveraging advanced machine learning models and real time audio processing this system provides an immersive and highly realistic interview experience that adapts to the performance of the user.

CORE ARCHITECTURE
The system is built upon a robust and scalable architecture that seamlessly integrates frontend and backend components to deliver a fluid user experience.

FRONTEND LAYER
The user interface is crafted using Next.js and TypeScript and Tailwind CSS providing a responsive and intuitive dashboard. It manages audio capture and streaming via secure WebSockets ensuring low latency communication with the server. The frontend state is managed through Zustand allowing for efficient data flow and a persistent interview context.

BACKEND LAYER
The backend is powered by FastAPI a high performance Python framework. It serves as the orchestrator for several key services including session management and real time data processing.

SPEECH TO TEXT SERVICE
We utilize the Groq Whisper model for exceptionally accurate and fast transcription of candidate responses. This allows the system to understand spoken language with high precision even in various acoustic environments.

INTELLIGENT INTERVIEW ENGINE
At the heart of Entrevista AI is an adaptive interview engine. This engine evaluates candidate answers using state of the art Large Language Models such as DeepSeek and Gemini. It analyzes technical accuracy and communication skills then determines the optimal next question based on the performance of the candidate. This ensures that every interview is unique and challenging.

LLM ORCHESTRATOR
The LLM Orchestrator is a sophisticated component that manages communication with multiple AI providers. It supports DeepSeek and Gemini and Groq ensuring high availability and optimal performance. By abstracting the provider logic the system can easily switch between different models to find the best balance between speed and intelligence.

EVALUATION ENGINE
The Evaluation Engine is responsible for scoring candidate responses. It looks for specific technical concepts and evaluates the clarity of the explanation. This engine provides granular feedback which is later compiled into the final report. It uses a set of predefined prompts to ensure consistency and fairness in every evaluation.

AUDIO SERVICE
The Audio Service handles the conversion between speech and text. It manages the temporary storage of audio chunks and coordinates with the Groq Whisper API for transcription. It also interfaces with Edge TTS to produce high quality audio files for the interviewer voice.

TEXT TO SPEECH SERVICE
To complete the immersive experience the system uses Edge TTS to generate natural sounding voices for the AI interviewer. This provides the candidate with clear and professional verbal feedback and questions.

SESSION AND DATA MANAGEMENT
The system maintains interview continuity using a local SQLite database for active sessions. This allows for detailed tracking of the progress of the interview and the generation of comprehensive performance reports.

PRODUCT WORKFLOW
1. Resume Submission. The journey begins when the candidate uploads their resume. The system parses the document to understand the background and expertise of the candidate.
2. Adaptive Questioning. Based on the resume and selected role the AI generates a personalized interview plan. Questions are delivered verbally and the system listens for the response.
3. Real Time Feedback. As the interview progresses the engine evaluates every answer providing the candidate with a sense of their performance and adjusting the difficulty level dynamically.
4. Final Evaluation. Upon completion the system generates a detailed report in PDF format. This report covers technical scores and communication metrics and areas for improvement.

TECHNICAL STACK
Frontend. Next.js and TypeScript and Tailwind CSS and Zustand.
Backend. FastAPI and Python.
AI Models. DeepSeek and Gemini and Groq Whisper.
Voice. Edge TTS.
Database. SQLite.

WHY ENTREVISTA AI
Entrevista AI is more than just a tool it is a comprehensive solution for career growth. It removes the anxiety of interviews by providing a safe and constructive environment for practice. Whether you are a junior developer or a senior architect this platform scales to your level and helps you achieve your professional goals.

GITHUB REPOSITORY
You can find the project at https://github.com/ayushman46/entrevista_ai
