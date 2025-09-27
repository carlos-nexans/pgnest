"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueConsumerDiscovery = exports.PGMQService = void 0;
var pgmq_service_1 = require("./pgmq.service");
Object.defineProperty(exports, "PGMQService", { enumerable: true, get: function () { return pgmq_service_1.PGMQService; } });
var consumer_discovery_service_1 = require("./consumer-discovery.service");
Object.defineProperty(exports, "QueueConsumerDiscovery", { enumerable: true, get: function () { return consumer_discovery_service_1.QueueConsumerDiscovery; } });
