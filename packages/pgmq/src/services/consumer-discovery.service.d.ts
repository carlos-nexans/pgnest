import { OnModuleDestroy } from '@nestjs/common';
import { DiscoveryService, MetadataScanner } from '@nestjs/core';
import { IPGMQService } from '../interfaces';
import { PGMQMetadataAccessor } from './metadata.accessor';
export declare class QueueConsumerDiscovery implements OnModuleDestroy {
    private readonly discoveryService;
    private readonly metadataScanner;
    private readonly metadataAccessor;
    private readonly queueService;
    private readonly consumers;
    private readonly processHandlers;
    private readonly failureHandlers;
    private readonly completionHandlers;
    private readonly activeWorkers;
    private isShuttingDown;
    constructor(discoveryService: DiscoveryService, metadataScanner: MetadataScanner, metadataAccessor: PGMQMetadataAccessor, queueService: IPGMQService);
    start(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    private discover;
    private handleMethod;
    private initializeConsumers;
    private startWorker;
}
//# sourceMappingURL=consumer-discovery.service.d.ts.map