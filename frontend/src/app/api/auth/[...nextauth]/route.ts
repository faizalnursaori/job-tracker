import NextAuth from 'next-auth'
import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'

const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Call our backend login API
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          })

          const result = await response.json()

          if (result.success && result.data.user && result.data.token) {
            // Return user object that will be stored in the session
            return {
              id: result.data.user.id,
              email: result.data.user.email,
              name: `${result.data.user.firstName} ${result.data.user.lastName}`,
              backendToken: result.data.token,
              backendUser: result.data.user,
            }
          }
          
          return null
        } catch (error) {
          console.error('Credentials authorization error:', error)
          return null
        }
      }
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (!account || !user.email) return false;

      // Skip OAuth callback for credentials provider
      if (account.provider === 'credentials') {
        return true;
      }

      try {
        // Send user data to our backend OAuth callback (only for OAuth providers)
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/oauth/callback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: user.email,
            firstName: user.name?.split(' ')[0] || '',
            lastName: user.name?.split(' ').slice(1).join(' ') || '',
            profileImage: user.image,
            provider: account.provider,
            providerAccountId: account.providerAccountId,
          }),
        });

        if (!response.ok) {
          console.error('OAuth callback failed:', await response.text());
          return false;
        }

        const data = await response.json();
        
        // Store the backend JWT token in the session
        if (data.success && data.data.token) {
          user.backendToken = data.data.token;
          user.backendUser = data.data.user;
        }

        return true;
      } catch (error) {
        console.error('OAuth sign-in error:', error);
        return false;
      }
    },
    async jwt({ token, user, trigger, session }) {
      // Persist the OAuth access_token and user data
      if (user) {
        token.backendToken = user.backendToken;
        token.backendUser = user.backendUser;
      }
      
      // Handle session updates (when update() is called)
      if (trigger === 'update' && session) {
        // Update the token with new user data
        if (token.backendUser) {
          token.backendUser = {
            ...token.backendUser,
            firstName: session.firstName || token.backendUser.firstName,
            lastName: session.lastName || token.backendUser.lastName,
          };
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client
      session.backendToken = token.backendToken as string;
      session.user = {
        ...session.user,
        ...token.backendUser,
        // Ensure name is constructed from firstName and lastName
        name: token.backendUser?.firstName && token.backendUser?.lastName 
          ? `${token.backendUser.firstName} ${token.backendUser.lastName}`
          : session.user?.name,
      };
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST } 