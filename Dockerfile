FROM node:20 AS mcp-builder
WORKDIR /
RUN git clone https://github.com/pdp889/mcp-fda.git mcp-server
WORKDIR /mcp-server
RUN npm install && npm run build

FROM node:20 AS api
WORKDIR /app

# Copy built MCP server
COPY --from=mcp-builder /mcp-server/dist /app/mcp-server
COPY --from=mcp-builder /mcp-server/package.json /app/mcp-server/
COPY --from=mcp-builder /mcp-server/node_modules /app/mcp-server/node_modules

# Install dependencies first (for better caching)
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build the API
RUN npm run build

# Set environment variable for MCP server path
ENV FDA_MCP_SERVER_PATH=/app/mcp-server/index.js

# Expose port
EXPOSE 3000

# Start the API
CMD ["npm", "start"]