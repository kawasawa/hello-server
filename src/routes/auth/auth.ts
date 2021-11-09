import express from 'express';
import { check } from 'express-validator';
import util from 'util';

import { constants } from '../../constants';
import {
  refresh,
  renderResetPassword,
  resetPassword,
  sendIdentify,
  sendResetPassword,
  signin,
  signout,
  signup,
  verifyIdentify,
  withdraw,
} from '../../functions/auth/auth';
import verifyAccessToken from '../../middlewares/verifyAccessToken';
import verifyRefreshToken from '../../middlewares/verifyRefreshToken';
import verifyValidationResult from '../../middlewares/verifyValidationResult';

const router = express.Router();

/**
 * サインアップ
 */
router.post(
  constants.url.auth.signup,
  [
    check('name')
      .not()
      .isEmpty()
      .withMessage(constants.message.error.checkIsEmpty)
      .isLength({ max: 255 })
      .withMessage(util.format(constants.message.error.checkIsLengthMax, 255)),
    check('email')
      .not()
      .isEmpty()
      .withMessage(constants.message.error.checkIsEmpty)
      .isLength({ max: 255 })
      .withMessage(util.format(constants.message.error.checkIsLengthMax, 255))
      .isEmail()
      .withMessage(constants.message.error.emailFormat),
    check('password')
      .not()
      .isEmpty()
      .withMessage(constants.message.error.checkIsEmpty)
      .isLength({ max: 255 })
      .withMessage(util.format(constants.message.error.checkIsLengthMax, 255))
      .matches(constants.value.passwordRule)
      .withMessage(constants.message.error.passwordFormat),
  ],
  verifyValidationResult,
  signup
);

/**
 * サインイン
 */
router.post(
  constants.url.auth.signin,
  [
    check('email').not().isEmpty().withMessage(constants.message.error.checkIsEmpty),
    check('password').not().isEmpty().withMessage(constants.message.error.checkIsEmpty),
  ],
  verifyValidationResult,
  signin
);

/**
 * サインアウト
 */
router.post(constants.url.auth.signout, verifyAccessToken, signout);

/**
 * 退会
 */
router.delete(
  constants.url.auth.withdraw,
  verifyAccessToken,
  [check('password').not().isEmpty().withMessage(constants.message.error.checkIsEmpty)],
  verifyValidationResult,
  withdraw
);

/**
 * 本人確認メール送信
 */
router.post(constants.url.auth.identify, verifyAccessToken, sendIdentify);

/**
 * 本人確認メール検証
 */
router.get(`${constants.url.auth.identify_verify}/:id/:hash`, verifyIdentify);

/**
 * パスワード再設定リンク送信
 */
router.post(
  constants.url.auth.resetPassword,
  [check('email').not().isEmpty().withMessage(constants.message.error.checkIsEmpty)],
  verifyValidationResult,
  sendResetPassword
);

/**
 * パスワード再設定フォームの表示
 */
router.get(`${constants.url.auth.resetPassword}/:token`, renderResetPassword);

/**
 * パスワード再設定
 */
router.post(
  constants.url.auth.resetPassword_verify,
  [
    check('token').not().isEmpty().withMessage(constants.message.error.checkIsEmpty),
    check('email').not().isEmpty().withMessage(constants.message.error.checkIsEmpty),
    check('password')
      .not()
      .isEmpty()
      .withMessage(constants.message.error.checkIsEmpty)
      .isLength({ max: 255 })
      .withMessage(util.format(constants.message.error.checkIsLengthMax, 255))
      .matches(constants.value.passwordRule)
      .withMessage(constants.message.error.passwordFormat),
    check('passwordConfirmation')
      .not()
      .isEmpty()
      .withMessage(constants.message.error.checkIsEmpty)
      .custom((value, { req }) => {
        if (value !== req.body.password) throw new Error();
        return true;
      })
      .withMessage(constants.message.error.passwordMismatch),
  ],
  verifyValidationResult,
  resetPassword
);

/**
 * 認証トークン更新
 */
router.get(constants.url.auth.refresh, verifyRefreshToken, refresh);

export default router;
