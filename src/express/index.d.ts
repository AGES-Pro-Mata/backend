import { CurrentUser } from '../../auth/auth.model';

declare global {
  namespace Express {
    interface Request {
      user?: CurrentUser;
    }
  }
}

export {};
