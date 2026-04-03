// middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Example: Protect specific routes
export default withAuth({
  pages: {
    signIn: "/login",
  },
});

// Optionally add matcher for which routes use this middleware
export const config = {
  matcher: ["/chat/:path*", "/profile/:path*"], // adjust as needed
};