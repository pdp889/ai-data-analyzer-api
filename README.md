# 🧠 AI Analyst Agents — Multi-Agent Data Insight Engine

This is an experimental sample project that explores multi-agent LLM coordination for data analysis. It is designed to be a compelling, semi-practical demo that could evolve into a real product. Built with TypeScript and powered by the OpenAI API, the system interprets structured datasets through autonomous, specialized AI agents.

---

## ⚙️ Project Overview

**Goal**: Given a user-uploaded CSV or dataset, route it through a set of intelligent AI agents that collaboratively analyze and narrate insights, with the ability to answer follow-up questions and refine analysis based on user needs.

### Core Analysis Agents:
- **📊 The Profiler**  
  Parses and summarizes the dataset. Identifies column types, data distributions, and anomalies. Creates a comprehensive dataset profile.

- **🕵️ The Detective**  
  Explores relationships, trends, and correlations across the data. Generates detailed insights with confidence levels and supporting evidence.

- **📚 The Storyteller**  
  Synthesizes the profile and insights into a clear, concise narrative that highlights key findings and patterns.

### Interactive Agent:
- **💬 The Chat Agent**  
  Serves as the user interface for the analysis system:
  - Handles user questions about the analysis
  - Evaluates answer quality and completeness
  - Triggers targeted reanalysis when needed
  - Coordinates with other agents to improve responses
  - Maintains analysis state for follow-up questions

---

## 💡 Key Features

- **Multi-Agent Pipeline**: Coordinated analysis through specialized agents
- **Interactive Q&A**: Ask questions about the analysis and get detailed answers
- **Adaptive Analysis**: Agents can refine their analysis based on user questions
- **Quality Control**: Built-in evaluation of answer quality and automatic improvement
- **Structured Output**: Consistent JSON responses with proper error handling
- **Type Safety**: Fully TypeScript-based with comprehensive type definitions

---

## 🧱 Architecture

```txt
[User]                     <- Uploads CSV, asks questions
      |
[API Layer]               <- Express.js with TypeScript
      |
[Agent Pipeline]          <- Coordinated analysis flow
  ├─ Core Analysis        <- Initial data processing
  │  ├─ Profiler Agent    <- Dataset profiling
  │  ├─ Detective Agent   <- Pattern discovery
  │  └─ Storyteller Agent <- Narrative synthesis
  │
  └─ Interactive Layer    <- User interaction
      └─ Chat Agent      <- Q&A and analysis refinement
          |
[OpenAI API]              <- GPT-3.5 Turbo for agent operations

Analysis Flow:
1. User uploads CSV
2. Core agents process data (Profiler → Detective → Storyteller)
3. User asks questions through Chat Agent
4. Chat Agent evaluates answer quality
5. If needed, triggers targeted reanalysis
6. Improved answer is provided
```

---

## 🚀 Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

---

## 📝 API Endpoints

- `POST /api/analyze` - Upload and analyze a CSV file
- `POST /api/ask` - Ask questions about the analysis (handled by Chat Agent)

---

## 🔒 Security

- Environment variables for sensitive data
- Input validation and sanitization
- Proper error handling without exposing internals
- File upload validation and cleanup

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express, TypeScript
- **AI**: OpenAI API (GPT-3.5 Turbo)
- **Validation**: Zod
- **Documentation**: Swagger/OpenAPI
- **Logging**: Winston

---

## 💡 Why It's Interesting

- Uses autonomous agents with clear roles and task-based prompting
- Explores prompt fidelity, agent chaining, and conversational memory
- Powered by OpenAI API (GPT-3.5 / GPT-4)
- Handles real data (CSV) and returns narrative + analysis
- Fully TypeScript-based (backend and frontend)
- Interactive Q&A with automatic quality improvement
