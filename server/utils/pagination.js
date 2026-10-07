const getPagination = (req, defaultLimit = 20) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || defaultLimit));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

const formatPaginatedResponse = ({ data, total, page, limit }) => {
  const totalPages = Math.ceil(total / limit) || 1;
  return {
    items: data,
    users: data,
    projects: data,
    tasks: data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

module.exports = {
  getPagination,
  formatPaginatedResponse,
};
