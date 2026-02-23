import { BaseRepository } from './index';
import { ApplicationRepository } from './index';

describe('repositories index', () => {
  it('should export BaseRepository', () => {
    expect(BaseRepository).toBeDefined();
  });

  it('should export ApplicationRepository', () => {
    expect(ApplicationRepository).toBeDefined();
  });
});
