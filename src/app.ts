import Boom from 'boom';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import morgan from 'morgan';
import mustacheExpress from 'mustache-express';
import util from 'util';

import { constants } from './constants';
import { APP_NAME, APP_VERSION, IS_PROD, ORIGIN } from './env';
import verifyAccessToken from './middlewares/verifyAccessToken';
import auth from './routes/auth/auth';
import user from './routes/resource/user';

export const initilizeApp = () => {
  const app = express();

  // ログ出力
  app.use(morgan('combined'));

  // JSON パーサの設定
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Cookie パーサの設定
  app.use(cookieParser());

  // CORS 対応
  app.use(cors({ origin: ORIGIN, credentials: true, methods: 'GET,POST,PATCH,DELETE' }));

  // SSL 対応 (本番環境用)
  app.all('*', (req: Request, res: Response, next: NextFunction) => {
    if (!IS_PROD) return next();
    return req.headers['x-forwarded-proto'] === 'http' ? res.redirect('https://' + req.headers.host + req.url) : next();
  });

  // ルーティングの設定
  app.get(`${constants.url.base}${constants.url.version}`, (req: Request, res: Response) =>
    res.status(200).json({ success: true, name: APP_NAME, version: APP_VERSION, isProd: IS_PROD })
  );
  app.use(`${constants.url.base}${constants.url.auth.base}`, auth);
  app.use(`${constants.url.base}${constants.url.resource.user}`, verifyAccessToken, user);
  app.use((req: Request, res: Response, next: NextFunction) =>
    next(Boom.notFound(util.format(constants.message.error.notFound, req?.path)))
  );

  // エラーハンドラの設定
  /* eslint-disable-next-line */
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack ?? err);
    return res
      .status((err.isBoom ? err.output.statusCode : err.statusCode) ?? 500)
      .json({ success: false, message: err.message, errors: err.data });
  });

  // ビューの設定
  app.engine('mst', mustacheExpress());
  app.set('view engine', 'mst');
  app.set('views', `${__dirname}/views`);

  return app;
};
