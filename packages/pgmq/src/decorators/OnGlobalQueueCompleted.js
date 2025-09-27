"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnGlobalQueueCompleted = void 0;
const common_1 = require("@nestjs/common");
const types_1 = require("./types");
/**
 * Marks a method to be called when job processing completes. Drop-in replacement for @nestjs/bull's @OnGlobalQueueCompleted()
 */
const OnGlobalQueueCompleted = () => {
    return (0, common_1.SetMetadata)(types_1.ON_COMPLETED_METADATA, {});
};
exports.OnGlobalQueueCompleted = OnGlobalQueueCompleted;
