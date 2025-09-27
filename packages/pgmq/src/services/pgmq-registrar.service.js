"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PGMQRegistrar = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const consumer_discovery_service_1 = require("./consumer-discovery.service");
let PGMQRegistrar = class PGMQRegistrar {
    constructor(moduleRef, queueConsumerDiscovery) {
        this.moduleRef = moduleRef;
        this.queueConsumerDiscovery = queueConsumerDiscovery;
    }
    onModuleInit() {
        this.register();
    }
    register() {
        return this.queueConsumerDiscovery.start();
    }
};
exports.PGMQRegistrar = PGMQRegistrar;
exports.PGMQRegistrar = PGMQRegistrar = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [core_1.ModuleRef,
        consumer_discovery_service_1.QueueConsumerDiscovery])
], PGMQRegistrar);
