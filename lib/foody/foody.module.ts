import { Module } from '@nestjs/common';
import { FoodyOutputOrder } from './foody.output-order';
import { HttpModule } from '@nestjs/axios';
import { EventsModule } from '@lib/core';

@Module({
  imports: [HttpModule, EventsModule],
  providers: [FoodyOutputOrder],
})
export class FoodyModule {}
