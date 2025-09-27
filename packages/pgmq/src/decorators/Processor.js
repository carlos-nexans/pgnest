"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Processor = void 0;
const common_1 = require("@nestjs/common");
const types_1 = require("./types");
/**
 * Marks a class as a queue consumer. Drop-in replacement for @nestjs/bull's @Processor()
 * @param queueName The name of the queue to process
 */
const Processor = (queueName) => {
    return (0, common_1.SetMetadata)(types_1.PROCESSOR_METADATA, { queueName });
};
exports.Processor = Processor;
