# InterviewAI Project Documentation and System Architecture

This document describes the system architecture, component design, data flow, and deployment setup for the InterviewAI voice practice platform.

## Overview

InterviewAI is a low latency voice AI practice interview platform. The system operates on a client server model:

* The frontend client captures browser microphone input, processes voice activity detection, and manages the user interface.
* The backend server coordinates audio transcription, LLM reasoning, speech synthesis, and database management.

To achieve low latency conversational response times under two seconds, the client and server maintain a persistent bidirectional WebSocket connection.

## Client Architecture

The frontend client is located in the frontend directory and is built using Next.js 14.

### Core Stack

* Next.js 14 App Router for page routing and server rendering.
* Zustand for client side state tracking including active transcripts and connection status.
* Tailwind CSS for UI layouts and themes.

### Client Audio Loop

The audio loop on the client operates as follows:

1. Microphone capture streams raw audio to the browser.
2. Voice Activity Detection runs Silero VAD directly in the browser via WebAssembly to detect when a user starts and stops speaking.
3. The raw float samples are encoded into 16 bit PCM mono WAV bytes at a 16kHz sample rate.
4. The client WebSocket sends the WAV bytes to the backend.
5. Incoming audio chunks from the backend are queued and played sequentially using the browser Web Audio API.

## Server Architecture

The backend server is located in the backend directory and is built using FastAPI.

### Core Stack -

* FastAPI for asynchronous WebSocket communication.
* Motor for asynchronous MongoDB operations.
* PyPDF for reading PDF resume content.

### Server Processing Loop -

When a user speaks, the server handles the data through the following steps:

1. Speech to Text: The backend receives raw WAV bytes and sends them to the Groq Whisper API for transcription.
2. LLM Sentence Generator: The transcribed text is added to the session history. The server queries an LLM fallback chain starting with Groq, falling back to DeepSeek, and finally Gemini.
3. Sentence Splitter: The server parses the streaming text using regular expressions and yields complete sentences immediately.
4. Text to Speech: As soon as a sentence is ready, it is sent to Microsoft Edge TTS to generate audio bytes.
5. WebSocket Stream: The server pushes the audio bytes back to the browser.

## Database Design

The system uses MongoDB to store configurations, session history, and evaluations.

* Sessions: Stores candidate information, target role, and resume text.
* Transcripts: Stores chronological dialogue exchanges between user and assistant.
* Evaluations: Stores feedback reports including scores, strengths, and improvements.

## Development and Deployment Setup

For production, the client is deployed on Vercel and the backend is deployed on Render.

### Environmental Variables

* NEXT_PUBLIC_API_URL: The HTTPS endpoint of the backend server.
* NEXT_PUBLIC_WS_URL: The secure WebSocket endpoint of the backend server.
* MONGODB_URI: The connection URI for the database.
* GROQ_API_KEY: The primary token for transcription and LLM inference.
* DEEPSEEK_API_KEY: The fallback token for LLM inference.
* GEMINI_API_KEY: The final fallback token for LLM inference.
* CORS_ORIGINS: Permitted frontend origins.

### Security Configurations

The backend CORS policy is configured with regular expressions to permit dynamic Vercel subdomains and localhost ports. The database setup requires whitelisting access from Render servers in the MongoDB Network Access panel.
