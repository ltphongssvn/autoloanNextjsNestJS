// apps/backend/src/applications/pagination.helper.ts
export function paginationMetadata(
  page: number,
  perPage: number,
  total: number,
  basePath: string,
) {
  const totalPages = Math.ceil(total / perPage) || 1;
  const nextPage = page < totalPages ? page + 1 : null;
  const prevPage = page > 1 ? page - 1 : null;

  return {
    current_page: page,
    per_page: perPage,
    total_pages: totalPages,
    total_count: total,
    next_page: nextPage,
    prev_page: prevPage,
    '@nextLink': nextPage ? `${basePath}?page=${nextPage}&per_page=${perPage}` : null,
    '@prevLink': prevPage ? `${basePath}?page=${prevPage}&per_page=${perPage}` : null,
    '@firstLink': `${basePath}?page=1&per_page=${perPage}`,
    '@lastLink': `${basePath}?page=${totalPages}&per_page=${perPage}`,
  };
}
