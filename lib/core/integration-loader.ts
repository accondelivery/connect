import * as fg from 'fast-glob';

export async function loadIntegrationFiles(
  basePath: string,
  requireFn: (file: string) => unknown = require,
) {
  const files = await fg(['**/*.order-output.{js,ts}'], {
    cwd: basePath,
    absolute: true,
  });
  for (const file of files) {
    requireFn(file);
  }
}
