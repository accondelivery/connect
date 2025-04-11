import { Module } from '@nestjs/common';
import { IntegrationRegistryService } from './core/integration-registry.service';

@Module({
  imports: [],
  providers: [IntegrationRegistryService],
})
export class AcconConnectModule {}
