import { Module } from '@nestjs/common';
import { IntegrationRegistryService } from './core/integration-registry.service';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [EventEmitterModule],
  providers: [IntegrationRegistryService],
})
export class AcconConnectModule {}
