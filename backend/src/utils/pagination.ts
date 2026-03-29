export function parsePagination(req: { query: Record<string, unknown> }, defLimit = 20, maxLimit = 100) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(maxLimit, Math.max(1, Number(req.query.limit) || defLimit));
  return { page, limit, skip: (page - 1) * limit };
}
