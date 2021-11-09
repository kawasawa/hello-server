import jwt from 'jsonwebtoken';
import { Model } from 'sequelize';
import { mockReq, mockRes } from 'sinon-express-mock';

import { verifyRefreshToken } from './verifyRefreshToken';

let spy_jwt_verify: jest.SpyInstance;
let spy_findOne: jest.SpyInstance;

beforeEach(() => {
  spy_jwt_verify = jest.spyOn(jwt, 'verify');
  spy_findOne = jest.spyOn(Model, 'findOne');
});

afterEach(() => {
  spy_jwt_verify.mockClear();
  spy_findOne.mockClear();
});

describe('リフレッシュトークンの検証', () => {
  it('正常系', async () => {
    const userId = 1;
    spy_jwt_verify.mockReturnValue({ id: userId });
    spy_findOne.mockReturnValue(Promise.resolve({} as unknown as Model));

    const req = mockReq({ cookies: { token: 'TEST_token' } });
    const res = mockRes();
    const next = jest.fn();
    await verifyRefreshToken(req, res, next);

    // 処理結果
    expect(spy_jwt_verify.mock.calls.length).toBe(1);
    expect(spy_findOne.mock.calls.length).toBe(1);
    expect((req as unknown as any).decoded.id).toBe(userId);
    expect(next.mock.calls[0][0]).toBe(undefined);
  });

  it('異常系: トークン取得エラー', async () => {
    const req = mockReq({ cookies: {} });
    const res = mockRes();
    const next = jest.fn();
    await verifyRefreshToken(req, res, next);

    // 処理結果
    expect(next.mock.calls[0][0].output.statusCode).toBe(401);
  });

  it('異常系: レコード取得エラー', async () => {
    const userId = 1;
    spy_jwt_verify.mockReturnValue({ id: userId });
    spy_findOne.mockReturnValue(Promise.resolve(null));

    const req = mockReq({ cookies: { token: 'TEST_token' } });
    const res = mockRes();
    const next = jest.fn();
    await verifyRefreshToken(req, res, next);

    // 処理結果
    expect(spy_jwt_verify.mock.calls.length).toBe(1);
    expect(spy_findOne.mock.calls.length).toBe(1);
    expect((req as unknown as any).decoded.id).toBe(userId);
    expect(next.mock.calls[0][0].output.statusCode).toBe(401);
  });
});
