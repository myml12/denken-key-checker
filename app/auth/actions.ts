"use server"

import { cookies } from "next/headers"
import { SignJWT } from "jose"

// パスワードを取得（実行時に評価することで環境変数の変更に追従）
function getSitePassword(): string {
  const pw = process.env.SITE_PASSWORD
  if (!pw) {
    throw new Error("SITE_PASSWORD environment variable is not set. Please set it in the deployment environment")
  }
  return pw
}

// シークレットキーを取得
function getSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set. Please set it in .env.local")
  }
  return secret
}

// JWTトークンを生成する関数（30日有効）
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
    .setExpirationTime("30d") // 30日間有効
    .sign(secret)

  return token
}

export async function verifyPassword(password: string) {
  try {
    const SITE_PASSWORD = getSitePassword()

  // パスワードを検証
  if (password === SITE_PASSWORD) {
    // 認証成功時、JWTトークンを生成してクッキーに設定
    const authToken = await generateAuthToken()

    const cookieStore = await cookies()
    cookieStore.set("site-auth", authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 30, // 30日
      path: "/",
      sameSite: "strict", // CSRF対策
    })

    return { success: true }
  }

  return { success: false }
  } catch (err) {
    // エラーが発生しても常にオブジェクトを返す
    const message = err instanceof Error ? err.message : "Unknown error"
    return { success: false, error: message }
  }
}
