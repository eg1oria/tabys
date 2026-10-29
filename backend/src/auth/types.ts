import type { AdminRole } from '../prisma/client.js';

/** Что лежит в access-токене. */
export type JwtPayload = {
  sub: string;
  email: string;
  role: AdminRole;
  /** Отличает access от refresh: refresh-токеном нельзя ходить по API. */
  type: 'access';
};

/** Что гвард кладёт в request.user. */
export type AuthUser = {
  id: string;
  email: string;
  role: AdminRole;
};

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};
