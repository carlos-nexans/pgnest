"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ON_COMPLETED_METADATA = exports.ON_FAILED_METADATA = exports.PROCESS_METADATA = exports.PROCESSOR_METADATA = void 0;
// Use _PG suffix to avoid conflicts with Bull's metadata keys
exports.PROCESSOR_METADATA = Symbol('PROCESSOR_METADATA_PG');
exports.PROCESS_METADATA = Symbol('PROCESS_METADATA_PG');
exports.ON_FAILED_METADATA = Symbol('ON_FAILED_METADATA_PG');
exports.ON_COMPLETED_METADATA = Symbol('ON_COMPLETED_METADATA_PG');
