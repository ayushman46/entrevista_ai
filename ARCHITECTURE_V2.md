# InterviewAI: Architecture V2 (Server-Side Audio Pipeline)

This document details the upgraded "V2" architecture, which shifts from browser-native speech processing to a robust, server-orchestrated audio streaming pipeline.

---

## 1. The Core Architectural Shift

**V1 (Legacy):** Relied on `window.SpeechRecognition` and `window.speechSynthesis`. 
*   **Failures:** Browsers blocked autoplay, network timeouts caused random disconnects, and voices sounded robotic.

**V2 (Production):** Uses raw audio binary streaming and server-side AI processing.
*   **Success:** 100% stability across all modern browsers (Chrome/Safari/Mobile), high-fidelity neural voices, and superior transcription accuracy via specialized hardware.

---

## 2. Technology Stack (V2)

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Frontend** | Next.js 14 + MediaRecorder API | Captures raw PCM/WebM audio blobs from the mic. |
| **Backend** | FastAPI + aiofiles | Handles multi-part form data uploads of audio binary. |
| **STT Engine**| Groq Whisper (`whisper-large-v3`) | Converts user audio to text in < 500ms using GPU inference. |
| **LLM Brain** | Gemini Pro / Groq Llama 3 | Orchestrates interview logic and adaptive difficulty. |
| **TTS Engine**| `edge-tts` (Neural) | Generates high-quality human-sounding MP3 files for free. |
| **Database** | SQLite (Single Table) | Maintains the complex JSON state of the session. |

---

## 3. End-to-End Voice Flow (The V2 Pipeline)

1.  **Question Delivery:**
    *   Backend generates a question.
    *   Backend calls `edge-tts` to generate a neural MP3 file.
    *   Backend returns a signed `audio_url` to the frontend.
    *   Frontend plays the audio via `new Audio(url).play()` inside a user-gesture handler.

2.  **Answer Capture:**
    *   Frontend uses `MediaRecorder` to capture the user's voice as a `.webm` blob.
    *   The blob is sent to `/interview/answer_audio` via an optimized `POST` request.

3.  **Server Orchestration:**
    *   Backend saves the blob and sends it to **Groq Whisper** for transcription.
    *   The transcribed text is evaluated by the **LLM**.
    *   The **LLM** generates the `next_question`.
    *   Backend generates the **next TTS MP3** and returns it in the same response cycle.

---

## 4. Updated Database Virtual Schema (V2 Variables)

The `sessions` table remains a single physical table, but the JSON `data` blob now includes:

| Variable Name | Type | Context |
| :--- | :--- | :--- |
| `audio_url` | `string` | The path to the server-generated MP3 file for the current turn. |
| `answer_text` | `string` | The text result from the Groq Whisper transcription. |
| `is_complete` | `boolean`| Master flag for triggering the final PDF report. |

---

## 5. Security & Stability Enhancements

*   **Autoplay Bypass:** All audio is triggered synchronously by user clicks, satisfying strict Chrome/Safari security policies.
*   **Atomic Transactions:** SQLite updates the entire session JSON in a single commit, preventing state desync if a network error occurs during transcription.
*   **Static Asset Caching:** Generated audio files are served from a mounted `/audio` directory, reducing latency for repeated listenings.

---

## 6. How to Deploy (V2)

1.  **Install Dependencies:** `pip install edge-tts websockets pydub aiofiles`
2.  **API Keys:** Ensure `GROQ_API_KEY` is active (for Whisper STT).
3.  **Persistence:** Render volume must map the `uploads/audio/` folder to ensure generated voices persist during restarts.
