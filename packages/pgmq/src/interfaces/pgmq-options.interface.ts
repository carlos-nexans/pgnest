import { ModuleMetadata, Type } from '@nestjs/common';
import { Pool, PoolConfig } from 'pg';

export interface PGMQModuleOptions {
  /**
   * PostgreSQL connection options
   */
  connection: PoolConfig | string;

  /**
   * Optional existing Pool instance
   */
  pool?: Pool;

  /**
   * Default visibility timeout for messages in seconds
   * @default 30
   */
  defaultVisibilityTimeout?: number;

  /**
   * Default max retries for messages
   * @default 3
   */
  defaultMaxRetries?: number;
}

export interface PGMQOptionsFactory {
  createPGMQOptions(): Promise<PGMQModuleOptions> | PGMQModuleOptions;
}

export interface PGMQModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<PGMQOptionsFactory>;
  useClass?: Type<PGMQOptionsFactory>;
  useFactory?: (...args: any[]) => Promise<PGMQModuleOptions> | PGMQModuleOptions;
  inject?: any[];
}

export interface RegisterQueueOptions {
  /**
   * Queue name
   */
  name: string;

  /**
   * Default visibility timeout for this queue in seconds
   * @default from module options
   */
  defaultVisibilityTimeout?: number;

  /**
   * Default max retries for this queue
   * @default from module options
   */
  defaultMaxRetries?: number;
}

export interface RegisterQueueAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  name: string;
  useExisting?: Type<RegisterQueueOptionsFactory>;
  useClass?: Type<RegisterQueueOptionsFactory>;
  useFactory?: (...args: any[]) => Promise<RegisterQueueOptions> | RegisterQueueOptions;
  inject?: any[];
}

export interface RegisterQueueOptionsFactory {
  createRegisterQueueOptions(): Promise<RegisterQueueOptions> | RegisterQueueOptions;
}
