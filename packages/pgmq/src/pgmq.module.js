"use strict";
var PGMQModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PGMQModule = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const pg_1 = require("pg");
const pgmq_service_1 = require("./services/pgmq.service");
const interfaces_1 = require("./interfaces");
let PGMQModule = PGMQModule_1 = class PGMQModule {
    /**
     * Register PGMQ module with synchronous configuration
     */
    static forRoot(options) {
        const poolProvider = this.createPoolProvider(options);
        const serviceProvider = this.createServiceProvider();
        return {
            global: true,
            module: PGMQModule_1,
            providers: [
                {
                    provide: common_1.Logger,
                    useValue: new common_1.Logger('PGMQService'),
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
    static forRootAsync(options) {
        const serviceProvider = this.createServiceProvider();
        return {
            global: true,
            module: PGMQModule_1,
            imports: [...(options.imports || [])],
            providers: [
                {
                    provide: common_1.Logger,
                    useValue: new common_1.Logger('PGMQService'),
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
    static registerQueue(...options) {
        return {
            module: PGMQModule_1,
            // imports: [this.coreModuleDefinition],
            providers: this.createQueueProviders(options),
            exports: [],
        };
    }
    /**
     * Register a queue with asynchronous configuration
     */
    static registerQueueAsync(...options) {
        const imports = this.getUniqImports(options);
        return {
            module: PGMQModule_1,
            imports: [...imports], // , this.coreModuleDefinition],
            providers: this.createAsyncQueueProviders(options),
            exports: [],
        };
    }
    static createPoolProvider(options) {
        return {
            provide: pg_1.Pool,
            useValue: options.pool || new pg_1.Pool(typeof options.connection === 'string'
                ? { connectionString: options.connection }
                : options.connection),
        };
    }
    static createServiceProvider() {
        return {
            provide: interfaces_1.IPGMQService,
            useClass: pgmq_service_1.PGMQService,
        };
    }
    static createAsyncProviders(options) {
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
    static createAsyncOptionsProvider(options) {
        if (options.useFactory) {
            return {
                provide: pg_1.Pool,
                useFactory: async (...args) => {
                    if (!options.useFactory) {
                        throw new Error('Invalid module configuration');
                    }
                    const config = await options.useFactory(...args);
                    return config.pool || new pg_1.Pool(typeof config.connection === 'string'
                        ? { connectionString: config.connection }
                        : config.connection);
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
            provide: pg_1.Pool,
            useFactory: async (optionsFactory) => {
                const config = await optionsFactory.createPGMQOptions();
                return config.pool || new pg_1.Pool(typeof config.connection === 'string'
                    ? { connectionString: config.connection }
                    : config.connection);
            },
            inject: [injectToken],
        };
    }
    static createQueueProviders(options) {
        return options.map(option => ({
            provide: `PGMQ_QUEUE_${option.name.toUpperCase()}`,
            useValue: option,
        }));
    }
    static createAsyncQueueProviders(options) {
        const providers = [];
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
                useFactory: async (optionsFactory) => {
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
    static getUniqImports(options) {
        return (options
            .map((option) => option.imports || [])
            .reduce((acc, i) => acc.concat(i), [])
            .filter((v, i, a) => a.indexOf(v) === i) || []);
    }
};
exports.PGMQModule = PGMQModule;
PGMQModule.coreModuleDefinition = {
    global: true,
    module: PGMQModule_1,
    // imports: [DiscoveryModule],
    providers: [
        {
            provide: common_1.Logger,
            useValue: new common_1.Logger('PGMQService'),
        },
        // PGMQMetadataAccessor,
        // QueueConsumerDiscovery,
        // PGMQRegistrar,
    ],
    exports: [],
};
exports.PGMQModule = PGMQModule = PGMQModule_1 = tslib_1.__decorate([
    (0, common_1.Module)({})
], PGMQModule);
