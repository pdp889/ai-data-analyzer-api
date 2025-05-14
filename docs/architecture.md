# Architecture Overview

## System Components

### 1. API Layer
- Express.js server
- RESTful endpoints for data analysis and Q&A
- Basic error handling and logging
- File upload handling with multer

### 2. Agent System
The system uses a pipeline of specialized AI agents:

#### Profiler Agent
- Initial data analysis
- Column type detection
- Basic statistics
- Data quality assessment

#### Detective Agent
- Pattern recognition
- Correlation analysis
- Anomaly detection
- Trend identification

#### Storyteller Agent
- Narrative synthesis
- Key findings summary
- Data story generation
- Report formatting

#### Chat Agent
- Interactive Q&A
- Context-aware responses
- Analysis refinement
- Confidence scoring

### 3. Data Processing
- CSV parsing
- In-memory data handling
- Basic data validation

### 4. Error Handling
- Centralized error handling
- Custom error types
- Error logging
- Client-friendly error messages

## Data Flow

1. **Data Upload**
   - Client uploads CSV file
   - File is parsed and validated
   - Data is prepared for analysis

2. **Analysis Pipeline**
   - Profiler Agent analyzes data structure
   - Detective Agent generates insights
   - Storyteller Agent creates narrative
   - Results are stored in memory

3. **Q&A Processing**
   - Chat Agent maintains analysis context
   - Processes natural language questions
   - Provides context-aware answers
   - Updates analysis when needed

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