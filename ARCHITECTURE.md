# AI Data Analyzer API - Architecture

## System Overview

The AI Data Analyzer API is a multi-agent system designed to analyze and extract insights from structured data (primarily CSV files) using a coordinated set of specialized AI agents. The system employs a microservices-inspired architecture with clear separation of concerns and modular components.

## Core Components

### 1. API Layer (`src/routes/`)
- **dataAnalysis.ts**: Main entry point for data analysis requests
  - Handles file uploads via Multer
  - Manages CSV parsing
  - Coordinates agent execution
  - Returns structured analysis results

### 2. Agent System (`src/agents/`)
The system employs three specialized AI agents:

#### Profiler Agent
- **Role**: Initial data analysis and profiling
- **Responsibilities**:
  - Analyzes dataset structure
  - Identifies column types
  - Detects anomalies
  - Provides data quality metrics
- **Implementation**: `ProfilerAgent.ts`

#### Detective Agent (Planned)
- **Role**: Deep data analysis
- **Responsibilities**:
  - Identifies correlations
  - Discovers trends
  - Performs statistical analysis
  - Generates insights

#### Storyteller Agent (Planned)
- **Role**: Narrative synthesis
- **Responsibilities**:
  - Combines insights from other agents
  - Generates human-readable summaries
  - Creates executive reports

### 3. Type System (`src/types/`)
Core interfaces defining the system's data structures:
- `DatasetProfile`: Dataset metadata and structure
- `ColumnInfo`: Column-specific information
- `AnalysisResult`: Combined analysis output
- `Insight`: Individual data insights
- Agent interfaces for type safety

### 4. Middleware (`src/middleware/`)
- **errorHandler.ts**: Centralized error handling
  - Custom error types
  - Consistent error responses
  - Error logging

### 5. Utilities (`src/utils/`)
- **logger.ts**: Winston-based logging system
  - Console and file logging
  - Error tracking
  - Performance monitoring

## Data Flow

1. **File Upload**
   ```
   Client -> API -> Multer -> CSV Parser -> Data Structure
   ```

2. **Analysis Pipeline**
   ```
   Data -> Profiler -> Dataset Profile
   Dataset Profile -> Detective -> Insights
   (Profile + Insights) -> Storyteller -> Narrative
   ```

3. **Response Generation**
   ```
   Analysis Results -> API -> JSON Response -> Client
   ```

## Technical Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **AI Integration**: OpenAI API (GPT-3.5-turbo)
- **File Processing**: csv-parse
- **Logging**: Winston
- **Type Safety**: TypeScript + Zod

## Configuration

Environment variables (`.env`):
- `PORT`: Server port
- `OPENAI_API_KEY`: OpenAI API credentials
- `LOG_LEVEL`: Logging verbosity
- `UPLOAD_DIR`: File upload directory
- `MAX_FILE_SIZE`: Upload size limit

## Security Considerations

1. **File Upload**
   - Size limits
   - Type validation
   - Secure storage

2. **API Security**
   - CORS configuration
   - Rate limiting (planned)
   - Input validation

3. **Data Privacy**
   - Temporary file storage
   - Secure API key handling
   - Data sanitization

## Error Handling

The system implements a robust error handling strategy:
1. Custom `AppError` class for known errors
2. Centralized error handler middleware
3. Structured error responses
4. Comprehensive logging

## Future Enhancements

1. **Agent System**
   - Add Detective and Storyteller agents
   - Implement agent communication
   - Add agent-specific prompts

2. **Performance**
   - Implement caching
   - Add request queuing
   - Optimize file processing

3. **Features**
   - Support for additional file types
   - Real-time analysis updates
   - Custom analysis templates

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