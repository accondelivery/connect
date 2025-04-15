import { Module } from '@nestjs/common';
import { IntegrationRegistryService } from './integration-registry.service';
import { ConnectService } from './connect.service';
import { FoodyModule } from '../foody/foody.module';
import { EventsModule } from './events';

@Module({
  imports: [EventsModule, FoodyModule],
  providers: [ConnectService, IntegrationRegistryService],
  exports: [ConnectService],
})
export class AcconConnectModule {}
