// eslint-disable-next-line @typescript-eslint/no-unused-vars
import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    backendToken?: string
    user: {
      id?: string
      email?: string
      firstName?: string
      lastName?: string
      profileImage?: string
      name?: string
      image?: string
    }
  }

  interface User {
    backendToken?: string
    backendUser?: {
      id: string
      email: string
      firstName: string
      lastName: string
      profileImage?: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    backendToken?: string
    backendUser?: {
      id: string
      email: string
      firstName: string
      lastName: string
      profileImage?: string
    }
  }
} 