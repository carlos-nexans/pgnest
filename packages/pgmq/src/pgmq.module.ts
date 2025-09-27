import { DynamicModule, Global, Logger, Module, Provider, Type, InjectionToken } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { Pool } from 'pg';
import { PGMQService } from './services/pgmq.service';
import { IPGMQService } from './interfaces';
import { QueueConsumerDiscovery } from './services/consumer-discovery.service';
import { PGMQMetadataAccessor } from './services/metadata.accessor';
import { PGMQRegistrar } from './services/pgmq-registrar.service';
import {
  PGMQModuleAsyncOptions,
  PGMQModuleOptions,
  PGMQOptionsFactory,
  RegisterQueueAsyncOptions,
  RegisterQueueOptions,
  RegisterQueueOptionsFactory,
} from './interfaces/pgmq-options.interface';

@Module({})
export class PGMQModule {
  private static readonly coreModuleDefinition = {
    global: true,
    module: PGMQModule,
    // imports: [DiscoveryModule],
    providers: [
      {
        provide: Logger,
        useValue: new Logger('PGMQService'),
      },
      // PGMQMetadataAccessor,
      // QueueConsumerDiscovery,
      // PGMQRegistrar,
    ],
    exports: [],
  };

  /**
   * Register PGMQ module with synchronous configuration
   */
  static forRoot(options: PGMQModuleOptions): DynamicModule {
    const poolProvider = this.createPoolProvider(options);
    const serviceProvider = this.createServiceProvider();

    return {
      global: true,
      module: PGMQModule,
      providers: [
        {
          provide: Logger,
          useValue: new Logger('PGMQService'),
        },
        // PGMQMetadataAccessor,
        // QueueConsumerDiscovery,
        // PGMQRegistrar,
        poolProvider,
        serviceProvider,
      ],
      exports: [serviceProvider],
    };
  }

  /**
   * Register PGMQ module with asynchronous configuration
   */
  static forRootAsync(options: PGMQModuleAsyncOptions): DynamicModule {
    const serviceProvider = this.createServiceProvider();

    return {
      global: true,
      module: PGMQModule,
      imports: [...(options.imports || [])],
      providers: [
        {
          provide: Logger,
          useValue: new Logger('PGMQService'),
        },
        // PGMQMetadataAccessor,
        // QueueConsumerDiscovery,
        // PGMQRegistrar,
        ...this.createAsyncProviders(options),
        serviceProvider,
      ],
      exports: [serviceProvider],
    };
  }

  /**
   * Register a queue with synchronous configuration
   */
  static registerQueue(...options: RegisterQueueOptions[]): DynamicModule {
    return {
      module: PGMQModule,
      // imports: [this.coreModuleDefinition],
      providers: this.createQueueProviders(options),
      exports: [],
    };
  }

  /**
   * Register a queue with asynchronous configuration
   */
  static registerQueueAsync(...options: RegisterQueueAsyncOptions[]): DynamicModule {
    const imports = this.getUniqImports(options);

    return {
      module: PGMQModule,
      imports: [...imports], // , this.coreModuleDefinition],
      providers: this.createAsyncQueueProviders(options),
      exports: [],
    };
  }

  private static createPoolProvider(options: PGMQModuleOptions): Provider {
    return {
      provide: Pool,
      useValue: options.pool || new Pool(
        typeof options.connection === 'string'
          ? { connectionString: options.connection }
          : options.connection
      ),
    };
  }

  private static createServiceProvider(): Provider {
    return {
      provide: IPGMQService,
      useClass: PGMQService,
    };
  }

  private static createAsyncProviders(options: PGMQModuleAsyncOptions): Provider[] {
    if (options.useExisting || options.useFactory) {
      return [this.createAsyncOptionsProvider(options)];
    }

    if (!options.useClass) {
      throw new Error('Invalid module configuration');
    }

    return [
      {
        provide: options.useClass,
        useClass: options.useClass,
      },
      this.createAsyncOptionsProvider(options),
    ];
  }

  private static createAsyncOptionsProvider(options: PGMQModuleAsyncOptions): Provider {
    if (options.useFactory) {
      return {
        provide: Pool,
        useFactory: async (...args: any[]) => {
          if (!options.useFactory) {
            throw new Error('Invalid module configuration');
          }
          const config = await options.useFactory(...args);
          return config.pool || new Pool(
            typeof config.connection === 'string'
              ? { connectionString: config.connection }
              : config.connection
          );
        },
        inject: options.inject || [],
      };
    }

    if (!options.useExisting && !options.useClass) {
      throw new Error('Invalid module configuration');
    }

    const injectToken = options.useClass || options.useExisting;
    if (!injectToken) {
      throw new Error('Invalid module configuration');
    }

    return {
      provide: Pool,
      useFactory: async (optionsFactory: PGMQOptionsFactory) => {
        const config = await optionsFactory.createPGMQOptions();
        return config.pool || new Pool(
          typeof config.connection === 'string'
            ? { connectionString: config.connection }
            : config.connection
        );
      },
      inject: [injectToken],
    };
  }

  private static createQueueProviders(options: RegisterQueueOptions[]): Provider[] {
    return options.map(option => ({
      provide: `PGMQ_QUEUE_${option.name.toUpperCase()}`,
      useValue: option,
    }));
  }

  private static createAsyncQueueProviders(options: RegisterQueueAsyncOptions[]): Provider[] {
    const providers: Provider[] = [];

    for (const option of options) {
      if (option.useFactory) {
        providers.push({
          provide: `PGMQ_QUEUE_${option.name.toUpperCase()}`,
          useFactory: option.useFactory,
          inject: option.inject || [],
        });
        continue;
      }

      if (!option.useExisting && !option.useClass) {
        throw new Error('Invalid queue configuration');
      }

      const injectToken = option.useClass || option.useExisting;
      if (!injectToken) {
        throw new Error('Invalid queue configuration');
      }

      providers.push({
        provide: `PGMQ_QUEUE_${option.name.toUpperCase()}`,
        useFactory: async (optionsFactory: RegisterQueueOptionsFactory) => {
          return await optionsFactory.createRegisterQueueOptions();
        },
        inject: [injectToken],
      });

      if (option.useClass) {
        providers.push({
          provide: option.useClass,
          useClass: option.useClass,
        });
      }
    }

    return providers;
  }

  private static getUniqImports(options: RegisterQueueAsyncOptions[]): any[] {
    return (
      options
        .map((option) => option.imports || [])
        .reduce((acc, i) => acc.concat(i), [])
        .filter((v, i, a) => a.indexOf(v) === i) || []
    );
  }
}