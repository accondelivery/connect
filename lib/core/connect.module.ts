import { Module } from '@nestjs/common';
import { IntegrationRegistryService } from './integration-registry.service';
import { ConnectService } from './connect.service';
import { FoodyModule } from '../foody/foody.module';
import { EventsModule } from './events';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [EventsModule, HttpModule, FoodyModule],
  providers: [ConnectService, IntegrationRegistryService],
  exports: [ConnectService],
})
export class AcconConnectModule {}
