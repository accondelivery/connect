import { loadIntegrationFiles } from './integration-loader';
import * as fg from 'fast-glob';

jest.mock('fast-glob');
const mockedFg = jest.mocked(fg, { shallow: true });

describe('loadIntegrationFiles', () => {
  it('should call requireFn for each matched file', async () => {
    const mockFiles = [
      '/abs/path/one.output-order.js',
      '/abs/path/two.output-order.js',
    ];
    const requireFn = jest.fn();
    mockedFg.mockResolvedValue(mockFiles);

    await loadIntegrationFiles('/base/path', requireFn);

    expect(requireFn).toHaveBeenCalledTimes(2);
    expect(requireFn).toHaveBeenCalledWith('/abs/path/one.output-order.js');
    expect(requireFn).toHaveBeenCalledWith('/abs/path/two.output-order.js');
  });

  it('should handle empty result', async () => {
    const requireFn = jest.fn();
    mockedFg.mockResolvedValue([]);

    await loadIntegrationFiles('/base/path', requireFn);

    expect(requireFn).not.toHaveBeenCalled();
  });
});
