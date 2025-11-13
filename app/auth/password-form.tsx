"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { verifyPassword } from "@/app/auth/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

// シンプルなアラートアイコンコンポーネント
function AlertIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
  )
}

export function PasswordForm() {
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const result = await verifyPassword(password)
      
      // resultがundefinedの場合の安全な処理
      if (!result) {
        console.error('サーバーアクションがundefinedを返しました');
        setError("エラーが発生しました。もう一度お試しください。")
        return
      }
      
      if (result.success) {
        router.push("/")
        router.refresh()
      } else {
        // エラーメッセージがある場合はそれを表示、なければデフォルトメッセージ
        setError(result.error || "パスワードが正しくありません")
      }
    } catch (err) {
      console.error('パスワード認証エラー:', err);
      setError(err instanceof Error ? err.message : "エラーが発生しました。もう一度お試しください。")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          inputMode="numeric"
          required
          className="text-center text-xl tracking-widest"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded">
          <AlertIcon />
          <p>{error}</p>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "ロード中..." : "OK"}
      </Button>
    </form>
  )
}
