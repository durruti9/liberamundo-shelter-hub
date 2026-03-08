import pool from '../db.js';

/**
 * Middleware that validates the authenticated user has access to the requested albergue.
 * Admins have access to all albergues.
 * Other roles must have an entry in user_albergues.
 * 
 * Expects :albergueId in req.params (or first param segment).
 */
export function requireAlbergueAccess(paramName = 'albergueId') {
  return async (req, res, next) => {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ error: 'No autenticado' });

      // Admins bypass albergue check
      if (user.role === 'admin') return next();

      const albergueId = req.params[paramName];
      if (!albergueId) return next(); // No albergue param, skip check

      const { rows } = await pool.query(
        'SELECT 1 FROM user_albergues WHERE user_email = $1 AND albergue_id = $2',
        [user.email, albergueId]
      );

      if (rows.length === 0) {
        console.warn(`[ACCESS DENIED] User ${user.email} (role: ${user.role}) tried to access albergue ${albergueId}`);
        return res.status(403).json({ 
          error: 'Sin acceso a este albergue',
          debug: { userEmail: user.email, role: user.role, requestedAlbergueId: albergueId }
        });
      }

      next();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
}

/**
 * Validates that a huésped belongs to an albergue the user has access to.
 * For routes like PUT /comedor/:huespedId where there's no albergueId param.
 */
export function requireHuespedAccess(paramName = 'huespedId') {
  return async (req, res, next) => {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ error: 'No autenticado' });
      if (user.role === 'admin') return next();

      const huespedId = req.params[paramName];
      if (!huespedId) return next();

      const { rows } = await pool.query(
        `SELECT h.albergue_id FROM huespedes h
         JOIN user_albergues ua ON ua.albergue_id = h.albergue_id AND ua.user_email = $1
         WHERE h.id = $2`,
        [user.email, huespedId]
      );

      if (rows.length === 0) {
        return res.status(403).json({ error: 'Sin acceso a este huésped' });
      }

      next();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
}
