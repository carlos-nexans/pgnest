"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PGMQMetadataAccessor = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const queue_decorators_1 = require("../decorators/queue.decorators");
let PGMQMetadataAccessor = class PGMQMetadataAccessor {
    constructor() {
        // Create Reflector manually like BullMQ does in tests
        this.reflector = new core_1.Reflector();
    }
    isProcessor(target) {
        if (!target) {
            return false;
        }
        return !!this.reflector.get(queue_decorators_1.PROCESSOR_METADATA, target);
    }
    getProcessorMetadata(target) {
        return this.reflector.get(queue_decorators_1.PROCESSOR_METADATA, target);
    }
    getProcessMetadata(target) {
        return this.reflector.get(queue_decorators_1.PROCESS_METADATA, target);
    }
    getOnFailedMetadata(target) {
        return this.reflector.get(queue_decorators_1.ON_FAILED_METADATA, target);
    }
    getOnCompletedMetadata(target) {
        return this.reflector.get(queue_decorators_1.ON_COMPLETED_METADATA, target);
    }
};
exports.PGMQMetadataAccessor = PGMQMetadataAccessor;
exports.PGMQMetadataAccessor = PGMQMetadataAccessor = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [])
], PGMQMetadataAccessor);
