import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/auth/signin",
  },

  callbacks: {
    authorized: ({ token }) => {
      return Boolean(token);
    },
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/playlist/:path*",
    "/track/upload/:path*",
    "/like/:path*",
  ],
};
