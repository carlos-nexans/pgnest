# Basic Queue Example

This example demonstrates how to use `@pgnest/pgmq` to implement a simple producer-consumer pattern using PostgreSQL as a message queue.

## Features

- Producer service that emits a message every 5 seconds using cron
- Consumer service that processes messages and logs them
- PostgreSQL with PGMQ extension running in Docker

## Prerequisites

- Docker and Docker Compose
- Node.js 16+
- npm or yarn

## Setup

1. Start the PostgreSQL database:
```bash
docker-compose up -d
```

2. Install dependencies:
```bash
npm install
```

3. Start the application:
```bash
npm run start:dev
```

## How it works

1. The `MessageProducer` service uses `@nestjs/schedule` to emit a message every 5 seconds to the `example-queue`
2. The `MessageConsumer` service processes messages from the queue and logs them
3. If processing fails, the message is moved to a dead-letter queue after max retries
4. Messages are persisted in PostgreSQL, so no messages are lost if the application crashes

## Structure

- `src/message.producer.ts`: Cron job that produces messages
- `src/message.consumer.ts`: Queue processor that consumes messages
- `src/app.module.ts`: Main application module with PGMQ configuration
- `docker-compose.yml`: PostgreSQL setup with PGMQ extension
