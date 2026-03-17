# Gemini Clone — Full Stack AI Interface

A high-fidelity reimplementation of the Google Gemini web application. This project features a React frontend and a Node.js/Express backend, integrated with the Google Generative AI SDK (Gemini 1.5 Flash & Pro) to support multimodal interactions, custom AI agents, and deep research capabilities.

## Features

- **Core Chat UI**: Responsive, fluid interface with real-time streaming responses and typing indicators.
- **Multimodal Support**: Upload and analyze images, PDFs, and audio files directly within the chat.
- **Gemini Live**: Real-time voice interaction powered by **WebSockets** and Web Speech API.
- **AI Gems**: Create and switch between specialized AI personas (Gems) with custom system instructions.
- **Deep Research**: A dedicated mode using Gemini 1.5 Pro to deconstruct complex queries and generate structured, long-form reports.
- **Session Persistence**: Full conversation history management with **Prisma ORM and PostgreSQL**, including pinning, renaming, and searching chats.
- **Google Search Grounding**: Real-time web data integration for factual accuracy in responses.
- **Markdown & Code Highlighting**: Full support for formatted text, tables, and syntax-highlighted code blocks.
- **Dark Mode**: Seamless theme switching with persistent user preferences.

## Tech Stack

- **Frontend**: React.js, Vite, Lucide React, Framer Motion, Radix UI
- **Backend**: Node.js, Express.js, WebSockets (ws)
- **Database**: PostgreSQL (via Prisma ORM)
- **AI**: Google Generative AI SDK (Gemini API)
- **Styling**: Vanilla CSS (Modern CSS variables)

## Getting Started

### Prerequisites

- Node.js (v18+)
- PostgreSQL (Local or Cloud instance)
- Gemini API Key (from Google AI Studio)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/chandinivasana/react-geminiclone.git
   cd react-geminiclone
   ```

2. **Backend Setup**
   ```bash
   cd backend
   # Create a .env file with:
   # PORT=5000
   # DATABASE_URL=your_postgresql_uri
   # GEMINI_API_KEY=your_api_key
   npm install
   npx prisma generate
   node server.js
   ```

3. **Frontend Setup**
   ```bash
   # In a new terminal from the root directory
   npm install
   npm run dev
   ```

