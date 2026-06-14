import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import "../types";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.log("[auth] missing credentials");
            return null;
          }

          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          if (!user) {
            console.log("[auth] user not found:", credentials.email);
            return null;
          }

          if (!user.emailVerified) {
            console.log("[auth] user email not verified:", user.email);
            return null;
          }

          if (user.status !== "APPROVED") {
            console.log("[auth] user not approved:", user.email);
            return null;
          }

          console.log("[auth] user found:", user.email, "hash:", user.passwordHash?.substring(0, 10));

          const isValid = await bcrypt.compare(
            credentials.password,
            user.passwordHash
          );

          console.log("[auth] bcrypt result:", isValid);

          if (!isValid) return null;

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            studentType: user.studentType,
            modalities: user.modalities,
            belt: user.belt,
            degrees: user.degrees,
            isKids: user.isKids,
            photoUrl: user.photoUrl,
          };
        } catch (err) {
          console.error("[auth] error:", err);
          return null;
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.studentType = user.studentType;
        token.modalities = user.modalities;
        token.belt = user.belt;
        token.degrees = user.degrees;
        token.isKids = user.isKids;
        token.photoUrl = user.photoUrl;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.studentType = token.studentType;
      session.user.modalities = token.modalities;
      session.user.belt = token.belt;
      session.user.degrees = token.degrees;
      session.user.isKids = token.isKids;
      session.user.photoUrl = token.photoUrl;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
