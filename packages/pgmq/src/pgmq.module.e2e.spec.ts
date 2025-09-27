import { Test, TestingModule } from '@nestjs/testing';
import { PGMQModule } from './pgmq.module';
import { IPGMQService, PGMQMessage } from './interfaces';
import { QueueProcessor, Processor, OnFailed, OnGlobalQueueCompleted } from './decorators';
import { Job, ProcessOptions } from './decorators/types';

// Test processor class
@QueueProcessor('test-queue')
export class TestProcessor {
  private processedJobs: PGMQMessage[] = [];
  private failedJobs: PGMQMessage[] = [];
  private completedJobs: PGMQMessage[] = [];

  @Processor({ name: 'test-job' } as ProcessOptions)
  async process(job: PGMQMessage) {
    console.log(`Processing job: ${job.msg_id} with data:`, job.message);
    this.processedJobs.push(job);
    
    // Simulate some work
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Simulate failure for certain messages
    if (job.message && typeof job.message === 'object' && 'shouldFail' in job.message) {
      throw new Error(`Job ${job.msg_id} failed as requested`);
    }
    
    console.log(`Completed processing job: ${job.msg_id}`);
    return { processed: true, jobId: job.msg_id };
  }

  @OnFailed()
  async onFailed(job: PGMQMessage, error: Error) {
    console.log(`Job failed: ${job.msg_id}, error:`, error.message);
    this.failedJobs.push(job);
  }

  @OnGlobalQueueCompleted()
  async onCompleted(job: PGMQMessage) {
    console.log(`Job completed: ${job.msg_id}`);
    this.completedJobs.push(job);
  }

  getProcessedJobs() {
    return this.processedJobs;
  }

  getFailedJobs() {
    return this.failedJobs;
  }

  getCompletedJobs() {
    return this.completedJobs;
  }
}

describe('PGMQModule Integration Tests', () => {
  let app: TestingModule;
  let queueService: IPGMQService;
  let testProcessor: TestProcessor;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      imports: [
        PGMQModule.forRoot({
          connection: 'postgresql://postgres:postgres@localhost:5432/test',
          defaultVisibilityTimeout: 30,
          defaultMaxRetries: 3,
        }),
        PGMQModule.registerQueue({
          name: 'test-queue',
          defaultVisibilityTimeout: 30,
          defaultMaxRetries: 3,
        }),
      ],
      providers: [TestProcessor],
    }).compile();

    await app.init();

    queueService = app.get<IPGMQService>(IPGMQService);
    testProcessor = app.get<TestProcessor>(TestProcessor);

    // Create the test queue
    console.log('Creating test queue...');
    await queueService.createQueue('test-queue');
    console.log('Test queue created successfully!');
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    // Clear processed jobs before each test
    testProcessor.getProcessedJobs().length = 0;
    testProcessor.getFailedJobs().length = 0;
    testProcessor.getCompletedJobs().length = 0;
  });

  describe('Basic Queue Operations', () => {
    it('should send and process a simple message', async () => {
      const messageData = { message: 'Hello PGMQ!', timestamp: Date.now() };
      
      console.log('Sending message:', messageData);
      const result = await queueService.send('test-queue', messageData);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('number');
      console.log('Message sent with ID:', result);

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      const processedJobs = testProcessor.getProcessedJobs();
      const completedJobs = testProcessor.getCompletedJobs();

      expect(processedJobs.length).toBeGreaterThan(0);
      expect(completedJobs.length).toBeGreaterThan(0);

      const processedJob = processedJobs.find(job => job.msg_id === result);
      expect(processedJob).toBeDefined();
      expect(processedJob.message).toEqual(messageData);
    }, 10000);

    it('should handle failed messages', async () => {
      const messageData = { message: 'This will fail', shouldFail: true, timestamp: Date.now() };
      
      console.log('Sending message that should fail:', messageData);
      const result = await queueService.send('test-queue', messageData);
      
      expect(result).toBeDefined();
      console.log('Message sent with ID:', result);

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      const processedJobs = testProcessor.getProcessedJobs();
      const failedJobs = testProcessor.getFailedJobs();

      expect(processedJobs.length).toBeGreaterThan(0);
      expect(failedJobs.length).toBeGreaterThan(0);

      const failedJob = failedJobs.find(job => job.msg_id === result);
      expect(failedJob).toBeDefined();
    }, 10000);

    it('should send multiple messages and process them', async () => {
      const messages = [
        { message: 'Message 1', id: 1 },
        { message: 'Message 2', id: 2 },
        { message: 'Message 3', id: 3 },
      ];

      console.log('Sending multiple messages:', messages);
      const results = await Promise.all(
        messages.map(msg => queueService.send('test-queue', msg))
      );

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(typeof result).toBe('number');
        console.log('Message sent with ID:', result);
      });

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      const processedJobs = testProcessor.getProcessedJobs();
      const completedJobs = testProcessor.getCompletedJobs();

      expect(processedJobs.length).toBeGreaterThanOrEqual(3);
      expect(completedJobs.length).toBeGreaterThanOrEqual(3);

      // Verify all messages were processed
      messages.forEach((msg, index) => {
        const processedJob = processedJobs.find(job => 
          job.message && typeof job.message === 'object' && 'id' in job.message && job.message.id === msg.id
        );
        expect(processedJob).toBeDefined();
      });
    }, 15000);

    it('should get queue statistics', async () => {
      const stats = await queueService.getJobCounts('test-queue');
      
      expect(stats).toBeDefined();
      expect(typeof stats.waiting).toBe('number');
      expect(typeof stats.active).toBe('number');
      expect(typeof stats.completed).toBe('number');
      expect(typeof stats.failed).toBe('number');

      console.log('Queue statistics:', stats);
    });
  });

  describe('Queue Management', () => {
    it('should create and drop queues', async () => {
      const queueName = 'test-management-queue';
      
      // Create queue
      console.log(`Creating queue: ${queueName}`);
      const createResult = await queueService.createQueue(queueName);
      expect(createResult).toBeDefined();
      
      // Send a message to verify queue works
      const messageData = { test: 'queue management' };
      const sendResult = await queueService.send(queueName, messageData);
      expect(typeof sendResult).toBe('number');
      
      // Drop queue
      console.log(`Dropping queue: ${queueName}`);
      const dropResult = await queueService.dropQueue(queueName);
      expect(dropResult).toBeDefined();
    });

    it('should handle queue operations gracefully', async () => {
      // Test reading from queue
      const readResult = await queueService.read('test-queue', 1);
      expect(readResult).toBeDefined();
      expect(Array.isArray(readResult)).toBe(true);

      // Test getting dead letters
      const deadLetters = await queueService.getDeadLetters('test-queue');
      expect(deadLetters).toBeDefined();
      expect(Array.isArray(deadLetters)).toBe(true);

      console.log('Dead letters:', deadLetters.length);
    });
  });
});
