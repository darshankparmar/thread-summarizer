import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { authService } from '@/services/auth-service';

/**
 * NextAuth configuration for Foru.ms integration
 */
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'forums-credentials',
      name: 'Foru.ms Account',
      credentials: {
        login: { 
          label: 'Username or Email', 
          type: 'text',
          placeholder: 'Enter your username or email'
        },
        password: { 
          label: 'Password', 
          type: 'password',
          placeholder: 'Enter your password'
        },
      },
      async authorize(credentials) {
        if (!credentials?.login || !credentials?.password) {
          console.error('Missing credentials');
          return null;
        }

        try {
          const loginResult = await authService.login({
            login: credentials.login,
            password: credentials.password
          });

          if (!loginResult.success || !loginResult.user) {
            console.error('Login failed:', loginResult.error);
            return null;
          }

          // Return user object that will be stored in the JWT
          return {
            id: loginResult.user.id,
            name: loginResult.user.name,
            email: loginResult.user.email,
            image: loginResult.user.image,
            username: loginResult.user.username,
            emailVerified: loginResult.user.emailVerified,
            roles: loginResult.user.roles,
            forumsToken: loginResult.user.forumsToken,
          } as {
            id: string;
            name?: string;
            email?: string;
            image?: string;
            username: string;
            emailVerified?: boolean;
            roles: string[];
            forumsToken: string;
          };
        } catch (error) {
          console.error('Authentication error:', error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      // Persist the Foru.ms token and user data in the JWT
      if (user) {
        token.id = user.id;
        token.username = (user as { username?: string }).username;
        token.emailVerified = (user as { emailVerified?: boolean }).emailVerified;
        token.roles = (user as { roles?: string[] }).roles;
        token.forumsToken = (user as { forumsToken?: string }).forumsToken;
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client (excluding sensitive data)
      if (token && session.user) {
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { username?: string }).username = token.username as string;
        (session.user as { emailVerified?: boolean }).emailVerified = token.emailVerified as boolean;
        (session.user as { roles?: string[] }).roles = token.roles as string[];
        // Note: forumsToken is kept server-side only for security
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};