import { JwtPayload } from 'jsonwebtoken';

export interface IUser extends JwtPayload {
  id: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}
