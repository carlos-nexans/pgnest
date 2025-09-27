import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { IPGMQService, PGMQDeadLetterMessage } from '@pgnest/pgmq';

interface Message {
  id: number;
  text: string;
  timestamp: string;
}

@Injectable()
export class DLQMonitor {
  private readonly logger = new Logger(DLQMonitor.name);

  constructor(
    @Inject(IPGMQService)
    private readonly queueService: IPGMQService
  ) {}

  @Cron('*/30 * * * * *') // Run every 30 seconds
  async monitorDeadLetterQueue() {
    try {
      // Get job counts to see failed messages count
      const jobCounts = await this.queueService.getJobCounts('example-queue');
      
      // Get actual dead letter messages for more details
      const deadLetters = await this.queueService.getDeadLetters<Message>('example-queue');
      
      this.logger.log('📊 Dead Letter Queue Statistics:');
      this.logger.log(`   Failed messages: ${jobCounts.failed}`);
      this.logger.log(`   Waiting messages: ${jobCounts.waiting}`);
      this.logger.log(`   Completed messages: ${jobCounts.completed}`);
      this.logger.log(`   Total dead letters: ${deadLetters.length}`);
      
      // If there are dead letters, show some details
      if (deadLetters.length > 0) {
        this.logger.log('💀 Dead Letter Messages:');
        deadLetters.slice(0, 5).forEach((dl, index) => {
          const messageData = dl.data as Message;
          this.logger.log(`   ${index + 1}. Message #${messageData?.id || 'unknown'} - Error: ${dl.errorMessage}`);
          this.logger.log(`      Attempts made: ${dl.attemptsMade}`);
          this.logger.log(`      Failed at: ${dl.timestamp}`);
        });
        
        if (deadLetters.length > 5) {
          this.logger.log(`   ... and ${deadLetters.length - 5} more dead letters`);
        }
      }
      
      // Show a summary line
      if (jobCounts.failed > 0) {
        this.logger.warn(`⚠️  WARNING: ${jobCounts.failed} messages have failed and are in the dead letter queue!`);
      } else {
        this.logger.log('✅ No failed messages in dead letter queue');
      }
      
    } catch (error) {
      this.logger.error('Failed to monitor dead letter queue:', error);
    }
  }

  // Optional: Method to manually check DLQ (can be called from API endpoint)
  async getDLQSummary() {
    try {
      const jobCounts = await this.queueService.getJobCounts('example-queue');
      const deadLetters = await this.queueService.getDeadLetters<Message>('example-queue');
      
      return {
        timestamp: new Date().toISOString(),
        failedCount: jobCounts.failed,
        totalDeadLetters: deadLetters.length,
        recentFailures: deadLetters.slice(0, 10).map(dl => ({
          messageId: (dl.data as Message)?.id,
          error: dl.errorMessage,
          attemptsMade: dl.attemptsMade,
          failedAt: dl.timestamp
        }))
      };
    } catch (error) {
      this.logger.error('Failed to get DLQ summary:', error);
      throw error;
    }
  }
}
