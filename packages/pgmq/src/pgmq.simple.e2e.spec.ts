import { Test, TestingModule } from '@nestjs/testing';
import { PGMQModule } from './pgmq.module';
import { IPGMQService } from './interfaces';

describe('PGMQModule Simple E2E Tests', () => {
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
  });

  afterAll(async () => {
    await app.close();
  });

  it('should send and read messages', async () => {
    const queueName = 'simple-test-queue';
    
    // Create queue
    await queueService.createQueue(queueName);
    
    // Send message
    const messageData = { message: 'Hello PGMQ!', timestamp: Date.now() };
    const messageId = await queueService.send(queueName, messageData);
    
    // Verify message was sent
    expect(messageId).toBeDefined();
    
    // Read message
    const messages = await queueService.read(queueName, 30, 1);
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toEqual(messageData);
    
    // Archive message
    await queueService.archive(queueName, messageId);
    
    // Clean up
    await queueService.dropQueue(queueName);
  });

  it('should handle multiple messages', async () => {
    const queueName = 'multi-test-queue';
    
    // Create queue
    await queueService.createQueue(queueName);
    
    // Send multiple messages
    const messages = [
      { message: 'Message 1', id: 1 },
      { message: 'Message 2', id: 2 },
      { message: 'Message 3', id: 3 },
    ];
    
    const messageIds = await Promise.all(
      messages.map(msg => queueService.send(queueName, msg))
    );
    
    expect(messageIds).toHaveLength(3);
    messageIds.forEach(id => expect(id).toBeDefined());
    
    // Read all messages
    const readMessages = await queueService.read(queueName, 30, 10);
    expect(readMessages.length).toBeGreaterThanOrEqual(3);
    
    // Archive all messages
    await queueService.archiveBatch(queueName, messageIds);
    
    // Clean up
    await queueService.dropQueue(queueName);
  });

  it('should get queue statistics', async () => {
    const queueName = 'stats-test-queue';
    
    // Create queue
    await queueService.createQueue(queueName);
    
    // Get stats
    const stats = await queueService.getJobCounts(queueName);
    
    expect(stats).toBeDefined();
    expect(stats.waiting).toBeDefined();
    expect(stats.active).toBeDefined();
    expect(stats.completed).toBeDefined();
    expect(stats.failed).toBeDefined();
    
    // Clean up
    await queueService.dropQueue(queueName);
  });
});
