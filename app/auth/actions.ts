"use server"

import { cookies } from "next/headers"
import { SignJWT } from "jose"

// パスワードを設定（4桁の数字）
const SITE_PASSWORD = process.env.SITE_PASSWORD

// シークレットキーを取得
function getSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set. Please set it in .env.local")
  }
  return secret
}

// JWTトークンを生成する関数
async function generateAuthToken(): Promise<string> {
  const secret = new TextEncoder().encode(getSecret())

  // ランダムなセッションIDを生成して、トークンの一意性を保証
  const sessionId = crypto.randomUUID()

  const token = await new SignJWT({
    authenticated: true,
    sessionId: sessionId  // 一意なセッションIDを追加
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d") // 7日間有効
    .sign(secret)

  return token
}

export async function verifyPassword(password: string) {
  // パスワードを検証
  if (password === SITE_PASSWORD) {
    // 認証成功時、JWTトークンを生成してクッキーに設定
    const authToken = await generateAuthToken()

    const cookieStore = await cookies()
    cookieStore.set("site-auth", authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1週間
      path: "/",
      sameSite: "strict", // CSRF対策
    })

    return { success: true }
  }

  return { success: false }
}
