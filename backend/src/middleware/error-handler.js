function errorHandler(error, req, res, next) {
  console.error("[http]", error);

  if (res.headersSent) {
    return next(error);
  }

  return res.status(500).json({
    error: error.message || "Internal server error"
  });
}

module.exports = {
  errorHandler
};
