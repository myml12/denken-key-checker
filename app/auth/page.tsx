import { PasswordForm } from "@/app/auth/password-form"

export default function AuthPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-black">Welcome to denken Monitor</h1>
          <p className="mt-2 text-gray-600">パスワードを入力してください</p>
        </div>
        <PasswordForm />
      </div>
    </div>
  )
}
