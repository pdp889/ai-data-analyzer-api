# Food Intelligence: AI-Powered Data Analyzer API

A powerful backend service for analyzing datasets using AI agents, providing insights, and maintaining conversation context.

## Features

- **Multi-Agent Analysis Pipeline**
  - Profiler Agent: Analyzes dataset structure and statistics
  - Detective Agent: Identifies patterns and insights
  - Storyteller Agent: Generates human-readable narratives
  - Chat Agent: Answers questions about analyzed data
  - Quality Assurance Agent: Ensures quality responses
  - Web Search Agent: Supports Chat Agent by exposing web search capabilities
  - Additional Context Agent: Gathers FDA recalls and adverse events for food-related data

- **Enhanced Capabilities**
  - Web search integration for real-time data verification
  - Access to custom-built FDA MCP Server for specialized food safety data analysis
  - Food safety specific analysis and validation
  - FDA recall and adverse event correlation

- **Data Processing**
  - CSV file parsing and validation
  - Statistical analysis and pattern recognition
  - Food safety metrics and parameter tracking
  - Temperature and time pattern analysis
  - Microbial and chemical measurement monitoring

- **Security**
  - HTTPS support for production
  - Rate limiting
  - Helmet security headers
  - CORS configuration
  - Environment-based security settings

## Prerequisites

- Node.js (v16 or higher)
- Docker and Docker Compose
- OpenAI API key
- (Optional) SSL certificates for HTTPS
- (Optional) FDA API Key

## Environment Variables

```env
# OpenAI Configuration
OPENAI_API_KEY=your-api-key

# FDA MCP Server (Optional)
FDA_MCP_SERVER_PATH=/path/to/fda-mcp-server
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ai-data-analyzer-api.git
cd ai-data-analyzer-api
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start Redis using Docker Compose:
```bash
docker-compose up redis
```

5. Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3000/api` with Swagger documentation at `/api-docs`.

## API Endpoints

### Analysis
- `POST /api/analyze`: Upload and analyze a dataset
- `GET /api/existing-analysis`: Get current analysis results
- `DELETE /api/clear-session`: Clear current analysis session

### Chat
- `POST /api/ask`: Ask questions about the analyzed data

## Response Format

```json
{
  "analysisId": "123",
  "profile": {
    "columns": [...],
    "statistics": {...}
  },
  "insights": [...],
  "narrative": "A comprehensive summary of the analysis...",
  "additionalContext": {
    "fdaRecalls": [...],
    "adverseEvents": [...],
    "relatedProducts": [...]
  }
}
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
