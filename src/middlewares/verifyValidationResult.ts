import Boom from 'boom';
import { NextFunction, Request, Response } from 'express';
import { validationResult } from 'express-validator';
import util from 'util';

import { constants } from '../constants';

/**
 * パラメータバリデーションの結果を検証します。
 * @param req HTTP リクエスト
 * @param res HTTP レスポンス
 * @param next 後続ファンクション
 */
export const verifyValidationResult = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      Boom.badRequest(
        errors
          .array()
          .map((e) => `${e.param}: ${e.msg}`)
          .join(', '),
        errors.array()
      )
    );
  }

  console.log(
    util.format(constants.log.parametersVerified, req.method, req.originalUrl, Object.keys(req.body).join(', '))
  );
  return next();
};

export default verifyValidationResult;
