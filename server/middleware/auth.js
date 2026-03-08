import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'lm_s3cr3t_k3y_' + Math.random().toString(36).slice(2);
const JWT_EXPIRY = '4h';

// Store the secret so it's consistent for the process lifetime
let _secret = null;
export function getJwtSecret() {
  if (!_secret) _secret = process.env.JWT_SECRET || JWT_SECRET;
  return _secret;
}

export function generateToken(payload) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: JWT_EXPIRY });
}

export function verifyToken(token) {
  return jwt.verify(token, getJwtSecret());
}

// Express middleware
export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido' });
  }
  try {
    const decoded = verifyToken(header.slice(7));
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Sesión expirada', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Token inválido' });
  }
}

// Optional: require specific role
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Sin permisos' });
    }
    next();
  };
}
