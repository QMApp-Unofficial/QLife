import type { SessionUser } from '../../src/types/game';

declare global {
  namespace Express {
    interface Request {
      user?: SessionUser;
    }
  }
}

export {};
