"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnCompleted = exports.OnFailed = exports.Processor = exports.QueueProcessor = exports.ON_COMPLETED_METADATA = exports.ON_FAILED_METADATA = exports.PROCESS_METADATA = exports.PROCESSOR_METADATA = void 0;
const common_1 = require("@nestjs/common");
exports.PROCESSOR_METADATA = Symbol('PROCESSOR_METADATA');
exports.PROCESS_METADATA = Symbol('PROCESS_METADATA');
exports.ON_FAILED_METADATA = Symbol('ON_FAILED_METADATA');
exports.ON_COMPLETED_METADATA = Symbol('ON_COMPLETED_METADATA');
const QueueProcessor = (queueName) => {
    return (0, common_1.SetMetadata)(exports.PROCESSOR_METADATA, { queueName });
};
exports.QueueProcessor = QueueProcessor;
const Processor = (options = {}) => {
    return (0, common_1.SetMetadata)(exports.PROCESS_METADATA, options);
};
exports.Processor = Processor;
const OnFailed = () => {
    return (0, common_1.SetMetadata)(exports.ON_FAILED_METADATA, {});
};
exports.OnFailed = OnFailed;
const OnCompleted = () => {
    return (0, common_1.SetMetadata)(exports.ON_COMPLETED_METADATA, {});
};
exports.OnCompleted = OnCompleted;
