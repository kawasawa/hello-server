import { Model } from 'sequelize';
import { mockReq, mockRes } from 'sinon-express-mock';

import { read, update } from './user';

let spy_findByPk: jest.SpyInstance;
let spy_createIdentifyUrl: jest.SpyInstance;
let spy_sendMail: jest.SpyInstance;

beforeEach(() => {
  // db
  spy_findByPk = jest.spyOn(Model, 'findByPk');

  // util
  const util = require('../util');
  spy_createIdentifyUrl = jest.spyOn(util, 'createIdentifyUrl');

  // mail
  const mail = require('../mail');
  spy_sendMail = jest.spyOn(mail, 'sendMail');
});

afterEach(() => {
  spy_findByPk.mockClear();
  spy_createIdentifyUrl.mockClear();
  spy_sendMail.mockClear();
});

describe('ユーザ情報の取得', () => {
  it('正常系', async () => {
    const testUser = { name: 'TEST_userName', email: 'test@example.com', verified: true };
    spy_findByPk.mockReturnValue(Promise.resolve(testUser as unknown as Model));

    const req = mockReq({ decoded: {} });
    const res = mockRes();
    const next = jest.fn();
    await read(req, res, next);

    // 処理結果
    expect(spy_findByPk.mock.calls.length).toBe(1);
    expect(res.status.args[0][0]).toBe(200);

    // レスポンス
    expect(res.json.args.length).toBe(1);
    expect(Object.keys(res.json.args[0][0]).length).toBe(2);
    expect(res.json.args[0][0].success).toBe(true);
    expect(Object.keys(res.json.args[0][0].user).length).toBe(3);
    expect(res.json.args[0][0].user.name).toBe(testUser.name);
    expect(res.json.args[0][0].user.email).toBe(testUser.email);
    expect(res.json.args[0][0].user.verified).toBe(testUser.verified);
  });

  it('異常系: レコード取得エラー', async () => {
    spy_findByPk.mockReturnValue(Promise.resolve(null));

    const req = mockReq({ decoded: {} });
    const res = mockRes();
    const next = jest.fn();
    await read(req, res, next);

    // 処理結果
    expect(spy_findByPk.mock.calls.length).toBe(1);
    expect(next.mock.calls[0][0].output.statusCode).toBe(404);
  });
});

describe('ユーザ情報の更新', () => {
  it('正常系: メールアドレスの変更あり', async () => {
    const save = jest.fn();
    const testUser = { name: 'old_userName', email: 'old_test@example.com', verified: true, save };
    save.mockReturnValue(Promise.resolve(testUser as unknown as Model));
    spy_findByPk.mockReturnValue(Promise.resolve(testUser as unknown as Model));
    spy_createIdentifyUrl.mockReturnValue(Promise.resolve('TEST_url'));
    spy_sendMail.mockReturnValue(Promise.resolve());
    const body = { name: 'new_userName', email: 'new_test@example.com' };

    const req = mockReq({ body, decoded: {} });
    const res = mockRes();
    const next = jest.fn();
    await update(req, res, next);

    // 処理結果
    expect(spy_findByPk.mock.calls.length).toBe(1);
    expect(save.mock.calls.length).toBe(1);
    expect(spy_createIdentifyUrl.mock.calls.length).toBe(1);
    expect(spy_sendMail.mock.calls.length).toBe(1);
    expect(res.status.args[0][0]).toBe(200);

    // レスポンス
    expect(res.json.args.length).toBe(1);
    expect(Object.keys(res.json.args[0][0]).length).toBe(2);
    expect(res.json.args[0][0].success).toBe(true);
    expect(Object.keys(res.json.args[0][0].user).length).toBe(3);
    expect(res.json.args[0][0].user.name).toBe(body.name);
    expect(res.json.args[0][0].user.email).toBe(body.email);
    expect(res.json.args[0][0].user.verified).toBe(false);
  });

  it('正常系: メールアドレスの変更なし', async () => {
    const save = jest.fn();
    const testUser = { name: 'old_userName', email: 'test@example.com', verified: true, save };
    save.mockReturnValue(Promise.resolve(testUser as unknown as Model));
    spy_findByPk.mockReturnValue(Promise.resolve(testUser as unknown as Model));
    const body = { name: 'new_userName', email: 'test@example.com' };

    const req = mockReq({ body, decoded: {} });
    const res = mockRes();
    const next = jest.fn();
    await update(req, res, next);

    // 処理結果
    expect(spy_findByPk.mock.calls.length).toBe(1);
    expect(save.mock.calls.length).toBe(1);
    expect(res.status.args[0][0]).toBe(200);

    // レスポンス
    expect(res.json.args.length).toBe(1);
    expect(Object.keys(res.json.args[0][0]).length).toBe(2);
    expect(res.json.args[0][0].success).toBe(true);
    expect(Object.keys(res.json.args[0][0].user).length).toBe(3);
    expect(res.json.args[0][0].user.name).toBe(body.name);
    expect(res.json.args[0][0].user.email).toBe(body.email);
    expect(res.json.args[0][0].user.verified).toBe(true);
  });

  it('異常系: レコード取得エラー', async () => {
    spy_findByPk.mockReturnValue(Promise.resolve(null));

    const req = mockReq({ decoded: {} });
    const res = mockRes();
    const next = jest.fn();
    await update(req, res, next);

    // 処理結果
    expect(spy_findByPk.mock.calls.length).toBe(1);
    expect(next.mock.calls[0][0].output.statusCode).toBe(404);
  });
});
