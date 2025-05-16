# AI Data Analyzer API - Architecture

## System Overview

The AI Data Analyzer API is a multi-agent system designed to analyze and extract insights from structured data (primarily CSV files) using a coordinated set of specialized AI agents. The system employs a microservices-inspired architecture with clear separation of concerns and modular components.

## Core Components

### 1. API Layer (`src/routes/`)
- **dataAnalysis.ts**: Main entry point for data analysis requests
  - Handles file uploads via Multer
  - Manages CSV parsing
  - Coordinates agent execution
  - Manages session state for analysis data
  - Provides endpoints for analysis, Q&A, and session management

### 2. Agent System (`src/agents/`)
The system employs three specialized AI agents that work in sequence:

#### Profiler Agent
- **Role**: Initial data analysis and profiling
- **Responsibilities**:
  - Analyzes dataset structure
  - Identifies column types
  - Provides data quality metrics
- **Implementation**: `ProfilerAgent.ts`
- **Output**: `DatasetProfile` with column information and summary

#### Detective Agent
- **Role**: Deep data analysis and pattern discovery
- **Responsibilities**:
  - Identifies correlations between columns
  - Discovers trends and patterns
  - Generates structured insights with confidence levels
- **Implementation**: `DetectiveAgent.ts`
- **Output**: Array of `Insight` objects with type, description, confidence, and supporting data

#### Storyteller Agent
- **Role**: Narrative synthesis and report generation
- **Responsibilities**:
  - Combines profile and insights into a coherent narrative
  - Generates key points and conclusions
  - Creates executive summaries
- **Implementation**: `StorytellerAgent.ts`
- **Output**: `StoryAnalysis` with narrative, key points, and conclusion

### 3. Type System (`src/types/`)
Core interfaces defining the system's data structures:
- `DatasetProfile`: Dataset metadata and structure
  - Column information
  - Row count
  - Summary
- `ColumnInfo`: Column-specific information
  - Name
  - Type
  - Missing values count
- `Insight`: Individual data insights
  - Type (correlation, trend, anomaly, pattern)
  - Description
  - Confidence level
  - Supporting data (evidence and statistics)
- `AnalysisResult`: Combined analysis output
  - Profile
  - Insights
  - Narrative
- `AnalysisState`: Extended analysis result
  - Includes original data
  - Used for session management
- `StoryAnalysis`: Narrative output
  - Narrative text
  - Key points
  - Conclusion

### 4. Middleware (`src/middleware/`)
- **errorHandler.ts**: Centralized error handling
  - Custom `AppError` class
  - OpenAI API error handling
  - Consistent error responses
  - Error logging

### 5. Utilities (`src/utils/`)
- **logger.ts**: Winston-based logging system
  - Console and file logging
  - Error tracking
  - Performance monitoring
- **analysisPipeline.ts**: Analysis coordination
  - Agent pipeline execution
  - Error handling
  - Custom prompt support
  - Logging of analysis progress

## Data Flow

1. **File Upload and Analysis**
   ```
   Client -> API -> CSV Parser -> Analysis Pipeline
   ```

2. **Analysis Pipeline**
   ```
   Data -> Profiler -> Dataset Profile
   (Data + Profile) -> Detective -> Insights
   (Profile + Insights) -> Storyteller -> Narrative
   ```

3. **Session Management**
   ```
   Analysis Results -> Session Storage
   Session Data -> Q&A Endpoint
   ```

4. **Response Generation**
   ```
   Analysis Results -> API -> JSON Response -> Client
   ```

## Technical Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **AI Integration**: OpenAI API
- **File Processing**: csv-parse
- **Logging**: Winston
- **Type Safety**: TypeScript
- **API Documentation**: Swagger/OpenAPI

## Configuration

Environment variables (`.env`):
- `PORT`: Server port
- `OPENAI_API_KEY`: OpenAI API credentials
- `LOG_LEVEL`: Logging verbosity

## Security Considerations

1. **File Upload**
   - Size limits
   - Type validation
   - Memory storage

2. **API Security**
   - CORS configuration
   - Input validation
   - Error handling

3. **Data Privacy**
   - Session-based storage
   - Secure API key handling
   - Data sanitization

## Error Handling

The system implements a robust error handling strategy:
1. Custom `AppError` class for known errors
2. Centralized error handler middleware
3. Structured error responses
4. Comprehensive logging
5. OpenAI API error handling

## Future Enhancements

1. **Agent System**
   - Add agent-specific prompts configuration
   - Implement agent communication patterns
   - Add agent performance metrics
   - Enhance analysis capabilities

2. **Performance**
   - Implement caching
   - Add request queuing
   - Optimize file processing
   - Add batch processing support

3. **Features**
   - Support for additional file types
   - Real-time analysis updates
   - Custom analysis templates
   - Export options (PDF, Excel)
   - Enhanced Q&A capabilities

## Development Workflow

1. **Setup**
   ```bash
   npm install
   cp .env.example .env
   # Configure .env
   ```

2. **Development**
   ```bash
   npm run dev
   ```

3. **Production**
   ```bash
   npm run build
   npm start
   ```

## Testing Strategy

1. **Unit Tests**
   - Agent functionality
   - Data processing
   - Error handling

2. **Integration Tests**
   - API endpoints
   - File processing
   - Agent coordination

3. **End-to-End Tests**
   - Complete analysis flows
   - Error scenarios
   - Performance benchmarks 