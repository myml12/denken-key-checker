"use server"

import { cookies } from "next/headers"

// パスワードを設定（4桁の数字）
const SITE_PASSWORD = "1202"

export async function verifyPassword(password: string) {
  // パスワードを検証
  if (password === SITE_PASSWORD) {
    // 認証成功時、クッキーを設定
    (await
          // 認証成功時、クッキーを設定
          cookies()).set("site-auth", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1週間
      path: "/",
    })

    return { success: true }
  }

  return { success: false }
}
