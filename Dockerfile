FROM node:20-slim

# Install Azure Functions Core Tools and curl for healthcheck
RUN npm install -g azure-functions-core-tools@4 --unsafe-perm && \
    apt-get update && apt-get install -y curl libicu-dev && rm -rf /var/lib/apt/lists/*

WORKDIR /api

COPY api/package*.json .
COPY api/tsconfig.json .
COPY api/src ./src
COPY api/prisma ./prisma
COPY api/local.settings.json .
COPY api/host.json .

RUN npm install

EXPOSE 7071

# Set environment variable to bypass Azure Storage requirement
ENV AzureWebJobsStorage=DefaultEndpointsProtocol=https;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OtQ7Aeaw==;EndpointSuffix=core.windows.net

HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:7071/api/get-products || exit 1

CMD ["npm", "run", "start"]
