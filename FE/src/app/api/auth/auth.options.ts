import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { AuthOptions } from "next-auth";
import { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import dayjs from "dayjs";
import { sendRequest } from "@/utils/api";

async function refreshAccessToken(token: JWT) {
  const res = await sendRequest<IBackendRes<JWT>>({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/auth/refresh`,
    method: "POST",
    body: { refresh_token: token?.refresh_token },
  });

  if (res.data) {
    return {
      ...token,
      access_token: res.data?.access_token ?? "",
      refresh_token: res.data?.refresh_token ?? "",
      access_expire: dayjs(new Date())
        .add(
          +(process.env.TOKEN_EXPIRE_NUMBER as string),
          process.env.TOKEN_EXPIRE_UNIT as any
        )
        .unix(),
      error: "",
    };
  } else {
    //failed to refresh token => do nothing
    return {
      ...token,
      error: "RefreshAccessTokenError", // This is used in the front-end, and if present, we can force a re-login, or similar
    };
  }
}

const getAccessExpire = () => {
  return dayjs(new Date())
    .add(
      +(process.env.TOKEN_EXPIRE_NUMBER || 1),
      (process.env.TOKEN_EXPIRE_UNIT || "days") as any
    )
    .unix();
};

export const authOptions: AuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  // Configure one or more authentication providers
  providers: [
    CredentialsProvider({
      name: "username",

      credentials: {
        username: { label: "username", type: "text" },
        password: { label: "password", type: "password" },
      },

      async authorize(credentials, req) {
        const res = await sendRequest<IBackendRes<JWT>>({
          url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/auth/login`,
          method: "POST",
          body: {
            email: credentials?.username,
            password: credentials?.password,
          },
        });

        console.log("LOGIN RESPONSE:", res);

        if (res && res.data) {
          return res.data as any;
        }

        throw new Error(res?.message || "Login failed");
      },
    }),
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
    }),
  ],

  callbacks: {
    async jwt({ token, user, account, trigger }) {
      if (trigger === "signIn" && account?.provider === "credentials") {
        const credentialUser = user as any;
        const backendUser = credentialUser?.user || credentialUser || {};

        token.access_token =
          credentialUser?.access_token || credentialUser?.accessToken;

        token.refresh_token =
          credentialUser?.refresh_token || credentialUser?.refreshToken;

        token.access_expire = getAccessExpire();
        token.error = "";

        token.user = {
          ...backendUser,
          _id: backendUser?._id || backendUser?.id,
          id: backendUser?.id || backendUser?._id,
          email: backendUser?.email,
          name: backendUser?.name || backendUser?.email,
          avatarUrl:
            backendUser?.avatarUrl || backendUser?.avatar || backendUser?.image,
        };

        return token;
      }

      if (trigger === "signIn" && account?.provider !== "credentials") {
        const socialUser = user as any;

        const res = await sendRequest<IBackendRes<any>>({
          url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/auth/social-media`,
          method: "POST",
          body: {
            type: account?.provider?.toUpperCase(),
            email: socialUser?.email,
            username: socialUser?.email,
            name: socialUser?.name,
            avatarUrl: socialUser?.image,
          },
        });

        if (!res?.data) {
          throw new Error(res?.message || "Social login failed");
        }

        const backendData = res.data || {};
        const backendUser = (backendData?.user || backendData || {}) as any;

        token.access_token =
          backendData?.access_token ||
          backendData?.accessToken ||
          backendUser?.access_token ||
          backendUser?.accessToken;

        token.refresh_token =
          backendData?.refresh_token ||
          backendData?.refreshToken ||
          backendUser?.refresh_token ||
          backendUser?.refreshToken;

        token.access_expire = getAccessExpire();
        token.error = "";

        token.user = {
          ...backendUser,
          _id: backendUser?._id || backendUser?.id,
          id: backendUser?.id || backendUser?._id,
          email: backendUser?.email || socialUser?.email,
          name: backendUser?.name || socialUser?.name || socialUser?.email,
          avatarUrl:
            backendUser?.avatarUrl ||
            backendUser?.avatar ||
            backendUser?.image ||
            socialUser?.image,
        };

        return token;
      }

      if (token.access_expire && dayjs().unix() < Number(token.access_expire)) {
        return token;
      }

      if (token.refresh_token) {
        return await refreshAccessToken(token);
      }

      return token;
    },

    async session({ session, token }) {
      const tokenUser = (token.user || {}) as any;
      const defaultUser = (session.user || {}) as any;

      (session as any).access_token = token.access_token as string;
      (session as any).refresh_token = token.refresh_token as string;
      (session as any).error = token.error;

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
      } as any;

      return session;
    },
  },
};
