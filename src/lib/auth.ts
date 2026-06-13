import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { getTenantPrisma } from "./tenant-prisma";
import "../types";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
        tenantSlug: { label: "Tenant", type: "text" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password || !credentials?.tenantSlug) {
            console.log("[auth] missing credentials");
            return null;
          }

          const tenantSlug = credentials.tenantSlug;
          const prisma = await getTenantPrisma(tenantSlug);
          if (!prisma) {
            console.log("[auth] tenant not found:", tenantSlug);
            return null;
          }

          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          if (!user) {
            console.log("[auth] user not found:", credentials.email);
            return null;
          }

          console.log("[auth] user found:", user.email, "tenant:", tenantSlug);

          const isValid = await bcrypt.compare(
            credentials.password,
            user.passwordHash
          );

          if (!isValid) return null;

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            isOwner: user.isOwner,
            studentType: user.studentType,
            modalities: user.modalities,
            belt: user.belt,
            degrees: user.degrees,
            isKids: user.isKids,
            photoUrl: user.photoUrl,
            tenantSlug,
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
        token.isOwner = user.isOwner;
        token.studentType = user.studentType;
        token.modalities = user.modalities;
        token.belt = user.belt;
        token.degrees = user.degrees;
        token.isKids = user.isKids;
        token.photoUrl = user.photoUrl;
        token.tenantSlug = user.tenantSlug;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.isOwner = token.isOwner;
      session.user.studentType = token.studentType;
      session.user.modalities = token.modalities;
      session.user.belt = token.belt;
      session.user.degrees = token.degrees;
      session.user.isKids = token.isKids;
      session.user.photoUrl = token.photoUrl;
      session.user.tenantSlug = token.tenantSlug;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
