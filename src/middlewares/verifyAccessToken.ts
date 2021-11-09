import Boom from 'boom';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import util from 'util';

import { constants } from '../constants';
import { ACCESS_TOKEN_SECRET } from '../env';
import Auth from '../models/Auth';

/**
 * アクセストークンを検証します。
 * @param req HTTP リクエスト
 * @param res HTTP レスポンス
 * @param next 後続ファンクション
 */
export const verifyAccessToken = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers[constants.value.authHeader];
  if (!token) {
    console.log(req.headers);
    return next(Boom.badRequest(constants.message.error.headerInvalid));
  }

  console.log(
    util.format(
      constants.log.accessTokenRecieved,
      req.method,
      req.originalUrl,
      `${token.slice(0, 3)}...${token.slice(-3)}`
    )
  );

  try {
    // リフレッシュトークンが存在しない場合はログアウトしていると判断
    req.decoded = jwt.verify(String(token), ACCESS_TOKEN_SECRET);
    const auth = await Auth.findOne({ where: { user_id: req.decoded.id } });
    if (!auth) return next(Boom.unauthorized(constants.message.error.accessTokenInvalid));

    return next();
  } catch (err) {
    return next(Boom.unauthorized(constants.message.error.accessTokenInvalid));
  }
};

export default verifyAccessToken;
