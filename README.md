# AI Data Analyzer API

A powerful API for analyzing data using AI agents. The system uses a pipeline of specialized agents to understand, analyze, and explain patterns in data, with built-in conversational capabilities.

## Features

- **Data Analysis**: Comprehensive analysis of structured data
- **Data Profiling**: Understand data structure and types
- **Pattern Detection**: Identify correlations, trends, and anomalies
- **Narrative Generation**: Create compelling data stories with key points
- **Interactive Q&A**: Ask questions about your analyzed data
- **Quality Control**: Automated data quality assessment
- **Context Management**: Maintain analysis state for follow-up questions

## System Components

### Agents (`src/agent/`)
Specialized AI agents that work together to analyze data and handle conversations:

- **Analysis Agent** (`analysis.agent.ts`): Orchestrates the analysis pipeline
- **Profiler Agent** (`profiler.agent.ts`): Analyzes data structure and types
- **Detective Agent** (`detective.agent.ts`): Discovers patterns and insights
- **Storyteller Agent** (`storyteller.agent.ts`): Creates narrative summaries
- **Chat Agent** (`chat.agent.ts`): Handles conversational interactions
- **Quality Control Agent** (`quality-control.agent.ts`): Ensures data quality

### Tools (`src/tools/`)
Reusable components that provide functionality to agents:

- **Dataset Tool** (`data-set.tool.ts`): Data access and manipulation
- **Analysis Context Tool** (`analysis-context.tool.ts`): Access to analysis results
- **Conversation Tool** (`conversation.tool.ts`): Manages chat interactions

### Services (`src/services/`)
Core business logic and state management:

- **Analysis Service** (`analysis.service.ts`): Coordinates analysis operations
- **Chat Service** (`chat.service.ts`): Manages conversation state
- **Session Service** (`session.service.ts`): Handles user sessions

## Data Types

The system uses Zod schemas for type-safe data structures:

```typescript
// Core data structures
const datasetProfileSchema = z.object({
  columns: z.array(columnInfoSchema),
  rowCount: z.number(),
  summary: z.string(),
});

const insightSchema = z.object({
  type: z.enum(['correlation', 'trend', 'anomaly', 'pattern']),
  description: z.string(),
  confidence: z.number(),
  supportingData: z.object({
    evidence: z.string(),
    statistics: z.string(),
  }),
});

const analysisResultSchema = z.object({
  profile: datasetProfileSchema,
  insights: z.array(insightSchema),
  narrative: z.string(),
});
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
- Type-safe with Zod schemas

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
