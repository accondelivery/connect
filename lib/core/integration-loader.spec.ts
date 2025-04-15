import { loadIntegrationFiles } from './integration-loader';
import * as fg from 'fast-glob';

jest.mock('fast-glob');
const mockedFg = jest.mocked(fg, { shallow: true });

describe('loadIntegrationFiles', () => {
  it('should call requireFn for each matched file', async () => {
    const mockFiles = [
      '/abs/path/one.order-output.js',
      '/abs/path/two.order-output.js',
    ];
    const requireFn = jest.fn();
    mockedFg.mockResolvedValue(mockFiles);

    await loadIntegrationFiles('/base/path', requireFn);

    expect(requireFn).toHaveBeenCalledTimes(2);
    expect(requireFn).toHaveBeenCalledWith('/abs/path/one.order-output.js');
    expect(requireFn).toHaveBeenCalledWith('/abs/path/two.order-output.js');
  });

  it('should handle empty result', async () => {
    const requireFn = jest.fn();
    mockedFg.mockResolvedValue([]);

    await loadIntegrationFiles('/base/path', requireFn);

    expect(requireFn).not.toHaveBeenCalled();
  });
});
