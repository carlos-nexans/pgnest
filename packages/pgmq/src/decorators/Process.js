"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Process = void 0;
const common_1 = require("@nestjs/common");
const types_1 = require("./types");
/**
 * Marks a method as a job processor. Drop-in replacement for @nestjs/bull's @Process()
 * @param options Processing options like concurrency
 */
const Process = (options = {}) => {
    return (target, propertyKey, descriptor) => {
        (0, common_1.SetMetadata)(types_1.PROCESS_METADATA, {
            ...options,
            methodName: propertyKey,
        })(descriptor.value);
        return descriptor;
    };
};
exports.Process = Process;
