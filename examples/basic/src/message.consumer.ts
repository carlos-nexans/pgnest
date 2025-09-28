import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import { IPGMQService, PGMQMessage } from '@pgnest/pgmq';

interface Message {
  id: number;
  text: string;
  timestamp: string;
}

@Injectable()
export class MessageConsumer implements OnModuleInit {
  private readonly logger = new Logger(MessageConsumer.name);
  private isProcessing = false;

  constructor(
    @Inject(IPGMQService)
    private readonly queueService: IPGMQService
  ) {}

  async onModuleInit() {
    // Start polling for messages
    this.startPolling();
  }

  private async startPolling() {
    this.logger.log('🔄 Starting message polling for example-queue...');
    
    // Poll every 2 seconds
    setInterval(async () => {
      if (!this.isProcessing) {
        await this.processMessages();
      }
    }, 2000);
  }

  private async processMessages() {
    try {
      this.isProcessing = true;
      
      // Read messages from the queue (with visibility timeout of 30 seconds)
      const messages = await this.queueService.read('example-queue', 30, 5);
      
      if (messages.length > 0) {
        this.logger.log(`📥 Found ${messages.length} message(s) to process`);
        
        for (const message of messages) {
          await this.processMessage(message);
        }
      }
    } catch (error) {
      this.logger.error('Error processing messages:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async processMessage(message: PGMQMessage) {
    const messageData = message.message as Message;
    
    this.logger.log(`🔄 Processing message #${messageData.id}: ${messageData.text}`);
    
    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate 50% failure rate for testing DLQ
    if (Math.random() < 0.5) {
      this.logger.error(`❌ Failed to process message #${message.msg_id}: Simulated processing failure for message #${messageData.id}`);
      
      // Send to dead letter queue directly since the message is already in flight
      const dlqMessage = {
        originalMessage: messageData,
        originalQueue: 'example-queue',
        error: {
          message: `Simulated processing failure for message #${messageData.id}`,
          stack: new Error().stack,
        },
        attemptsMade: message.read_ct || 1,
        originalMsgId: message.msg_id,
      };
      
      // Send to DLQ using the service
      await this.queueService.send('example-queue_dlq', dlqMessage);
      
      // Delete from original queue - use archive instead since delete has function ambiguity
      await this.queueService.archive('example-queue', message.msg_id);
      return;
    }
    
    // Archive the message after successful processing
    await this.queueService.archive('example-queue', message.msg_id);
    
    this.logger.log(`✅ Successfully processed message #${messageData.id}`);
  }
}