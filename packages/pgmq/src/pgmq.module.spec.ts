import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Pool } from 'pg';
import { PGMQModule } from './pgmq.module';
import { IPGMQService } from './interfaces';
import { QueueProcessor, Processor, OnFailed, OnCompleted, Job } from './decorators/queue.decorators';

describe('PGMQModule', () => {
  let app: INestApplication;
  let pgmqService: IPGMQService;
  let pool: Pool;
  let testConsumer: TestConsumer;

  @QueueProcessor('test-queue')
  class TestConsumer {
    public processed = 0;
    public failed = 0;
    public completed = 0;

    @Processor()
    async process(job: Job) {
      this.processed++;
      if (job.data.shouldFail) {
        throw new Error('Job failed');
      }
      return job.data;
    }

    @OnFailed()
    async onFailed(job: Job, error: Error) {
      this.failed++;
    }

    @OnCompleted()
    async onCompleted(job: Job, result: any) {
      this.completed++;
    }
  }

  beforeAll(async () => {
    // Create a pool first
    pool = new Pool({
      connectionString: 'postgresql://postgres:postgres@localhost:5432/test',
    });

    // Create the queue table if it doesn't exist
    await pool.query(`
      SELECT pgmq.create('test-queue');
    `);

    const moduleRef = await Test.createTestingModule({
      imports: [
        PGMQModule.forRoot({
          connection: 'postgresql://postgres:postgres@localhost:5432/test',
          pool, // Use the existing pool
          defaultVisibilityTimeout: 30,
          defaultMaxRetries: 3,
        }),
        PGMQModule.registerQueue({
          name: 'test-queue',
          defaultVisibilityTimeout: 30,
          defaultMaxRetries: 3,
        }),
      ],
      providers: [TestConsumer],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    pgmqService = moduleRef.get<IPGMQService>(IPGMQService);
    testConsumer = moduleRef.get<TestConsumer>(TestConsumer);
  });

  afterAll(async () => {
    // Drop the queue
    await pool.query(`
      SELECT pgmq.drop_queue('test-queue');
    `);

    // Close the app first to stop all consumers
    await app.close();
    // Then close the pool
    await pool.end();
  });

  beforeEach(async () => {
    // Reset counters
    testConsumer.processed = 0;
    testConsumer.failed = 0;
    testConsumer.completed = 0;

    // Clean up any existing messages
    await pool.query(`
      SELECT pgmq.purge_queue('test-queue');
    `);
  });

  it('should process messages successfully', async () => {
    // Send a test message
    await pgmqService.send('test-queue', { test: 'data' });

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 1000));

    expect(testConsumer.processed).toBe(1);
    expect(testConsumer.completed).toBe(1);
    expect(testConsumer.failed).toBe(0);
  });

  it('should handle failed messages', async () => {
    // Send a message that will fail
    await pgmqService.send('test-queue', { shouldFail: true });

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 1000));

    expect(testConsumer.failed).toBe(1);
    expect(testConsumer.completed).toBe(0);
  });
});