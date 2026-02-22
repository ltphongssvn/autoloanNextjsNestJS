import { paginationMetadata } from './pagination.helper';

describe('paginationMetadata', () => {
  it('should return full metadata for middle page', () => {
    const result = paginationMetadata(2, 10, 50, '/api/v1/applications');
    expect(result.current_page).toBe(2);
    expect(result.per_page).toBe(10);
    expect(result.total_pages).toBe(5);
    expect(result.total_count).toBe(50);
    expect(result.next_page).toBe(3);
    expect(result.prev_page).toBe(1);
    expect(result['@nextLink']).toBe('/api/v1/applications?page=3&per_page=10');
    expect(result['@prevLink']).toBe('/api/v1/applications?page=1&per_page=10');
    expect(result['@firstLink']).toBe('/api/v1/applications?page=1&per_page=10');
    expect(result['@lastLink']).toBe('/api/v1/applications?page=5&per_page=10');
  });

  it('should return null next on last page', () => {
    const result = paginationMetadata(3, 10, 30, '/api/v1/applications');
    expect(result.next_page).toBeNull();
    expect(result['@nextLink']).toBeNull();
    expect(result.prev_page).toBe(2);
  });

  it('should return null prev on first page', () => {
    const result = paginationMetadata(1, 25, 100, '/api/v1/applications');
    expect(result.prev_page).toBeNull();
    expect(result['@prevLink']).toBeNull();
    expect(result.next_page).toBe(2);
  });

  it('should handle single page', () => {
    const result = paginationMetadata(1, 25, 5, '/api/v1/applications');
    expect(result.total_pages).toBe(1);
    expect(result.next_page).toBeNull();
    expect(result.prev_page).toBeNull();
  });

  it('should handle zero results', () => {
    const result = paginationMetadata(1, 25, 0, '/api/v1/applications');
    expect(result.total_pages).toBe(1);
    expect(result.total_count).toBe(0);
  });
});
