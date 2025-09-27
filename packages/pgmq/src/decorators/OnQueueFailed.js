"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnQueueFailed = void 0;
const common_1 = require("@nestjs/common");
const types_1 = require("./types");
/**
 * Marks a method to be called when job processing fails. Drop-in replacement for @nestjs/bull's @OnQueueFailed()
 */
const OnQueueFailed = () => {
    return (0, common_1.SetMetadata)(types_1.ON_FAILED_METADATA, {});
};
exports.OnQueueFailed = OnQueueFailed;
