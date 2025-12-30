module.exports = function basicToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        status: 'error',
        message: 'Missing Authorization header'
      });
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid Authorization format'
      });
    }

    const token = parts[1];
    const validToken = process.env.API_TOKEN;

    if (!validToken) {
      return res.status(500).json({
        status: 'error',
        message: 'Server token not configured'
      });
    }

    if (token !== validToken) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token'
      });
    }

    // ✅ VALID → LANJUT
    req.auth = { token };
    return next();

  } catch (err) {
    console.error('AUTH MIDDLEWARE ERROR:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Auth middleware failed'
    });
  }
};
