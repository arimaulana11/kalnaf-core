export default (req, res, next) => {
  const id =
    Date.now().toString(36) +
    Math.random().toString(36).substring(2, 10);

  req.requestId = id;
  res.setHeader('X-Request-ID', id);

  next();
};
