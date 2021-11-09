import Boom from 'boom';
import { NextFunction, Request, Response } from 'express';
import util from 'util';

import { constants } from '../../constants';
import User from '../../models/User';
import { sendMail } from '../mail';
import { createIdentifyUrl } from '../util';

/**
 * ユーザ情報を取得します。
 * @param req HTTP リクエスト
 * @param res HTTP レスポンス
 * @param next 後続ファンクション
 * @returns HTTP レスポンス
 */
export const read = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findByPk(req.decoded.id);
    if (!user) return next(Boom.notFound(constants.message.error.dataNotFound));

    return res
      .status(200)
      .json({ success: true, user: { name: user.name, email: user.email, verified: user.verified } });
  } catch (err) {
    return next(err);
  }
};

/**
 * ユーザ情報を更新します。
 * メールアドレスが変更された場合は本人確認メールが送信されます。
 * @param req HTTP リクエスト
 * @param res HTTP レスポンス
 * @param next 後続ファンクション
 * @returns HTTP レスポンス
 */
export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findByPk(req.decoded.id);
    if (!user) return next(Boom.notFound(constants.message.error.dataNotFound));

    const emailUpdated = user.email !== req.body.email;
    user.name = req.body.name;
    user.email = req.body.email;
    if (emailUpdated) user.verified = false;
    const savedUser = await user.save();

    if (emailUpdated) {
      const url = createIdentifyUrl(req, savedUser);
      await sendMail({
        to: savedUser.email,
        subject: constants.message.info.identifyMailSubject,
        html: util.format(
          constants.message.info.identifyMailHtml,
          savedUser.name,
          url,
          constants.value.identifyMailExpires
        ),
      });
    }

    return res
      .status(200)
      .json({ success: true, user: { name: savedUser.name, email: savedUser.email, verified: savedUser.verified } });
  } catch (err) {
    return next(err);
  }
};
