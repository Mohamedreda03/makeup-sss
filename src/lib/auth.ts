import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcrypt";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { db } from "@/lib/db";
import { UserRole } from "@/generated/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt" as const,
  },
  pages: {
    signIn: "/sign-in",
    error: "/error",
  },
  debug: process.env.NODE_ENV === "development",
  callbacks: {
    jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }: any) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      // Allow OAuth sign-in (Google)
      if (account?.provider !== "credentials") return true;

      // For credentials, rely on the authorize function
      return true;
    },
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: UserRole.CUSTOMER, // Default role for OAuth users
        };
      },
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials: any) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error("Email and password are required");
          }

          const email = credentials.email.trim().toLowerCase();
          const password = credentials.password;

          // Check database connection before querying
          try {
            await db.$connect();
          } catch (dbError) {
            console.error("Database connection error:", dbError);
            throw new Error("Unable to connect to database");
          }

          // Find user with detailed error handling
          let user;
          try {
            user = await db.user.findUnique({
              where: { email },
            });
          } catch (findError) {
            console.error("Error finding user:", findError);
            throw new Error("Database error");
          }

          if (!user) {
            throw new Error("No user found with this email");
          }

          if (!user.password) {
            throw new Error("This account cannot use password login");
          }

          // Verify password with detailed error handling
          let isPasswordValid = false;
          try {
            isPasswordValid = await compare(password, user.password);
          } catch (passwordError) {
            console.error("Password verification error:", passwordError);
            throw new Error("Error verifying password");
          }

          if (!isPasswordValid) {
            console.error(
              "Authentication attempt failed: Invalid password for user",
              email
            );
            throw new Error("Invalid email or password");
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            image: user.image,
          };
        } catch (error) {
          console.error("Authentication error:", error);
          // Re-throw with the original message for better user feedback
          throw error;
        }
      },
    }),
  ],
  trustHost: true,
});

export const { GET, POST } = handlers;
