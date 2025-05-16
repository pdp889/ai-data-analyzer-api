# AI Data Analyzer API

A powerful API for analyzing CSV datasets using AI agents. The system uses a pipeline of specialized agents to understand, analyze, and explain patterns in CSV data files.

## Features

- **CSV Data Analysis**: Comprehensive analysis of CSV files
- **Data Profiling**: Understand CSV structure and column types
- **Pattern Detection**: Identify correlations, trends, and anomalies in CSV data
- **Narrative Generation**: Create compelling data stories with key points and conclusions
- **Interactive Q&A**: Ask questions about your analyzed CSV data
- **Session Management**: Maintain analysis state for follow-up questions

## Architecture

The system uses a pipeline of specialized AI agents to analyze CSV data:

### Profiler Agent
- Analyzes CSV structure
- Identifies column types
- Provides data quality metrics
- Generates dataset profile

### Detective Agent
- Analyzes patterns and relationships in CSV data
- Identifies correlations and trends
- Generates insights with confidence levels
- Provides supporting evidence and statistics

### Storyteller Agent
- Creates coherent narratives from CSV analysis
- Generates key points
- Provides conclusions
- Synthesizes complex analysis

## API Endpoints

### Data Analysis
- `POST /api/analyze`: Upload and analyze a CSV file
  - Accepts multipart/form-data with CSV file
  - Only CSV files are supported
  - Returns profile, insights, and narrative

### Interactive Features
- `POST /api/ask`: Ask questions about the analyzed CSV data
  - Requires a question in the request body
  - Returns AI-generated answer

### Session Management
- `GET /api/existing-analysis`: Get current analysis state
- `DELETE /api/clear-session`: Clear current analysis session

## Data Types

The system uses several key data structures for CSV analysis:

```typescript
// Core data structures
interface DatasetProfile {
  columns: ColumnInfo[];
  rowCount: number;
  summary: string;
}

interface ColumnInfo {
  name: string;
  type: string;
  missingValues?: number;
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

interface StoryAnalysis {
  narrative: string;
  keyPoints: string[];
  conclusion: string;
}
```

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy environment variables:
   ```bash
   cp .env.example .env
   ```
4. Configure environment variables:
   ```
   OPENAI_API_KEY=your_api_key
   PORT=3000
   LOG_LEVEL=info
   ```
5. Start development server: `npm run dev`
   - For production: `npm run build && npm start`

## Development

- Built with TypeScript and Express.js
- Uses OpenAI's API for AI analysis
- Implements Winston for logging
- Includes Swagger/OpenAPI documentation
- Features comprehensive error handling
- CSV-only file support with validation

## Available Scripts

- `npm run dev`: Start development server with hot reload
- `npm run build`: Build for production
- `npm start`: Start production server
- `npm run lint`: Run ESLint
- `npm run format`: Format code with Prettier
- `npm test`: Run tests

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details
