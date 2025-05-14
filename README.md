# AI Data Analyzer API

A powerful API for analyzing datasets using AI agents. The system uses a pipeline of specialized agents to understand, analyze, and explain data patterns.

## Features

- **Data Profiling**: Understand dataset structure and types
- **Pattern Detection**: Identify correlations, trends, and anomalies
- **Narrative Generation**: Create compelling data stories
- **Interactive Q&A**: Ask questions about your data
- **Quality Control**: Ensure accurate and complete answers

## Architecture

The system uses a pipeline of specialized AI agents:

### Profiler Agent
- Analyzes dataset structure
- Identifies column types
- Processes data in efficient chunks
- Generates basic dataset profile

### Detective Agent
- Analyzes patterns and relationships
- Identifies correlations and trends
- Detects anomalies
- Provides evidence-based insights

### Storyteller Agent
- Creates coherent narratives
- Highlights key findings
- Provides actionable conclusions
- Synthesizes complex analysis

### Chat Agent
- Manages user interactions
- Evaluates answer quality
- Generates improved prompts
- Maintains conversation context

## Data Types

The system uses several key data structures:

```typescript
// Core data structures
interface DatasetProfile {
  columns: Column[];
  rowCount: number;
  summary: string;
}

interface Column {
  name: string;
  type: string;
  missingValues: number;
}

interface Insight {
  type: 'correlation' | 'trend' | 'anomaly' | 'pattern';
  description: string;
  confidence: number;
  supportingData: {
    evidence: string;
    statistics: string;
  };
}
```

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables:
   ```
   OPENAI_API_KEY=your_api_key
   PORT=3000
   ```
4. Start the server: `npm start`

## API Endpoints

- `POST /api/analyze`: Upload and analyze a dataset
- `POST /api/chat`: Ask questions about your data
- `GET /api/health`: Check API health

## Development

- Built with TypeScript
- Uses OpenAI's GPT models
- Implements efficient data processing
- Includes comprehensive error handling

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details
