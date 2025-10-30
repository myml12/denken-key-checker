import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify, SignJWT } from "jose"

// シークレットキーを取得
function getSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    // 本番環境ではシークレットが必須
    console.error("JWT_SECRET environment variable is not set")
    // 開発環境でも厳格に管理するため、エラーを返す
    return ""
  }
  return secret
}

// JWTトークンを検証し、必要に応じて更新する関数
async function verifyAndRefreshJWT(token: string | undefined): Promise<{ isValid: boolean; newToken?: string }> {
  if (!token) return { isValid: false }

  try {
    const secretKey = getSecret()
    if (!secretKey) return { isValid: false }

    const secret = new TextEncoder().encode(secretKey)

    // トークンを検証
    const { payload } = await jwtVerify(token, secret)

    // 有効期限までの残り時間を計算
    const now = Math.floor(Date.now() / 1000)
    const remainingTime = payload.exp! - now
    const daysRemaining = remainingTime / (60 * 60 * 24)

    // 残り時間が3日以下なら、新しいトークンを生成
    if (daysRemaining <= 3) {
      const newToken = await new SignJWT({
        authenticated: true,
        sessionId: crypto.randomUUID()
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("30d")
        .sign(secret)

      return { isValid: true, newToken }
    }

    return { isValid: true }
  } catch (error) {
    // 検証に失敗した場合（署名が違う、期限切れなど）
    return { isValid: false }
  }
}

export async function middleware(request: NextRequest) {
  // クッキーから認証トークンを取得
  const authToken = request.cookies.get("site-auth")?.value

  // JWTトークンが有効かチェック（必要に応じて更新）
  const { isValid, newToken } = await verifyAndRefreshJWT(authToken)

  // トークンが有効で、新しいトークンが生成された場合は更新
  if (isValid && newToken) {
    const response = NextResponse.next()
    response.cookies.set("site-auth", newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30, // 30日
      path: "/",
      sameSite: "strict",
    })
    return response
  }

  // 認証されていない場合は、パスワード入力ページにリダイレクト
  if (!isValid && !request.nextUrl.pathname.startsWith("/auth")) {
    return NextResponse.redirect(new URL("/auth", request.url))
  }

  // 認証済みでパスワードページにアクセスした場合はホームにリダイレクト
  if (isValid && request.nextUrl.pathname.startsWith("/auth")) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

// 全てのルートに対してミドルウェアを適用
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
