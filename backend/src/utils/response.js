export const sendSuccess = (res, { status = 200, message = 'OK', data = null } = {}) => {
  return res.status(status).json({ success: true, message, data });
};

export const sendError = (res, { status = 500, message = 'Something went wrong', errors = null } = {}) => {
  return res.status(status).json({ success: false, message, errors });
};

export const buildPagination = ({ page = 1, limit = 20 } = {}) => {
  const safePage = Number.isNaN(Number(page)) ? 1 : Number(page);
  const safeLimit = Number.isNaN(Number(limit)) ? 20 : Number(limit);
  return { page: safePage, limit: safeLimit, skip: (safePage - 1) * safeLimit };
};
