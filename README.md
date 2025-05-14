# AI Data Analyzer API

A powerful API for analyzing structured data using AI agents. The system employs multiple specialized agents to provide comprehensive data analysis, insights, and interactive Q&A capabilities.

## Features

- **Multi-Agent Analysis System**
  - Profiler Agent: Initial data analysis and profiling
  - Detective Agent: Pattern discovery and insight generation
  - Storyteller Agent: Narrative synthesis and report generation
  - Chat Agent: Interactive Q&A and analysis refinement

- **Data Analysis Capabilities**
  - CSV file processing
  - Column type detection
  - Statistical analysis
  - Pattern recognition
  - Insight generation
  - Narrative synthesis

- **Interactive Q&A**
  - Natural language questions about the data
  - Context-aware responses
  - Automatic reanalysis when needed
  - Confidence scoring for answers

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ai-data-analyzer-api.git
cd ai-data-analyzer-api
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
PORT=3000
OPENAI_API_KEY=your_api_key_here
LOG_LEVEL=info
```

4. Start the development server:
```bash
npm run dev
```

## API Endpoints

### Analyze Data
```http
POST /api/analyze
Content-Type: multipart/form-data

file: <csv_file>
```

### Ask Questions
```http
POST /api/ask
Content-Type: application/json

{
  "question": "What are the key trends in the data?"
}
```

## Project Structure

```
src/
├── agents/           # AI agent implementations
├── middleware/       # Express middleware
├── routes/          # API route handlers
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
└── index.ts         # Application entry point
```

## Development

### Available Scripts

- `npm run dev`: Start development server with hot reload
- `npm run build`: Build for production
- `npm start`: Start production server
- `npm run lint`: Run ESLint
- `npm run test`: Run tests

### Environment Variables

- `PORT`: Server port (default: 3000)
- `OPENAI_API_KEY`: OpenAI API key
- `LOG_LEVEL`: Logging level (default: info)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
