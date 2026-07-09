# 🎙️ InterviewAI: Complete Architectural Guide

Welcome to the architectural breakdown of **InterviewAI**, an enterprise-grade, low-latency voice AI practice interview platform. This document explains how the entire project is built, from high-level system diagrams down to individual files and networking protocols, explained in a clear, beginner-friendly way.

---

## 📌 High-Level Architecture Overview

At its core, the application follows a **Client-Server model** split into two primary repositories:
1.  **Frontend (Next.js 14 / React)**: Handles the visual interface, microphone audio capture, speech detection, and audio playback.
2.  **Backend (FastAPI / Python)**: Handles database persistence, audio transcription (STT), AI brain reasoning (LLM), and speech synthesis (TTS).

```
┌────────────────────────┐                   ┌────────────────────────┐
│  Next.js UI Client     │  ◄── REST APIs ──►│  FastAPI Backend       │
│  (Browser Microphone)  │  ◄─ WebSockets ──►│  (Python Server)       │
└────────────────────────┘                   └────────────────────────┘
                                                         │
                                                     MongoDB
```

To achieve real-time, conversational voice interactions (under 2 seconds latency), we cannot use traditional HTTP requests (like sending an entire audio file and waiting). Instead, we use a **WebSocket pipeline** that establishes a persistent, two-way connection between the browser and the Python server.

---

## 🎨 1. Frontend Architecture (The Client)

Located in the `frontend/` directory, this Next.js application manages the user experience, styling, and browser-side speech processing.

### Key Technologies
*   **Next.js 14 (App Router)**: Supports server-side rendering, clean file-based routing (`/upload`, `/setup`, `/interview/[id]`, `/report/[id]`), and optimized asset delivery.
*   **Zustand**: A ultra-lightweight state management library. It tracks the interview transcript state, WebSocket connection health, and whether the AI is currently speaking.
*   **Tailwind CSS**: Custom color-variable mappings (defined in `tailwind.config.ts` and `src/app/globals.css`) designed for a minimalist, modern dark/light mode experience.

### The Client Audio Pipeline
The most complex part of the frontend is managing the microphone without capturing background noise or causing echo.

1.  **Voice Activity Detection (VAD)**:
    *   File: `src/hooks/useVAD.ts`
    *   We use `@ricky0123/vad-react` running **Silero VAD (ONNX model)** directly inside the browser using WebAssembly.
    *   This monitor listens to the microphone stream. When it detects that the candidate **starts speaking**, it raises an active flag. When it detects **speech has ended** (silence threshold reached), it triggers a callback passing a `Float32Array` containing raw audio samples.
2.  **WAV Audio Encoding**:
    *   File: `src/hooks/useInterviewSocket.ts`
    *   FastAPI and Groq STT APIs expect standard audio containers. The hook converts the float samples into 16-bit PCM mono **WAV bytes** at 16kHz sample rate (the optimal frequency for speech recognition).
3.  **Real-Time Playback Queue**:
    *   The WebSocket receives synthesized audio chunks from the server.
    *   Because the audio chunks arrive as separate packages, we play them sequentially using the browser **Web Audio API** (`AudioContext`). It keeps a queue and plays them back-to-back dynamically so the voice sounds smooth and unbroken.

---

## ⚙️ 2. Backend Architecture (The Server)

Located in the `backend/` directory, this Python service coordinates the heavy-lifting computational AI tasks.

### Key Technologies
*   **FastAPI**: A high-performance Python framework suited for async/await event loops and native WebSockets.
*   **Motor**: An asynchronous MongoDB driver preventing database operations from blocking the web server thread.

### The Real-Time Voice Loop (WebSocket Pipeline)
Located in `backend/app/api/websocket.py`, the WebSocket handler manages the candidate's turn-taking loop:

```
[Candidate Voice] ──► (WebSocket) ──► Groq Whisper (STT)
                                            │
                                      Transcribed Text
                                            │
                                            ▼
edge-tts (TTS) ◄── [Sentence Stream] ◄── LLM Generator Chain
       │
 [Audio Chunks]
       │
       ▼
 (WebSocket) ──► [Candidate Hears Voice]
```

1.  **Step 1: Speech-to-Text (STT)**:
    *   File: `app/services/stt_service.py`
    *   The server receives raw binary WAV bytes from the WebSocket and sends them to the **Groq Whisper API** (`whisper-large-v3-turbo`). It returns the transcribed text string.
2.  **Step 2: LLM Sentence Generator**:
    *   File: `app/services/llm_chain.py`
    *   The transcribed user response is appended to the session history. The backend queries a fallback chain of Large Language Models:
        *   Primary: **Groq (llama-3.3-70b-versatile)** (extremely fast).
        *   Fallback 1: **DeepSeek (deepseek-chat)** (smart reasoning).
        *   Fallback 2: **Gemini (gemini-2.0-flash)** (always online).
    *   A custom sentence-splitting regular expression (`SENTENCE_END = re.compile(r'([.!?\n]+)')`) parses the LLM stream on-the-fly and yields finished sentences immediately without waiting for the full paragraph to finish.
3.  **Step 3: Text-to-Speech (TTS)**:
    *   File: `app/services/tts_service.py`
    *   As soon as a single sentence is yielded by the LLM, it is sent to Microsoft **edge-tts**. It returns binary MP3 audio frames.
4.  **Step 4: WebSocket Streaming**:
    *   The backend streams the audio frames back to the client browser immediately, creating a continuous, low-latency verbal reply.

---

## 💾 3. Database Schema & Models

We use **MongoDB** to store interview configurations, transcripts, and evaluation reports.

*   **`sessions` collection**: Stores candidate name, target role, attached resume text content, and status.
*   **`transcripts` collection**: Stores individual conversation turns (`"role": "user"` or `"role": "ai"`) associated with a `session_id`, sorted chronologically.
*   **`evaluations` collection**: Stores post-interview evaluation scores (0-100), strengths, and improvement lists generated by the AI after the interview ends.

---

## 🚀 4. How the User Journey Flows (Code Trace)

### 1. Resume Upload
*   **UI**: The user drags a PDF onto `/upload` page.
*   **Backend (`api/resume.py`)**: Receives the file, uses `pypdf` to parse and extract text, and returns the raw text in JSON.
*   **State**: The frontend saves this text temporarily in the browser's `sessionStorage`.

### 2. Interview Setup
*   **UI**: The user enters their Name and Target Role in `/setup` page.
*   **Backend (`api/interview.py`)**: Receives the payload and saves a new document in MongoDB, returning a unique `session_id`. The frontend routes the user to `/interview/[id]`.

### 3. Running the Interview
*   **UI**: The client connects to `ws://127.0.0.1:8000/ws/interview/{session_id}`.
*   **Backend**: Greets the candidate by name, asks the first question, and streams it as audio. The candidate speaks, VAD triggers, sends audio, gets transcribed, and the loop repeats.

### 4. Getting the Feedback Report
*   **UI**: Candidate clicks "End Interview", routing them to `/report/[id]`.
*   **Backend (`api/report.py`)**: Fetches all transcripts for that session, aggregates them into a prompt, and asks the LLM to output a JSON object containing a score, a list of strengths, and a list of improvements. It saves this report in the DB and serves it to the frontend.

---

## 🔒 5. Key Verification & Security Fixes Built-In
During the software audit, we resolved several production bottlenecks:
*   **CORS Protection**: The backend allows dynamic CORS origin mappings using regex patterns matching local developer ports (`localhost:3000-3003`) and dynamic Vercel subdomains (preventing CORS failures).
*   **Dynamic dotenv Hot-Reload**: Added `override=True` to the env configuration loader, so updating local credentials doesn't require restarting uvicorn manually.
*   **Graceful Mongo parsing**: Dynamic route session queries are protected from invalid Hex ObjectId structures, preventing database-level 500 server crashes.
