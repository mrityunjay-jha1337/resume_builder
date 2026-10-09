import { INTERNAL_API_KEY } from '../config/env.js';

export function internalAuthMiddleware(req, res, next) {
  const secret = req.header('x-internal-secret');
  if (secret !== INTERNAL_API_KEY) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Invalid Service Secret' });
  }
  next();
}
