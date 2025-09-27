import { DynamicModule } from '@nestjs/common';
import { PGMQModuleAsyncOptions, PGMQModuleOptions, RegisterQueueAsyncOptions, RegisterQueueOptions } from './interfaces/pgmq-options.interface';
export declare class PGMQModule {
    private static readonly coreModuleDefinition;
    /**
     * Register PGMQ module with synchronous configuration
     */
    static forRoot(options: PGMQModuleOptions): DynamicModule;
    /**
     * Register PGMQ module with asynchronous configuration
     */
    static forRootAsync(options: PGMQModuleAsyncOptions): DynamicModule;
    /**
     * Register a queue with synchronous configuration
     */
    static registerQueue(...options: RegisterQueueOptions[]): DynamicModule;
    /**
     * Register a queue with asynchronous configuration
     */
    static registerQueueAsync(...options: RegisterQueueAsyncOptions[]): DynamicModule;
    private static createPoolProvider;
    private static createServiceProvider;
    private static createAsyncProviders;
    private static createAsyncOptionsProvider;
    private static createQueueProviders;
    private static createAsyncQueueProviders;
    private static getUniqImports;
}
//# sourceMappingURL=pgmq.module.d.ts.map