import jwt from 'jsonwebtoken';

const JWT_EXPIRY = '4h';

// JWT_SECRET is mandatory in production
export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('❌ FATAL: JWT_SECRET environment variable is not set. Server cannot start securely.');
    process.exit(1);
  }
  return secret;
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
