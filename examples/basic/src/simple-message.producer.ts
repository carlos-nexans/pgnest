import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { IPGMQService } from '@pgnest/pgmq';
import { Inject } from '@nestjs/common';

@Injectable()
export class SimpleMessageProducer implements OnModuleInit {
  private readonly logger = new Logger(SimpleMessageProducer.name);
  private messageCount = 0;
  private queueCreated = false;

  constructor(
    @Inject(IPGMQService)
    private readonly queueService: IPGMQService
  ) {}

  async onModuleInit() {
    try {
      // Create the queue if it doesn't exist
      await this.queueService.createQueue('simple-queue');
      this.queueCreated = true;
      this.logger.log('✅ Queue "simple-queue" created successfully');
    } catch (error) {
      this.logger.error('Failed to create queue "simple-queue"', error);
      // Continue anyway, the queue might already exist
      this.queueCreated = true;
    }
  }

  @Cron('*/5 * * * * *') // Run every 5 seconds
  async handleCron() {
    if (!this.queueCreated) {
      this.logger.warn('Queue not created yet, skipping message send');
      return;
    }

    this.messageCount++;
    const message = {
      id: this.messageCount,
      text: `Hello from simple producer! Message #${this.messageCount}`,
      timestamp: new Date().toISOString()
    };

    try {
      const messageId = await this.queueService.send('simple-queue', message);
      this.logger.log(`📤 Sent message #${this.messageCount} with ID: ${messageId}`);
      
      // Try to read the message back to verify it was stored
      const messages = await this.queueService.read('simple-queue', 30, 1);
      if (messages.length > 0) {
        const msg = messages[0];
        this.logger.log(`📥 Read message back: ID=${msg.msg_id}, Text="${(msg.message as any).text}"`);
      }
      
    } catch (error) {
      this.logger.error('Failed to send message', error);
    }
  }
}
