import Boom from 'boom';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import util from 'util';

import { constants } from '../constants';
import { REFRESH_TOKEN_SECRET } from '../env';
import Auth from '../models/Auth';

/**
 * リフレッシュトークンを検証します。
 * @param req HTTP リクエスト
 * @param res HTTP レスポンス
 * @param next 後続ファンクション
 */
export const verifyRefreshToken = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.token;
  if (!token) {
    console.log(req.cookies);
    return next(Boom.unauthorized(constants.message.error.refreshTokenEmpty));
  }
  console.log(
    util.format(
      constants.log.refreshTokenRecieved,
      req.method,
      req.originalUrl,
      `${token.slice(0, 3)}...${token.slice(-3)}`
    )
  );

  try {
    req.decoded = jwt.verify(token, REFRESH_TOKEN_SECRET);
    const auth = await Auth.findOne({ where: { user_id: req.decoded.id, token } });
    if (!auth) return next(Boom.unauthorized(constants.message.error.refreshTokenInvalid));

    return next();
  } catch (err) {
    return next(Boom.unauthorized(constants.message.error.refreshTokenInvalid));
  }
};

export default verifyRefreshToken;
