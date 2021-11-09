import Boom from 'boom';
import { CookieOptions, NextFunction, Request, Response } from 'express';
import util from 'util';

import { constants } from '../../constants';
import { dbInstance, dbNow } from '../../db';
import Auth from '../../models/Auth';
import PasswordReset from '../../models/PasswordReset';
import User from '../../models/User';
import { sendMail } from '../mail';
import {
  compareHashPassword,
  createIdentifyUrl,
  createResetPasswordUrl,
  createToken,
  hashPassword,
  verifyIdentifyUrl,
} from '../util';

// cookie の設定
export const COOKIE_NAME_TOKEN = 'token';
export const COOKIE_OPTION_TOKEN: CookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  path: `${constants.url.base}${constants.url.auth.base}${constants.url.auth.refresh}`,
};

/**
 * サインアップします。
 * @param req HTTP リクエスト
 * @param res HTTP レスポンス
 * @param next 後続ファンクション
 * @returns HTTP レスポンス
 */
export const signup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const name = req.body.name;
    const email = req.body.email;
    const password = hashPassword(req.body.password);

    const [user, created] = await User.findOrCreate({
      where: { email },
      defaults: { name, email, password },
    });
    if (!created) return next(Boom.conflict(constants.message.error.emailUsed));

    const url = createIdentifyUrl(req, user);
    await sendMail({
      to: user.email,
      subject: constants.message.info.identifyMailSubject,
      html: util.format(constants.message.info.identifyMailHtml, user.name, url, constants.value.identifyMailExpires),
    });
    return res.status(200).json({ success: true });
  } catch (err) {
    return next(err);
  }
};

/**
 * サインインします。
 * @param req HTTP リクエスト
 * @param res HTTP レスポンス
 * @param next 後続ファンクション
 * @returns HTTP レスポンス
 */
export const signin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const email = req.body.email;
    const user = await User.findOne({ where: { email } });
    if (!user) return next(Boom.unauthorized(constants.message.error.credentialInvalid));

    const password = req.body.password;
    const isCorrect = await compareHashPassword(password, user.password);
    if (!isCorrect) return next(Boom.unauthorized(constants.message.error.credentialInvalid));

    const { refreshToken, accessToken } = await createToken(user.id);
    await User.update({ signedin_at: dbNow }, { where: { id: user.id } });

    return res
      .status(200)
      .cookie(COOKIE_NAME_TOKEN, refreshToken, COOKIE_OPTION_TOKEN)
      .json({
        success: true,
        token: accessToken,
        user: { name: user.name, email: user.email, verified: user.verified },
      });
  } catch (err) {
    return next(err);
  }
};

/**
 * サインアウトします。
 * @param req HTTP リクエスト
 * @param res HTTP レスポンス
 * @param next 後続ファンクション
 * @returns HTTP レスポンス
 */
export const signout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await Auth.destroy({ where: { user_id: req.decoded.id } });
    return res.status(200).clearCookie(COOKIE_NAME_TOKEN, COOKIE_OPTION_TOKEN).json({ success: true });
  } catch (err) {
    return next(err);
  }
};

/**
 * アカウントを削除します。
 * @param req HTTP リクエスト
 * @param res HTTP レスポンス
 * @param next 後続ファンクション
 * @returns HTTP レスポンス
 */
export const withdraw = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findByPk(req.decoded.id);
    if (!user) return next(Boom.notFound(constants.message.error.dataNotFound));

    const password = req.body.password;
    const isCorrect = await compareHashPassword(password, user.password);
    if (!isCorrect) return next(Boom.unauthorized(constants.message.error.credentialInvalid));

    await dbInstance.transaction(async (t) => {
      await Auth.destroy({ where: { user_id: req.decoded.id }, transaction: t });
      await user.destroy({ transaction: t });
    });

    return res.status(200).clearCookie(COOKIE_NAME_TOKEN, COOKIE_OPTION_TOKEN).json({ success: true });
  } catch (err) {
    return next(err);
  }
};

/**
 * 本人確認メールを送信します。
 * @param req HTTP リクエスト
 * @param res HTTP レスポンス
 * @param next 後続ファンクション
 * @returns HTTP レスポンス
 */
export const sendIdentify = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findByPk(req.decoded.id);
    if (!user) return next(Boom.notFound(constants.message.error.dataNotFound));
    if (user.verified) return next(Boom.forbidden(constants.message.info.accountVerifiedAlready));

    const url = createIdentifyUrl(req, user);
    await sendMail({
      to: user.email,
      subject: constants.message.info.identifyMailSubject,
      html: util.format(constants.message.info.identifyMailHtml, user.name, url, constants.value.identifyMailExpires),
    });
    return res.status(200).json({ success: true });
  } catch (err) {
    return next(err);
  }
};

/**
 * 本人確認メールを検証します。
 * @param req HTTP リクエスト
 * @param res HTTP レスポンス
 * @param next 後続ファンクション
 * @returns HTTP レスポンス
 */
export const verifyIdentify = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return next(Boom.unauthorized(constants.message.error.urlInvalid));
    if (user.verified)
      return res.status(204).json({ success: true, message: constants.message.info.accountVerifiedAlready });
    if (!verifyIdentifyUrl(req, user)) return next(Boom.unauthorized(constants.message.error.urlInvalid));

    user.verified = true;
    await user.save();
    return res.status(201).json({ success: true, message: constants.message.info.accountVerified });
  } catch (err) {
    return next(err);
  }
};

/**
 * パスワード再設定リンクを送信します。
 * @param req HTTP リクエスト
 * @param res HTTP レスポンス
 * @param next 後続ファンクション
 * @returns HTTP レスポンス
 */
export const sendResetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const email = req.body.email;
    const user = await User.findOne({ where: { email } });
    if (!user) return next(Boom.unauthorized(constants.message.error.emailNotFound));

    const url = await createResetPasswordUrl(req);
    await sendMail({
      to: user.email,
      subject: constants.message.info.resetPasswordMailSubject,
      html: util.format(
        constants.message.info.resetPasswordMailHtml,
        user.name,
        url,
        constants.value.resetPasswordMailExpires
      ),
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    return next(err);
  }
};

/**
 * パスワード再設定フォームを表示します。
 * @param req HTTP リクエスト
 * @param res HTTP レスポンス
 * @param next 後続ファンクション
 * @returns HTTP レスポンス
 */
export const renderResetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const email = req.query.email;
    const passwordResetToken = req.params.token;

    const passwordReset = await PasswordReset.findOne({ where: { email } });
    if (!passwordReset || passwordReset.token != passwordResetToken)
      return next(Boom.unauthorized(constants.message.error.resetPasswordTokenInvalid));

    return res.status(200).render(constants.url.form.resetPassword, {
      token: passwordResetToken,
      email,
      constants: constants,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * パスワードを再設定します。
 * @param req HTTP リクエスト
 * @param res HTTP レスポンス
 * @param next 後続ファンクション
 * @returns HTTP レスポンス
 */
export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const email = req.body.email;
    const password = hashPassword(req.body.password);
    const passwordResetToken = req.body.token;

    const user = await User.findOne({ where: { email }, include: User.associations.passwordReset });
    if (!user) return next(Boom.unauthorized(constants.message.error.emailNotFound));
    if (!user.passwordReset || user.passwordReset.token != passwordResetToken)
      return next(Boom.unauthorized(constants.message.error.resetPasswordTokenInvalid));

    user.password = password;
    await dbInstance.transaction(async (t) => {
      await user.passwordReset?.destroy({ transaction: t });
      await user.save({ transaction: t });
    });
    return res.status(200).json({ success: true });
  } catch (err) {
    return next(err);
  }
};

/**
 * 認証トークンを再生成します。
 * @param req HTTP リクエスト
 * @param res HTTP レスポンス
 * @param next 後続ファンクション
 * @returns HTTP レスポンス
 */
export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken, accessToken } = await createToken(req.decoded.id);
    return res
      .status(200)
      .cookie(COOKIE_NAME_TOKEN, refreshToken, COOKIE_OPTION_TOKEN)
      .json({ success: true, token: accessToken });
  } catch (err) {
    return next(err);
  }
};
