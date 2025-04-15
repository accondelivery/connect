import { Module } from '@nestjs/common';
import { FoodyOutputOrder } from './foody.output-order';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [FoodyOutputOrder],
})
export class FoodyModule {}
