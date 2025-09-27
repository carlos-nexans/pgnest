"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnGlobalQueueCompleted = exports.OnFailed = exports.Processor = exports.QueueProcessor = void 0;
var queue_decorators_1 = require("./queue.decorators");
Object.defineProperty(exports, "QueueProcessor", { enumerable: true, get: function () { return queue_decorators_1.QueueProcessor; } });
Object.defineProperty(exports, "Processor", { enumerable: true, get: function () { return queue_decorators_1.Processor; } });
Object.defineProperty(exports, "OnFailed", { enumerable: true, get: function () { return queue_decorators_1.OnFailed; } });
Object.defineProperty(exports, "OnGlobalQueueCompleted", { enumerable: true, get: function () { return queue_decorators_1.OnCompleted; } });
