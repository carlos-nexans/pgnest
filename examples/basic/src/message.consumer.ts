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
    try {
      const messageData = message.message as Message;
      
      this.logger.log(`🔄 Processing message #${messageData.id}: ${messageData.text}`);
      
      // Simulate some processing time
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Archive the message after successful processing
      await this.queueService.archive('example-queue', message.msg_id);
      
      this.logger.log(`✅ Successfully processed message #${messageData.id}`);
      
    } catch (error) {
      this.logger.error(`❌ Failed to process message #${message.msg_id}:`, error);
      
      // Move to dead letter queue if max retries exceeded
      await this.queueService.moveToDeadLetter('example-queue', message.msg_id, error as Error, 3);
    }
  }
}