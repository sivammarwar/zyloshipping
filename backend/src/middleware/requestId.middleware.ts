import { randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';

export type RequestWithId = Request & { requestId: string };

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const id =
    (typeof req.headers['x-request-id'] === 'string' && req.headers['x-request-id']) ||
    randomUUID();
  (req as RequestWithId).requestId = id;
  res.setHeader('X-Request-Id', id);
  next();
}
