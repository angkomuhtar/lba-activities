import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "session";
const encodedKey = new TextEncoder().encode(process.env.SESSION_SECRET!);

async function decrypt(token: string | undefined) {
  try {
    const { payload } = await jwtVerify(token ?? "", encodedKey, {
      algorithms: ["HS256"],
    });
    return payload as { userId?: string };
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const session = await decrypt(request.cookies.get(SESSION_COOKIE)?.value);
  const path = request.nextUrl.pathname;

  const isAuthPage = path === "/login";

  if (!session?.userId && !isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (session?.userId && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next({ request });
}

export const config = {
  matcher: [
    // Jalankan di semua route kecuali statik & asset
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};