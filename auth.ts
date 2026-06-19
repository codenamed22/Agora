import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { Role, UserStatus } from "@prisma/client";
import { prisma } from "./lib/prisma";
import { ensureRegistrationRecords, syncUserAccess } from "./lib/access";

const isDevelopment = process.env.NODE_ENV !== "production";
const configuredLocalDevRole = process.env.LOCAL_DEV_AUTH_ROLE?.trim().toLowerCase();
export const isLocalDevAuthEnabled =
  process.env.NODE_ENV === "development" && process.env.LOCAL_DEV_AUTH_ENABLED === "true";
export const localDevAuthRole =
  configuredLocalDevRole === "admin" ? "admin" : "member";
export const localDevAuthEmail =
  process.env.LOCAL_DEV_AUTH_EMAIL ??
  (localDevAuthRole === "admin" ? "admin@shardup.local" : "applicant@shardup.local");
export const localDevAuthName =
  process.env.LOCAL_DEV_AUTH_NAME ??
  (localDevAuthRole === "admin" ? "Local Admin" : "Local Applicant");
export const isGoogleOAuthConfigured = Boolean(
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
);

const providers = [
  ...(isGoogleOAuthConfigured
    ? [
        Google({
          clientId: process.env.AUTH_GOOGLE_ID ?? "",
          clientSecret: process.env.AUTH_GOOGLE_SECRET ?? "",
          allowDangerousEmailAccountLinking: false,
          profile(profile) {
            return {
              id: profile.sub,
              name: profile.name,
              email: profile.email?.toLowerCase(),
              image: profile.picture,
            };
          },
        }),
      ]
    : []),
  ...(isLocalDevAuthEnabled
    ? [
        Credentials({
          id: "local-dev",
          name: "Local Development",
          credentials: {},
          async authorize() {
            const isAdmin = localDevAuthRole === "admin";
            const email = localDevAuthEmail.trim().toLowerCase();
            const name = localDevAuthName.trim();

            const user = await prisma.user.upsert({
              where: { email },
              update: {
                name,
                role: isAdmin ? Role.ADMIN : Role.MEMBER,
                status: isAdmin ? UserStatus.ACTIVE : UserStatus.PENDING,
              },
              create: {
                email,
                name,
                role: isAdmin ? Role.ADMIN : Role.MEMBER,
                status: isAdmin ? UserStatus.ACTIVE : UserStatus.PENDING,
              },
            });

            await ensureRegistrationRecords(user.id, user.email);

            return {
              id: user.id,
              email: user.email,
              name: user.name,
              image: user.image,
            };
          },
        }),
      ]
    : []),
];

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost: process.env.AUTH_TRUST_HOST === "true",
  secret:
    process.env.AUTH_SECRET ??
    (isDevelopment ? "shardup-development-only-auth-secret" : undefined),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/join",
  },
  providers,
  callbacks: {
    async signIn({ account, profile }) {
      if (isLocalDevAuthEnabled && account?.provider === "local-dev") {
        return true;
      }

      if (account?.provider !== "google") {
        return false;
      }

      return Boolean(
        profile &&
          "email" in profile &&
          typeof profile.email === "string" &&
          "email_verified" in profile &&
          profile.email_verified === true,
      );
    },
    async jwt({ token, user }) {
      const userId =
        typeof user?.id === "string"
          ? user.id
          : typeof token.id === "string"
            ? token.id
            : undefined;
      const email =
        typeof user?.email === "string"
          ? user.email
          : typeof token.email === "string"
            ? token.email
            : undefined;

      if (userId) {
        const access = await syncUserAccess(userId, email);
        token.id = userId;
        token.role = access?.role ?? "MEMBER";
        token.status = access?.status ?? "PENDING";
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && typeof token.id === "string") {
        session.user.id = token.id;
        session.user.role = token.role === "ADMIN" ? "ADMIN" : "MEMBER";
        session.user.status =
          token.status === "ACTIVE" ||
          token.status === "REJECTED" ||
          token.status === "SUSPENDED"
            ? token.status
            : "PENDING";
      }

      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (user.id) {
        await ensureRegistrationRecords(user.id, user.email);
      }
    },
  },
});
