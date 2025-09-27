"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueConsumerDiscovery = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const interfaces_1 = require("../interfaces");
const metadata_accessor_1 = require("./metadata.accessor");
let QueueConsumerDiscovery = class QueueConsumerDiscovery {
    constructor(discoveryService, metadataScanner, metadataAccessor, queueService) {
        this.discoveryService = discoveryService;
        this.metadataScanner = metadataScanner;
        this.metadataAccessor = metadataAccessor;
        this.queueService = queueService;
        this.consumers = new Map();
        this.processHandlers = new Map();
        this.failureHandlers = new Map();
        this.completionHandlers = new Map();
        this.activeWorkers = new Map();
        this.isShuttingDown = false;
    }
    async start() {
        await this.discover();
        await this.initializeConsumers();
    }
    async onModuleDestroy() {
        this.isShuttingDown = true;
        // Wait for active workers to finish
        for (const [queueName, count] of this.activeWorkers.entries()) {
            if (count > 0) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }
    async discover() {
        const providers = this.discoveryService.getProviders();
        const controllers = this.discoveryService.getControllers();
        const wrappers = [...providers, ...controllers];
        for (const wrapper of wrappers) {
            if (!wrapper.metatype)
                continue;
            const isProcessor = this.metadataAccessor.isProcessor(!wrapper.metatype || wrapper.inject
                ? wrapper.instance?.constructor
                : wrapper.metatype);
            if (!isProcessor)
                continue;
            const metadata = this.metadataAccessor.getProcessorMetadata(wrapper.instance?.constructor || wrapper.metatype);
            if (!metadata)
                continue;
            const { queueName } = metadata;
            this.consumers.set(queueName, wrapper);
            this.activeWorkers.set(queueName, 0);
            const prototype = wrapper.metatype?.prototype;
            if (!prototype)
                continue;
            this.metadataScanner.scanFromPrototype(wrapper.instance, prototype, (methodName) => {
                this.handleMethod(wrapper, methodName, queueName);
            });
        }
    }
    handleMethod(wrapper, methodName, queueName) {
        const methodRef = wrapper.instance[methodName];
        const processMetadata = this.metadataAccessor.getProcessMetadata(methodRef);
        const failureMetadata = this.metadataAccessor.getOnFailedMetadata(methodRef);
        const completionMetadata = this.metadataAccessor.getOnCompletedMetadata(methodRef);
        if (processMetadata) {
            this.processHandlers.set(queueName, {
                handler: methodRef.bind(wrapper.instance),
                options: processMetadata,
            });
        }
        if (failureMetadata) {
            this.failureHandlers.set(queueName, methodRef.bind(wrapper.instance));
        }
        if (completionMetadata) {
            this.completionHandlers.set(queueName, methodRef.bind(wrapper.instance));
        }
    }
    async initializeConsumers() {
        for (const [queueName, wrapper] of this.consumers) {
            const processHandler = this.processHandlers.get(queueName);
            const failureHandler = this.failureHandlers.get(queueName);
            const completionHandler = this.completionHandlers.get(queueName);
            if (!processHandler)
                continue;
            // Create queue if it doesn't exist
            try {
                await this.queueService.createQueue(queueName);
            }
            catch (error) {
                // Queue might already exist, continue
            }
            // Start processing loop with concurrency
            const concurrency = processHandler.options.concurrency || 1;
            for (let i = 0; i < concurrency; i++) {
                this.startWorker(queueName, processHandler.handler, failureHandler, completionHandler);
            }
        }
    }
    async startWorker(queueName, processHandler, failureHandler, completionHandler) {
        while (!this.isShuttingDown) {
            try {
                // Get current active workers
                const activeWorkers = this.activeWorkers.get(queueName) || 0;
                // Read message with 30s visibility timeout
                const messages = await this.queueService.read(queueName, 30, 1);
                for (const message of messages) {
                    // Increment active workers
                    this.activeWorkers.set(queueName, activeWorkers + 1);
                    const job = {
                        id: message.msg_id,
                        data: message.message,
                        attemptsMade: message.read_ct,
                        queue: { name: queueName },
                    };
                    try {
                        const result = await processHandler(job);
                        await this.queueService.archive(queueName, message.msg_id);
                        if (completionHandler) {
                            await completionHandler(job, result);
                        }
                    }
                    catch (error) {
                        if (failureHandler) {
                            await failureHandler(job, error);
                        }
                        // Check if max retries exceeded
                        const maxRetries = message.maxRetries ?? 3; // Default to 3 if not specified
                        if (message.read_ct >= maxRetries) {
                            // Move to DLQ
                            await this.queueService.moveToDeadLetter(queueName, message.msg_id, error, message.read_ct);
                        }
                        // Otherwise, message will become visible again after visibility timeout
                    }
                    finally {
                        // Decrement active workers
                        this.activeWorkers.set(queueName, activeWorkers);
                    }
                }
            }
            catch (error) {
                // Log error but continue processing
                console.error('Error processing queue:', error);
            }
            // Small delay to prevent tight loop when queue is empty
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
};
exports.QueueConsumerDiscovery = QueueConsumerDiscovery;
exports.QueueConsumerDiscovery = QueueConsumerDiscovery = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__param(3, (0, common_1.Inject)(interfaces_1.IPGMQService)),
    tslib_1.__metadata("design:paramtypes", [core_1.DiscoveryService,
        core_1.MetadataScanner,
        metadata_accessor_1.PGMQMetadataAccessor, Object])
], QueueConsumerDiscovery);
