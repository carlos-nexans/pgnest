import { OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';
import { IPGMQService, PGMQMessage, PGMQJobCounts, PGMQDeadLetterMessage, SendOptions } from '../interfaces/pgmq.interface';
export declare class PGMQService implements IPGMQService, OnModuleDestroy {
    private readonly pool;
    private readonly logger;
    constructor(pool: Pool);
    onModuleDestroy(): Promise<void>;
    private getDLQName;
    createQueue(queueName: string): Promise<void>;
    send<T>(queueName: string, message: T, options?: SendOptions): Promise<number>;
    sendBatch<T>(queueName: string, messages: T[], options?: SendOptions): Promise<number[]>;
    read<T>(queueName: string, visibilityTimeout: number, quantity?: number): Promise<PGMQMessage<T>[]>;
    pop<T>(queueName: string): Promise<PGMQMessage<T> | null>;
    moveToDeadLetter(queueName: string, messageId: number, error: Error, attemptsMade: number): Promise<void>;
    archive(queueName: string, messageId: number): Promise<void>;
    archiveBatch(queueName: string, messageIds: number[]): Promise<void>;
    delete(queueName: string, messageId: number): Promise<void>;
    dropQueue(queueName: string): Promise<void>;
    getJobCounts(queueName: string): Promise<PGMQJobCounts>;
    getDeadLetters<T>(queueName: string): Promise<PGMQDeadLetterMessage<T>[]>;
    requeueDeadLetter(queueName: string, messageId: number): Promise<number>;
    requeueDeadLetterBatch(queueName: string, messageIds: number[]): Promise<number[]>;
    purgeDeadLetters(queueName: string): Promise<void>;
}
//# sourceMappingURL=pgmq.service.d.ts.map