import { Type } from '@nestjs/common';
import { ConsumerMetadata } from '../decorators/queue.decorators';
export declare class PGMQMetadataAccessor {
    private readonly reflector;
    constructor();
    isProcessor(target: Type<any> | Function): boolean;
    getProcessorMetadata(target: Type<any> | Function): ConsumerMetadata | undefined;
    getProcessMetadata(target: Type<any> | Function): any | undefined;
    getOnFailedMetadata(target: Type<any> | Function): any | undefined;
    getOnCompletedMetadata(target: Type<any> | Function): any | undefined;
}
//# sourceMappingURL=metadata.accessor.d.ts.map