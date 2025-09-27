import { Injectable, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { QueueConsumerDiscovery } from './consumer-discovery.service';

@Injectable()
export class PGMQRegistrar implements OnModuleInit {
  constructor(
    private readonly moduleRef: ModuleRef,
    private readonly queueConsumerDiscovery: QueueConsumerDiscovery,
  ) {}

  onModuleInit() {
    this.register();
  }

  register() {
    return this.queueConsumerDiscovery.start();
  }
}
