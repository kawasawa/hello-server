export namespace constants {
  export namespace app {
    export const name = 'Hello Web App';
    export const creator = 'Kazuki Awasawa';
  }

  export namespace value {
    export const authHeader = 'x-access-token';
    export const refreshTokenExpires = '30d';
    export const accessTokenExpires = '10m';
    export const identifyMailExpires = 1; // hours
    export const resetPasswordMailExpires = 1; // hours
    export const passwordRule = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,64})/;
  }

  export namespace url {
    export const base = '/api';
    export const version = '/version';
    export namespace auth {
      export const base = '/auth';
      export const signup = '/signup';
      export const signin = '/signin';
      export const signout = '/signout';
      export const withdraw = '/withdraw';
      export const identify = '/identify';
      export const identify_verify = '/verify/identify';
      export const resetPassword = '/reset-password';
      export const resetPassword_verify = '/verify/reset-password';
      export const refresh = '/refresh';
    }
    export namespace resource {
      export const user = '/user';
    }
    export namespace form {
      export const resetPassword = 'auth/ResetPassword';
    }
  }

  export namespace log {
    export const serverStarted = 'Start to listen: port="%d", origin="%s"';
    export const parametersVerified = 'Parameters verified: method=%s, path="%s", body=[%s]';
    export const accessTokenRecieved = 'Access token recieved: method=%s, path="%s", token="%s"';
    export const refreshTokenRecieved = 'Refresh token recieved: method=%s, path="%s", token="%s"';
    export const tokenCreated = 'Token created: user="%d", token={ r: "%s", a: "%s"}';
    export const identifyUrlCreated = 'Identify url created: "%s"';
    export const resetPasswordUrlCreated = 'Reset password url created: "%s"';
  }

  export namespace label {
    export const email = 'メールアドレス';
    export const password = 'パスワード';
    export const passwordConfirmation = 'パスワード（確認）';
    export const submitNewPassword = 'パスワードを再設定する';
    export const resetPasswordFormTitle = '新しいパスワードを設定してください';
  }

  export namespace message {
    export namespace info {
      export const identifyMailSubject = `[${app.name}] メールアドレス認証のお願い`;
      export const identifyMailHtml = `%s 様<br /><br />${app.name} をご利用いただき、誠にありがとうございます。<br />以下のURLにアクセスし、メールアドレスを認証してください。<br /><br /><a href="%s">メールアドレスを認証する</a><br />※送信から%d時間経過しますと期限切れとなります。`;
      export const resetPasswordMailSubject = `[${app.name}] パスワード再設定のご案内`;
      export const resetPasswordMailHtml = `%s 様<br /><br />${app.name} をご利用いただき、誠にありがとうございます。<br />以下のURLにアクセスし、パスワードを再設定してください。<br /><br /><a href="%s">パスワードを再設定する</a><br />※送信から%d時間経過しますと期限切れとなります。`;
      export const accountVerified = 'アカウントは認証されました。';
      export const accountVerifiedAlready = 'このアカウントは認証済みです。';
      export const passwordUpdated =
        'パスワードは再設定されました。新しいパスワードを使い、ログイン画面から認証を行ってください。';
    }
    export namespace error {
      export const checkIsEmpty = 'この項目は必須です。';
      export const checkIsLengthMax = '%d 文字以内で設定してください。';
      export const dataNotFound = 'データが見つかりません。';
      export const emailNotFound = 'このメールアドレスに一致するユーザを見つかりません。';
      export const emailFormat = 'メールアドレスの書式で指定してください。';
      export const emailUsed = 'このメールアドレスは既に登録されています。';
      export const passwordFormat =
        '半角英大文字・小文字、数字、記号 !@#$%^&* を使用し、8 文字以上 64 文字以内で設定してください。';
      export const passwordMismatch = 'パスワードが一致しません。';
      export const urlInvalid = 'URLが不正です。';
      export const headerInvalid = 'リクエストヘッダーが不正です。';
      export const credentialInvalid = '認証情報が不正です。';
      export const accessTokenInvalid = 'アクセストークンが不正です。';
      export const refreshTokenEmpty = 'リフレッシュトークンを取得できません。';
      export const refreshTokenInvalid = 'リフレッシュトークンが不正です。';
      export const resetPasswordTokenInvalid = 'パスワードリセットトークンが不正です。';
      export const notFound = 'Not Found. %s';
    }
  }
}
