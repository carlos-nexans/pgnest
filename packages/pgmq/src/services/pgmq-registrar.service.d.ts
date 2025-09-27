import { OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { QueueConsumerDiscovery } from './consumer-discovery.service';
export declare class PGMQRegistrar implements OnModuleInit {
    private readonly moduleRef;
    private readonly queueConsumerDiscovery;
    constructor(moduleRef: ModuleRef, queueConsumerDiscovery: QueueConsumerDiscovery);
    onModuleInit(): void;
    register(): Promise<void>;
}
//# sourceMappingURL=pgmq-registrar.service.d.ts.map