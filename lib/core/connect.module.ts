import { Module } from '@nestjs/common';
import { IntegrationRegistryService } from './integration-registry.service';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ConnectService } from './connect.service';

@Module({
  imports: [EventEmitterModule],
  providers: [ConnectService, IntegrationRegistryService],
  exports: [ConnectService],
})
export class AcconConnectModule {}
