declare global {
  namespace Express {
    interface AuthenticatedUser {
      id: string;
      email: string;
      username: string;
      role: string;
    }

    interface Request {
      requestId?: string;
      user?: AuthenticatedUser;
    }
  }
}

export {};
