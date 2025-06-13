import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  // 認証クッキーを削除
  (await
    // 認証クッキーを削除
    cookies()).delete("site-auth")

  // ホームページにリダイレクト
  return NextResponse.redirect(new URL("/auth", process.env.NEXT_PUBLIC_URL || "http://localhost:3000"))
}
