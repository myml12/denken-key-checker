import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // クッキーからパスワード認証状態を確認
  const isAuthenticated = request.cookies.get("site-auth")?.value === "true"

  // 認証されていない場合は、パスワード入力ページにリダイレクト
  if (!isAuthenticated && !request.nextUrl.pathname.startsWith("/auth")) {
    return NextResponse.redirect(new URL("/auth", request.url))
  }

  // 認証済みでパスワードページにアクセスした場合はホームにリダイレクト
  if (isAuthenticated && request.nextUrl.pathname.startsWith("/auth")) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

// 全てのルートに対してミドルウェアを適用
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
