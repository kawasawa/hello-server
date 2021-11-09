import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { Request } from 'express';
import jwt from 'jsonwebtoken';
import util from 'util';

import { constants } from '../constants';
import { dbInstance } from '../db';
import { ACCESS_TOKEN_SECRET, MAIL_SIGNATURE_SECRET, PASSWORD_RESET_TOKEN_SECRET, REFRESH_TOKEN_SECRET } from '../env';
import Auth from '../models/Auth';
import PasswordReset from '../models/PasswordReset';
import User from '../models/User';

// ストレッチングの回数
const SALT_ROUNDS = 10;

/**
 * パスワードをハッシュ化します。
 * @param plainPassword 平文のパスワード
 * @returns ハッシュ化されたパスワード
 */
export const hashPassword = (plainPassword: string) => bcrypt.hashSync(plainPassword, SALT_ROUNDS);

/**
 * ハッシュ化されたパスワードと合致するかどうかを検証します。
 * @param plainPassword 平文のパスワード
 * @param hashedPassword ハッシュ化されたパスワード
 * @returns パスワードの検証結果
 */
export const compareHashPassword = (plainPassword: string, hashedPassword: string) =>
  bcrypt.compare(plainPassword, hashedPassword);

/**
 * 認証トークンを生成します。
 * @param user_id ユーザID
 * @returns 認証トークン
 */
export const createToken = async (user_id: number) => {
  const payload = { id: user_id };
  const refreshToken = jwt.sign(payload, REFRESH_TOKEN_SECRET, {
    expiresIn: constants.value.refreshTokenExpires,
  });
  const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: constants.value.accessTokenExpires,
  });

  await dbInstance.transaction(async (t) => {
    await Auth.destroy({ where: { user_id }, transaction: t });
    await Auth.create({ user_id, token: refreshToken }, { transaction: t });
  });

  console.log(
    util.format(
      constants.log.tokenCreated,
      user_id,
      `${refreshToken.slice(0, 3)}...${refreshToken.slice(-3)}`,
      `${accessToken.slice(0, 3)}...${accessToken.slice(-3)}`
    )
  );
  return { refreshToken, accessToken };
};

/**
 * 本人確認用のURLを生成します。
 * @param req HTTP リクエスト
 * @param user ユーザ
 * @returns URL
 */
export const createIdentifyUrl = (req: Request, user: User) => {
  // 有効期限の設定
  const getExpires = (diff: number) => {
    const expires = new Date();
    expires.setHours(expires.getHours() + diff);
    return expires.getTime();
  };

  // URLの生成
  const hash = crypto.createHash('sha1').update(user.email).digest('hex');
  const expires = getExpires(constants.value.identifyMailExpires);
  const urlFixed = `${constants.url.base}${constants.url.auth.base}${constants.url.auth.identify_verify}/${user.id}/${hash}?expires=${expires}`;
  const signature = crypto
    .createHmac('sha256', MAIL_SIGNATURE_SECRET)
    .update(`${constants.app.name}:${urlFixed}`)
    .digest('hex');
  const urlOrigin = `${req.protocol}://${req.get('host')}`;

  const url = `${urlOrigin}${urlFixed}&signature=${signature}`;
  console.log(util.format(constants.log.identifyUrlCreated, url));
  return url;
};

/**
 * 本人確認用のURLを検証します。
 * @param req リクエスト
 * @param user ユーザ
 * @returns URL
 */
export const verifyIdentifyUrl = (req: Request, user: User) => {
  // 有効期限の検証
  if (Number(req.query.expires) < new Date().getTime()) {
    return false;
  }

  // 署名の検証
  const hash = crypto.createHash('sha1').update(user.email).digest('hex');
  const urlFixed = req.originalUrl.split('&signature=')[0];
  const signature = crypto
    .createHmac('sha256', MAIL_SIGNATURE_SECRET)
    .update(`${constants.app.name}:${urlFixed}`)
    .digest('hex');
  if (req.params.hash != hash || req.query.signature != signature) {
    return false;
  }

  return true;
};

/**
 * パスワード再設定用のURLを生成します。
 * @param req リクエスト
 * @returns URL
 */
export const createResetPasswordUrl = async (req: Request) => {
  // トークンの生成
  const DIGITS = 36;
  const random = Math.random()
    .toFixed(DIGITS)
    .substring(2, DIGITS + 2);
  const token = crypto.createHmac('sha256', PASSWORD_RESET_TOKEN_SECRET).update(random).digest('hex');

  // レコードの生成
  const email = req.body.email;
  await dbInstance.transaction(async (t) => {
    await PasswordReset.destroy({ where: { email }, transaction: t });
    await PasswordReset.create({ email, token }, { transaction: t });
  });

  // URLの生成
  const urlOrigin = `${req.protocol}://${req.get('host')}`;
  const urlFixed = `${constants.url.base}${constants.url.auth.base}${
    constants.url.auth.resetPassword
  }/${token}?email=${encodeURIComponent(email)}`;

  const url = `${urlOrigin}${urlFixed}`;
  console.log(util.format(constants.log.resetPasswordUrlCreated, url));
  return url;
};
