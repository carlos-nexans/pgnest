import { Logger, Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PGMQModule } from '@pgnest/pgmq';
import { MessageProducer } from './message.producer';
import { MessageConsumer } from './message.consumer';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PGMQModule.forRoot({
      connection: 'postgresql://postgres:postgres@localhost:5432/test',
      defaultVisibilityTimeout: 30,
      defaultMaxRetries: 3,
    }),
    PGMQModule.registerQueue({
      name: 'example-queue',
      defaultVisibilityTimeout: 30,
      defaultMaxRetries: 3,
    }),
  ],
  providers: [
    {
      provide: Logger,
      useValue: new Logger('PGMQService'),
    },
    MessageProducer,
    MessageConsumer,
  ],
})
export class AppModule {}