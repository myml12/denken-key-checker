## モニタリングWebアプリ

[key_sensor](https://github.com/myml12/key_sensor)から送信される値をモニターできるWebアプリです。Next.jsとFirebase RealtimeDBを使用しています。
デザインにもこだわり、ホーム画面に追加することでアプリのように使用することができます。

## 環境変数（必須）

`.env.local`ファイルを作成し、以下の環境変数を設定してください：

```env
# JWT認証用
JWT_SECRET=強力なランダムな文字列を設定（後述の方法で生成）

# パスワード認証用
SITE_PASSWORD=パスワード認証用のパスワード

# Firebase Realtime Database設定
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

### 環境変数の詳細

- **JWT_SECRET（必須）**: JWTトークンの署名に使用する秘密鍵
  - ターミナルで `openssl rand -hex 32` を実行して生成
  - デフォルト値はありません（セキュリティのため）
- **SITE_PASSWORD（必須）**: パスワード認証用のパスワード
- **Firebase関連（必須）**: Firebase Realtime Databaseに接続するために必要
  - Firebase Console > Project Settings > General > Your apps から取得
