import { Module } from '@nestjs/common';
import { IntegrationRegistryService } from './integration-registry.service';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ConnectService } from './connect.service';
import { FoodyModule } from '../foody/foody.module';

@Module({
  imports: [EventEmitterModule, FoodyModule],
  providers: [ConnectService, IntegrationRegistryService],
  exports: [ConnectService],
})
export class AcconConnectModule {}
