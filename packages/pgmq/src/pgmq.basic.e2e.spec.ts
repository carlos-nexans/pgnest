import { Test, TestingModule } from '@nestjs/testing';
import { PGMQModule } from './pgmq.module';
import { IPGMQService } from './interfaces';

describe('PGMQModule Basic Integration Tests', () => {
  let app: TestingModule;
  let queueService: IPGMQService;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      imports: [
        PGMQModule.forRoot({
          connection: 'postgresql://postgres:postgres@localhost:5432/test',
          defaultVisibilityTimeout: 30,
          defaultMaxRetries: 3,
        }),
      ],
    }).compile();

    await app.init();

    queueService = app.get<IPGMQService>(IPGMQService);

    // Create the test queue
    console.log('Creating test queue...');
    await queueService.createQueue('test-basic-queue');
    console.log('Test queue created successfully!');
  });

  afterAll(async () => {
    // Clean up
    try {
      await queueService.dropQueue('test-basic-queue');
      console.log('Test queue dropped successfully!');
    } catch (error) {
      console.log('Error dropping queue:', error.message);
    }
    await app.close();
  });

  describe('Basic Queue Operations', () => {
    it('should send and read messages', async () => {
      const messageData = { message: 'Hello PGMQ!', timestamp: Date.now() };
      
      console.log('Sending message:', messageData);
      const messageId = await queueService.send('test-basic-queue', messageData);
      
      expect(messageId).toBeDefined();
      expect(typeof messageId).toBe('number');
      console.log('Message sent with ID:', messageId, 'type:', typeof messageId);

      // Read the message
      const messages = await queueService.read('test-basic-queue', 30, 1);
      expect(messages).toHaveLength(1);
      
      const message = messages[0];
      expect(message.msg_id).toBe(messageId);
      expect(message.message).toEqual(messageData);
      console.log('Message read successfully:', message);

      // Archive the message
      await queueService.archive('test-basic-queue', messageId);
      console.log('Message archived successfully');
    });

    it('should handle multiple messages', async () => {
      const messages = [
        { message: 'Message 1', id: 1 },
        { message: 'Message 2', id: 2 },
        { message: 'Message 3', id: 3 },
      ];

      console.log('Sending multiple messages:', messages);
      const messageIds = await Promise.all(
        messages.map(msg => queueService.send('test-basic-queue', msg))
      );

      expect(messageIds).toHaveLength(3);
      messageIds.forEach(id => {
        expect(id).toBeDefined();
        expect(typeof id).toBe('number');
        console.log('Message sent with ID:', id);
      });

      // Read all messages
      const readMessages = await queueService.read('test-basic-queue', 30, 10);
      expect(readMessages.length).toBeGreaterThanOrEqual(3);

      // Archive all messages
      for (const id of messageIds) {
        await queueService.archive('test-basic-queue', id);
      }
      console.log('All messages archived successfully');
    });

    it('should get queue statistics', async () => {
      const stats = await queueService.getJobCounts('test-basic-queue');
      
      expect(stats).toBeDefined();
      expect(typeof stats.waiting).toBe('number');
      expect(typeof stats.active).toBe('number');
      expect(typeof stats.completed).toBe('number');
      expect(typeof stats.failed).toBe('number');

      console.log('Queue statistics:', stats);
    });

    it('should handle pop operations', async () => {
      const messageData = { test: 'pop operation' };
      
      // Send a message
      const messageId = await queueService.send('test-basic-queue', messageData);
      expect(messageId).toBeDefined();
      expect(typeof messageId).toBe('number');
      console.log('Message sent for pop test with ID:', messageId);

      // Pop the message (read and delete)
      const poppedMessage = await queueService.pop('test-basic-queue');
      expect(poppedMessage).toBeDefined();
      expect(poppedMessage).not.toBeNull();
      expect(poppedMessage!.msg_id).toBe(messageId);
      expect(poppedMessage!.message).toEqual(messageData);
      console.log('Message popped successfully:', poppedMessage);

      // Try to pop again (should return null)
      const emptyPop = await queueService.pop('test-basic-queue');
      expect(emptyPop).toBeNull();
      console.log('Empty pop returned null as expected');
    });

    it('should handle dead letter queue operations', async () => {
      const deadLetters = await queueService.getDeadLetters('test-basic-queue');
      expect(deadLetters).toBeDefined();
      expect(Array.isArray(deadLetters)).toBe(true);
      console.log('Dead letters:', deadLetters.length);
    });
  });

  describe('Queue Management', () => {
    it('should create and drop queues', async () => {
      const queueName = `test-management-queue-${Date.now()}`;
      
      // Create queue
      console.log(`Creating queue: ${queueName}`);
      await queueService.createQueue(queueName);
      
      // Send a message to verify queue works
      const messageData = { test: 'queue management' };
      const messageId = await queueService.send(queueName, messageData);
      expect(messageId).toBeDefined();
      expect(typeof messageId).toBe('number');
      console.log('Message sent to management queue with ID:', messageId);
      
      // Drop queue
      console.log(`Dropping queue: ${queueName}`);
      await queueService.dropQueue(queueName);
      console.log('Queue dropped successfully');
    });
  });
});
