import { Agent, webSearchTool } from '@openai/agents';

const INSTRUCTIONS = `You are a web search agent that can search the web for relevant information.

You will be given a question and a chat history from the chat agent.

You will need to use the web search tool to find relevant information and then respond to the user with a response that is augmented with the web search results.

`;

const webSearchAgent = new Agent({
  name: 'The Web Search Agent',
  model: 'gpt-4.1-mini',
  instructions: INSTRUCTIONS,
  handoffDescription:
    'Web Search Agent responsible for augmenting a chat response with additional context from the web',
  tools: [webSearchTool()],
});

export default webSearchAgent;
