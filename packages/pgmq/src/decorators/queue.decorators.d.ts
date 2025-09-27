export declare const PROCESSOR_METADATA: unique symbol;
export declare const PROCESS_METADATA: unique symbol;
export declare const ON_FAILED_METADATA: unique symbol;
export declare const ON_COMPLETED_METADATA: unique symbol;
export interface ConsumerMetadata {
    queueName: string;
    concurrency?: number;
}
export interface ProcessOptions {
    concurrency?: number;
}
export interface Job<T = any> {
    id: number;
    data: T;
    attemptsMade: number;
    queue: {
        name: string;
    };
    timestamp?: Date;
    errorMessage?: string;
    errorStack?: string;
}
export declare const QueueProcessor: (queueName: string) => ClassDecorator;
export declare const Processor: (options?: ProcessOptions) => MethodDecorator;
export declare const OnFailed: () => MethodDecorator;
export declare const OnCompleted: () => MethodDecorator;
//# sourceMappingURL=queue.decorators.d.ts.map