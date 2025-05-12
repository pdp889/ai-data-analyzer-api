# 🧠 AI Analyst Agents — Multi-Agent Data Insight Engine

This is an experimental sample project that explores multi-agent LLM coordination for data analysis. It is designed to be a compelling, semi-practical demo that could evolve into a real product. Built with TypeScript and powered by the OpenAI API, the system interprets structured datasets through autonomous, specialized AI agents.

---

## ⚙️ Project Overview

**Goal**: Given a user-uploaded CSV or dataset, route it through a set of intelligent AI agents that collaboratively analyze and narrate insights.

### Agents:
- **📊 The Profiler**  
  Parses and summarizes the dataset. Identifies column types, data distributions, and anomalies.

- **🕵️ The Detective**  
  Explores relationships, trends, and correlations across the data. Performs investigative questioning.

- **📚 The Storyteller**  
  Synthesizes everything into a human-readable narrative or executive summary.

---

## 💡 Why It’s Interesting

- Uses autonomous agents with clear roles and task-based prompting
- Explores prompt fidelity, agent chaining, and conversational memory
- Powered by OpenAI API (GPT-3.5 / GPT-4)
- Handles real data (CSV) and returns narrative + analysis
- Fully TypeScript-based (backend and frontend)

---

## 🧱 Architecture

```txt
[Frontend - React]         <- Upload CSV, view agent output
      |
[Backend - Node/TS]        <- CSV parsing, LLM coordination, agent execution
      |
[OpenAI API]               <- Responds to agent prompts (GPT-3.5 / GPT-4)
