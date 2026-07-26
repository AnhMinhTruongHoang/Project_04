import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { AuthOptions } from "next-auth";
import { JWT } from "next-auth/jwt";
import dayjs from "dayjs";

import { sendRequest } from "@/utils/api";

/* =========================
   AUTH CONSTANTS
========================= */

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
).replace(/\/+$/, "");

const AUTH_SIGNIN_PATH = "/auth/signin";

/* =========================
   AUTH HELPERS
========================= */

const getResponseMessage = (
  response: any,
  fallback = "Authentication failed."
) => {
  const message = response?.message;

  if (Array.isArray(message)) {
    return message.filter(Boolean).join(", ") || fallback;
  }

  if (typeof message === "string" && message.trim()) {
    return message.trim();
  }

  return fallback;
};

const getAuthErrorCode = (
  statusCode?: number | string,
  message?: string
): string => {
  const normalizedStatusCode = Number(statusCode);
  const normalizedMessage = String(message || "").toLowerCase();

  if (normalizedMessage.includes("deactivated")) {
    return "AccountDeactivated";
  }

  if (normalizedMessage.includes("banned")) {
    return "AccountBanned";
  }

  if (normalizedMessage.includes("suspended")) {
    return "AccountSuspended";
  }

  if (
    normalizedMessage.includes("email and password") ||
    normalizedMessage.includes("using your password")
  ) {
    return "UsePassword";
  }

  if (normalizedMessage.includes("google")) {
    return "UseGoogle";
  }

  if (normalizedMessage.includes("github")) {
    return "UseGitHub";
  }

  if (normalizedStatusCode === 403) {
    return "AccessDenied";
  }

  if (normalizedStatusCode === 409) {
    return "ProviderConflict";
  }

  return "SocialLoginFailed";
};

const buildAuthErrorUrl = (code: string, message: string): string => {
  const frontendUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  const url = new URL(AUTH_SIGNIN_PATH, frontendUrl);

  url.searchParams.set("error", code);
  url.searchParams.set("message", message);

  return url.toString();
};

const getAccessExpire = () => {
  return dayjs()
    .add(
      Number(process.env.TOKEN_EXPIRE_NUMBER || 1),
      (process.env.TOKEN_EXPIRE_UNIT || "days") as any
    )
    .unix();
};

const applyBackendAuthToToken = (
  token: JWT,
  backendData: any,
  fallbackUser: {
    email?: string;
    name?: string;
    avatarUrl?: string;
  } = {}
): JWT => {
  const backendUser = backendData?.user || backendData || {};

  token.access_token =
    backendData?.access_token ||
    backendData?.accessToken ||
    backendUser?.access_token ||
    backendUser?.accessToken ||
    "";

  token.refresh_token =
    backendData?.refresh_token ||
    backendData?.refreshToken ||
    backendUser?.refresh_token ||
    backendUser?.refreshToken ||
    "";

  token.access_expire = getAccessExpire();
  token.error = "";
  (token as any).auth_message = "";

  token.user = {
    ...backendUser,

    _id: backendUser?._id || backendUser?.id,
    id: backendUser?.id || backendUser?._id,

    email: backendUser?.email || fallbackUser.email || "",

    name:
      backendUser?.name ||
      fallbackUser.name ||
      backendUser?.email ||
      fallbackUser.email ||
      "",

    avatarUrl:
      backendUser?.avatarUrl ||
      backendUser?.avatar ||
      backendUser?.image ||
      fallbackUser.avatarUrl ||
      "",

    accountStatus: backendUser?.accountStatus || "ACTIVE",

    statusReason: backendUser?.statusReason || null,

    suspendedUntil: backendUser?.suspendedUntil || null,
  };

  return token;
};

/* =========================
   REFRESH ACCESS TOKEN
========================= */

async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    const res = await sendRequest<IBackendRes<any>>({
      url: `${BACKEND_URL}/api/v1/auth/refresh`,
      method: "POST",
      body: {
        refresh_token: token?.refresh_token,
      },
    });

    if (res?.data) {
      return applyBackendAuthToToken(
        {
          ...token,
        },
        res.data,
        {
          email: (token.user as any)?.email,
          name: (token.user as any)?.name,
          avatarUrl: (token.user as any)?.avatarUrl,
        }
      );
    }

    return {
      ...token,
      error: "RefreshAccessTokenError",
      auth_message: getResponseMessage(
        res,
        "Your session has expired. Please sign in again."
      ),
    } as JWT;
  } catch (error) {
    return {
      ...token,
      error: "RefreshAccessTokenError",
      auth_message:
        error instanceof Error
          ? error.message
          : "Your session has expired. Please sign in again.",
    } as JWT;
  }
}

/* =========================
   NEXTAUTH OPTIONS
========================= */

export const authOptions: AuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,

  /* CUSTOM AUTH PAGES */
  pages: {
    signIn: AUTH_SIGNIN_PATH,
    error: AUTH_SIGNIN_PATH,
  },

  providers: [
    /* LOCAL ACCOUNT */
    CredentialsProvider({
      name: "username",

      credentials: {
        username: {
          label: "Email",
          type: "email",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },

      async authorize(credentials) {
        const email = credentials?.username?.trim().toLowerCase();
        const password = credentials?.password;

        if (!email || !password) {
          throw new Error("Email and password are required.");
        }

        const res = await sendRequest<IBackendRes<any>>({
          url: `${BACKEND_URL}/api/v1/auth/login`,
          method: "POST",
          body: {
            email,
            password,
          },
        });

        if (res?.data) {
          return res.data as any;
        }

        throw new Error(
          getResponseMessage(res, "Email or password is incorrect.")
        );
      },
    }),

    /* GITHUB */
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,

      authorization: {
        params: {
          scope: "read:user user:email",
        },
      },
    }),

    /* GOOGLE */
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,

      authorization: {
        params: {
          scope: "openid email profile",
          prompt: "select_account",
        },
      },

      profile(profile: any) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        };
      },
    }),
  ],

  callbacks: {
    /* =========================
       VALIDATE SOCIAL LOGIN
    ========================= */

    async signIn({ user, account, profile }) {
      if (!account || account.provider === "credentials") {
        return true;
      }

      const socialUser = user as any;
      const socialProfile = profile as any;

      const email = String(socialUser?.email || socialProfile?.email || "")
        .trim()
        .toLowerCase();

      const name = socialUser?.name || socialProfile?.name || email;

      const avatarUrl =
        socialUser?.image ||
        socialProfile?.picture ||
        socialProfile?.avatar_url ||
        "";

      if (!email) {
        return buildAuthErrorUrl(
          "MissingEmail",
          "Your social account did not provide an email address. Please allow email access or use another account."
        );
      }

      const provider = account.provider.toUpperCase();

      const res = await sendRequest<IBackendRes<any>>({
        url: `${BACKEND_URL}/api/v1/auth/social-media`,
        method: "POST",
        body: {
          type: provider,
          email,
          username: email,
          name,
          avatarUrl,
        },
      });

      if (!res?.data) {
        const message = getResponseMessage(
          res,
          `Unable to sign in with ${account.provider}.`
        );

        const errorCode = getAuthErrorCode(res?.statusCode, message);

        return buildAuthErrorUrl(errorCode, message);
      }

      /*
       * Lưu response BE vào user để jwt callback dùng lại.
       * Không gọi social-media API lần thứ hai.
       */
      socialUser.backendAuth = res.data;
      socialUser.socialEmail = email;
      socialUser.socialName = name;
      socialUser.socialAvatarUrl = avatarUrl;

      return true;
    },

    /* =========================
       BUILD JWT
    ========================= */

    async jwt({ token, user, account }) {
      /* LOCAL LOGIN */
      if (account?.provider === "credentials" && user) {
        return applyBackendAuthToToken(token, user as any);
      }

      /* SOCIAL LOGIN */
      if (account?.provider && account.provider !== "credentials" && user) {
        const socialUser = user as any;
        const backendData = socialUser?.backendAuth;

        if (!backendData) {
          return {
            ...token,
            error: "SocialBackendSessionMissing",
            auth_message:
              "Social authentication succeeded, but the SoundClone session could not be created.",
          } as JWT;
        }

        return applyBackendAuthToToken(token, backendData, {
          email: socialUser?.socialEmail || socialUser?.email,

          name: socialUser?.socialName || socialUser?.name,

          avatarUrl: socialUser?.socialAvatarUrl || socialUser?.image,
        });
      }

      /* TOKEN STILL VALID */
      if (token.access_expire && dayjs().unix() < Number(token.access_expire)) {
        return token;
      }

      /* REFRESH TOKEN */
      if (token.refresh_token) {
        return refreshAccessToken(token);
      }

      return token;
    },

    /* =========================
       BUILD CLIENT SESSION
    ========================= */

    async session({ session, token }) {
      const tokenUser = (token.user || {}) as any;
      const defaultUser = (session.user || {}) as any;

      (session as any).access_token = token.access_token as string;

      (session as any).refresh_token = token.refresh_token as string;

      (session as any).error = token.error || "";

      (session as any).auth_message = (token as any).auth_message || "";

      session.user = {
        ...defaultUser,
        ...tokenUser,

        _id: tokenUser?._id || tokenUser?.id,

        id: tokenUser?.id || tokenUser?._id,

        email: tokenUser?.email || defaultUser?.email,

        name: tokenUser?.name || defaultUser?.name || tokenUser?.email,

        avatarUrl:
          tokenUser?.avatarUrl ||
          tokenUser?.avatar ||
          tokenUser?.image ||
          defaultUser?.avatarUrl ||
          defaultUser?.image,

        accountStatus: tokenUser?.accountStatus || "ACTIVE",

        statusReason: tokenUser?.statusReason || null,

        suspendedUntil: tokenUser?.suspendedUntil || null,
      } as any;

      return session;
    },

    /* =========================
       SAFE REDIRECT
    ========================= */

    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }

      try {
        const targetUrl = new URL(url);

        if (targetUrl.origin === baseUrl) {
          return url;
        }
      } catch {
        return `${baseUrl}${AUTH_SIGNIN_PATH}`;
      }

      return baseUrl;
    },
  },

  debug: process.env.NODE_ENV === "development",
};
