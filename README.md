# PGNest

Drop-in replacements for NestJS common functionality using PostgreSQL.

## PGMQ Module

The PGMQ module provides a PostgreSQL-based drop-in replacement for @nestjs/bull. It uses the PGMQ extension to implement a robust message queue system directly in your PostgreSQL database.

### Why use PGMQ instead of Bull?

- **Simplified Infrastructure**: If you're already using PostgreSQL, you don't need Redis
- **Transactional Safety**: Queue operations can be part of your database transactions
- **Persistence**: Messages are automatically persisted in PostgreSQL
- **Familiar API**: Uses the same decorator syntax as @nestjs/bull

### Prerequisites

1. PostgreSQL database with PGMQ extension installed
2. NestJS application

### Installation

```bash
npm install @pgnest/pgmq
```

### Usage

1. Import PGMQModule instead of BullModule:

```typescript
// Before with @nestjs/bull
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: 'localhost',
        port: 6379,
      }
    })
  ]
})

// After with @pgnest/pgmq
import { PGMQModule } from '@pgnest/pgmq';

@Module({
  imports: [
    PGMQModule.forRoot({
      connectionString: 'postgresql://user:password@localhost:5432/dbname'
    })
  ]
})
```

2. Create a queue processor (same syntax as @nestjs/bull):

```typescript
import { Processor, Process, OnQueueFailed } from '@pgnest/pgmq';

@Processor('my-queue')
export class MyQueueProcessor {
  @Process()
  async process(job: Job<any>) {
    // Process your job here
    return result;
  }

  @OnQueueFailed()
  async onFailed(job: Job<any>, error: Error) {
    // Handle failure
  }
}
```

3. Send messages to the queue:

```typescript
import { Injectable } from '@nestjs/common';
import { IPGMQService } from '@pgnest/pgmq';

@Injectable()
export class MyService {
  constructor(private readonly queueService: IPGMQService) {}

  async addJob() {
    await this.queueService.send('my-queue', { data: 'hello' });
  }
}
```

### Decorator Mappings from @nestjs/bull

| @nestjs/bull | @pgnest/pgmq |
|--------------|--------------|
| @Processor() | @Processor() |
| @Process() | @Process() |
| @OnQueueFailed() | @OnQueueFailed() |
| @OnGlobalQueueCompleted() | @OnGlobalQueueCompleted() |

### Features

- Message persistence in PostgreSQL
- Dead letter queues
- Retry mechanism
- Concurrent processing
- Job completion tracking
- Error handling
- Batch operations

### Examples

Check out the [examples](./examples) directory for working examples:
- [Basic Queue](./examples/basic-queue): Simple producer-consumer pattern
- More examples coming soon...

## License

MIT