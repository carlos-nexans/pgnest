import { Type } from '@nestjs/common';
export interface Job<T = any> {
    id: number;
    data: T;
    attemptsMade: number;
    queue: {
        name: string;
    };
}
export interface ProcessOptions {
    concurrency?: number;
}
export interface QueueConsumer {
    process(job: Job): Promise<any>;
    onFailed?(job: Job, error: Error): void;
    onCompleted?(job: Job, result: any): void;
}
export interface ConsumerMetadata {
    queueName: string;
    processOptions?: ProcessOptions;
    target: Type<any>;
}
export declare const PROCESSOR_METADATA: unique symbol;
export declare const PROCESS_METADATA: unique symbol;
export declare const ON_FAILED_METADATA: unique symbol;
export declare const ON_COMPLETED_METADATA: unique symbol;
//# sourceMappingURL=types.d.ts.map