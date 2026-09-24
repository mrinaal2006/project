import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { getUserById } from '@/lib/users';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        id: { label: 'User ID', type: 'text', placeholder: 'Enter your User ID' },
        password: { label: 'Password', type: 'password', placeholder: 'Enter your Password' },
      },
      async authorize(credentials) {
        if (!credentials?.id || !credentials?.password) {
          throw new Error('Please enter an ID and password');
        }

        const user = getUserById(credentials.id);
        if (!user || !user.password) {
          throw new Error('No user found with this ID');
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error('Incorrect password');
        }

        return { id: user.id, name: user.name };
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || 'super-secret-key-for-dev',
};
