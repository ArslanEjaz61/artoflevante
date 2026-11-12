import { NextResponse, type NextRequest } from "next/server";
import { CUSTOMER_COOKIE_NAME, customerIdFromToken } from "@/lib/session";

/**
 * Signed-in customers who open the installed app (start_url "/") or the login page go straight
 * to their dashboard, instead of seeing the sign-in hero first while the page checks the session.
 * Only a signed session cookie is checked here; the dashboard still verifies the account itself.
 */
export async function proxy(request: NextRequest) {
  const customerId = await customerIdFromToken(request.cookies.get(CUSTOMER_COOKIE_NAME)?.value);
  if (customerId) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login"],
};
