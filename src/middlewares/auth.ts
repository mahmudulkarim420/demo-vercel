import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import AppError from '../utils/AppError';
import config from '../config';
import { prisma } from '../lib/prisma';

export const auth = (...requiredRoles: string[]) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const token = req.cookies.accessToken;

      if (!token) {
        throw new AppError(401, 'You are not authorized! Token missing.');
      }

      const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, status: true, role: true },
      });

      if (!user) {
        throw new AppError(401, 'User no longer exists!');
      }

      if (user.status === 'BANNED') {
        throw new AppError(403, 'This user account has been banned!');
      }

      if (requiredRoles.length && !requiredRoles.includes(user.role)) {
        throw new AppError(403, 'You have no permission to access this route!');
      }

      req.user = { ...decoded, id: user.id, role: user.role };

      next();
    } catch (error) {
      next(error);
    }
  };
};
