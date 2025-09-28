# Basic Queue Example

This example demonstrates how to use `@pgnest/pgmq` to implement a simple producer-consumer pattern using PostgreSQL as a message queue.

## Features

- Producer service that emits a message every 5 seconds using cron
- Consumer service that processes messages and logs them
- Dead Letter Queue (DLQ) monitor that shows failed message statistics every 30 seconds
- 50% random message failure rate for testing DLQ functionality
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
2. The `MessageConsumer` service uses PGMQ decorators to automatically process messages from the queue
3. Each message has a 50% chance of failure to demonstrate DLQ functionality
4. If processing fails, the message is moved to a dead-letter queue after max retries
5. The `DLQMonitor` service runs every 30 seconds to show statistics about failed messages
6. Messages are persisted in PostgreSQL, so no messages are lost if the application crashes

## Structure

- `src/message.producer.ts`: Cron job that produces messages
- `src/message.consumer.ts`: Queue processor using @QueueProcessor and @Processor decorators
- `src/dlq.monitor.ts`: Dead letter queue monitor with cron job
- `src/app.module.ts`: Main application module with PGMQ configuration
- `docker-compose.yml`: PostgreSQL setup with PGMQ extension

## Monitoring

The application includes a DLQ monitor that runs every 30 seconds and displays:
- Number of failed messages in the dead letter queue
- Details of recent failed messages including error messages and retry attempts
- Queue statistics (waiting, completed, failed message counts)

Watch the console output to see the DLQ monitoring in action! With the 50% failure rate, you'll see messages building up in the dead letter queue, and the monitor will show detailed statistics about failed messages.
