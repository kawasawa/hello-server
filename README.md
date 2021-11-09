# hello-server

<div>
  <a href="https://kawasawa.github.io/hello-server/openapi.html">
    <img src="https://img.shields.io/badge/-GitHub Pages-2A579A.svg?logo=github" alt="Store">
  </a>
  <a href="https://github.com/kawasawa/hello-server/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/kawasawa/hello-server.svg" alt="License">
  </a>
  <a href="https://codecov.io/gh/kawasawa/hello-server">
    <img src="https://codecov.io/gh/kawasawa/hello-server/branch/main/graph/badge.svg?token=7d5PI5yJ0D"/>
  </a>
</div>

## 概要

TypeScript と Express フレームワークによる API サーバ実装のスケルトンコードです。

API 仕様書：https://kawasawa.github.io/hello-server/openapi.html

## 開発情報

本プログラムは以下を主な基盤として使用し、構築されています。

|                      | 使用技術          |
| -------------------- | ----------------- |
| プログラミング言語   | Typescript        |
| フレームワーク       | Express           |
| ├ クッキーパーサ     | cookie-parser     |
| ├ CORS 対応          | cors              |
| └ ロギング           | morgan            |
| トークン認識         | jsonwebtoken      |
| 暗号化               | bcrypt            |
| バリデーション       | express-validator |
| エラーハンドリング   | boom              |
| テンプレートエンジン | Mustache          |
| 静的検証             | ESLint / Prettier |
| ユニットテスト       | Jest / Sinon      |
| API 仕様書           | ReDoc             |
| ローカル実行環境     | ts-node-dev       |

|                           | 使用サービス   |
| ------------------------- | -------------- |
| CI/CD                     | GitHub Actions |
| カバレッジレポート        | Codecov        |
| ホスティング (API サーバ) | Heroku         |
| ホスティング (API 仕様書) | GitHub Pages   |
| データベース              | PostgreSQL     |
| メール配信                | SendGrid       |
