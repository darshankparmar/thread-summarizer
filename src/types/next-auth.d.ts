/**
 * NextAuth Type Declarations
 * Extends default NextAuth interfaces with our custom user properties
 */

import { DefaultSession, DefaultUser } from 'next-auth';
import { DefaultJWT } from 'next-auth/jwt';
import { ForumsRole } from '@/types';

declare module 'next-auth' {
  /**
   * Extend the default Session interface
   */
  interface Session extends DefaultSession {
    user: {
      id: string;
      username: string;
      email?: string;
      name?: string;
      image?: string;
      emailVerified?: boolean;
      roles?: (string | ForumsRole)[];
      forumsToken?: string;
    } & DefaultSession['user'];
  }

  /**
   * Extend the default User interface
   */
  interface User extends DefaultUser {
    id: string;
    username: string;
    email?: string;
    name?: string;
    image?: string;
    emailVerified?: boolean;
    roles?: (string | ForumsRole)[];
    forumsToken?: string;
  }
}

declare module 'next-auth/jwt' {
  /**
   * Extend the default JWT interface
   */
  interface JWT extends DefaultJWT {
    id: string;
    username: string;
    email?: string;
    name?: string;
    image?: string;
    emailVerified?: boolean;
    roles?: (string | ForumsRole)[];
    forumsToken?: string;
  }
}