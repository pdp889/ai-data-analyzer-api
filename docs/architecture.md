# Architecture Overview

## Core Components

### 1. Agent System
The system uses a pipeline of specialized agents, each with a specific role:

- **Profiler Agent**: Analyzes dataset structure and basic statistics
  - Processes data in chunks of 100 rows
  - Identifies column types and basic structure
  - Generates initial dataset profile

- **Detective Agent**: Generates insights and patterns
  - Uses both profile and data samples
  - Identifies correlations, trends, and anomalies
  - Provides evidence-based insights

- **Storyteller Agent**: Creates narrative from analysis
  - Synthesizes insights into coherent story
  - Highlights key findings
  - Provides actionable conclusions

- **Chat Agent**: Handles user interactions
  - Manages conversation state
  - Evaluates answer quality
  - Generates improved prompts when needed

### 2. Data Types

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

interface AnalysisResult {
  profile: DatasetProfile;
  insights: Insight[];
  narrative: string;
}
```

### 3. Prompt System

Each agent has a specialized prompt system:

- **Profiler Prompts**: Focus on data structure analysis
- **Detective Prompts**: Guide insight generation with specific JSON structure
- **Storyteller Prompts**: Direct narrative creation
- **Chat Prompts**: Handle conversation flow and quality control

## Data Flow

1. **Data Ingestion**
   - File upload and validation
   - Initial data structure check

2. **Analysis Pipeline**
   - Profiler generates basic structure
   - Detective analyzes patterns
   - Storyteller creates narrative

3. **Interaction Layer**
   - Chat agent manages user queries
   - Quality control evaluates responses
   - Dynamic prompt adjustment

## Error Handling

- Centralized error handling through AppError
- Specific error types for different scenarios
- Graceful degradation and user feedback

## Security

- API key management
- Input validation
- Rate limiting
- Error message sanitization

## Performance Considerations

- Chunked data processing
- Efficient data structures
- Caching where appropriate
- Rate limiting for API calls

## System Components

### 1. API Layer
- Express.js server
- RESTful endpoints for data analysis and Q&A
- Basic error handling and logging
- File upload handling with multer

### 3. Data Processing
- CSV parsing
- In-memory data handling
- Basic data validation

## Security Considerations

- Basic input validation
- Error handling
- API key management
- Request rate limiting

## Limitations

- Single-user architecture
- In-memory state management
- Basic file validation
- No persistent storage

## Future Improvements

1. **Multi-user Support**
   - Session management
   - User authentication
   - Resource isolation

2. **Enhanced Security**
   - Input sanitization
   - Rate limiting
   - API key rotation

3. **Data Management**
   - Persistent storage
   - Data caching
   - File cleanup

4. **Performance**
   - Response caching
   - Batch processing
   - Async operations

5. **Monitoring**
   - Performance metrics
   - Usage tracking
   - Error monitoring 