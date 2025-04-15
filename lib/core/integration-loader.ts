import { Logger } from '@nestjs/common';
import * as fg from 'fast-glob';

export async function loadIntegrationFiles(basePath: string) {
  const files = await fg(['**/*.output-order.{js,ts}'], {
    cwd: basePath,
    absolute: true,
  });
  Logger.verbose(`Files found:\n${files.join('\n')}`);
  for (const file of files) {
    require(file);
  }
}
