import { Association, Model, Sequelize } from 'sequelize';
import { mockReq, mockRes } from 'sinon-express-mock';

import { constants } from '../../constants';
import Auth from '../../models/Auth';
import PasswordReset from '../../models/PasswordReset';
import User from '../../models/User';
import {
  COOKIE_NAME_TOKEN,
  COOKIE_OPTION_TOKEN,
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
} from './auth';

let spy_transaction: jest.SpyInstance;
let spy_findByPk: jest.SpyInstance;
let spy_findOne: jest.SpyInstance;
let spy_findOrCreate: jest.SpyInstance;
let spy_update: jest.SpyInstance;
let spy_destroy: jest.SpyInstance;
let spy_hashPassword: jest.SpyInstance;
let spy_compareHashPassword: jest.SpyInstance;
let spy_createToken: jest.SpyInstance;
let spy_createIdentifyUrl: jest.SpyInstance;
let spy_verifyIdentifyUrl: jest.SpyInstance;
let spy_createResetPasswordUrl: jest.SpyInstance;
let spy_sendMail: jest.SpyInstance;

beforeAll(() => {
  User.associations = {
    auth: {} as unknown as Association<User, Auth>,
    passwordReset: {} as unknown as Association<User, PasswordReset>,
  };
});

beforeEach(() => {
  // db
  spy_transaction = jest.spyOn(Sequelize.prototype, 'transaction');
  spy_findByPk = jest.spyOn(Model, 'findByPk');
  spy_findOne = jest.spyOn(Model, 'findOne');
  spy_findOrCreate = jest.spyOn(Model, 'findOrCreate');
  spy_update = jest.spyOn(Model, 'update');
  spy_destroy = jest.spyOn(Model, 'destroy');

  // util
  const util = require('../util');
  spy_hashPassword = jest.spyOn(util, 'hashPassword');
  spy_compareHashPassword = jest.spyOn(util, 'compareHashPassword');
  spy_createToken = jest.spyOn(util, 'createToken');
  spy_createIdentifyUrl = jest.spyOn(util, 'createIdentifyUrl');
  spy_verifyIdentifyUrl = jest.spyOn(util, 'verifyIdentifyUrl');
  spy_createResetPasswordUrl = jest.spyOn(util, 'createResetPasswordUrl');

  // mail
  const mail = require('../mail');
  spy_sendMail = jest.spyOn(mail, 'sendMail');
});

afterEach(() => {
  spy_transaction.mockClear();
  spy_findByPk.mockClear();
  spy_findOne.mockClear();
  spy_findOrCreate.mockClear();
  spy_update.mockClear();
  spy_destroy.mockClear();
  spy_hashPassword.mockClear();
  spy_compareHashPassword.mockClear();
  spy_createToken.mockClear();
  spy_createIdentifyUrl.mockClear();
  spy_verifyIdentifyUrl.mockClear();
  spy_createResetPasswordUrl.mockClear();
  spy_sendMail.mockClear();
});

describe('??????????????????', () => {
  it('?????????', async () => {
    spy_hashPassword.mockReturnValue('TEST_hashedPassword');
    spy_findOrCreate.mockReturnValue(Promise.resolve([{} as unknown as Model, true]));
    spy_createIdentifyUrl.mockReturnValue(Promise.resolve('TEST_url'));
    spy_sendMail.mockReturnValue(Promise.resolve());

    const req = mockReq();
    const res = mockRes();
    const next = jest.fn();
    await signup(req, res, next);

    // ????????????
    expect(spy_hashPassword.mock.calls.length).toBe(1);
    expect(spy_findOrCreate.mock.calls.length).toBe(1);
    expect(spy_createIdentifyUrl.mock.calls.length).toBe(1);
    expect(spy_sendMail.mock.calls.length).toBe(1);
    expect(res.status.args[0][0]).toBe(200);

    // ???????????????
    expect(res.json.args.length).toBe(1);
    expect(Object.keys(res.json.args[0][0]).length).toBe(1);
    expect(res.json.args[0][0].success).toBe(true);
  });

  it('?????????: ???????????????????????????', async () => {
    spy_hashPassword.mockReturnValue('TEST_hashedPassword');
    spy_findOrCreate.mockReturnValue(Promise.resolve([{} as unknown as Model, false]));

    const req = mockReq();
    const res = mockRes();
    const next = jest.fn();
    await signup(req, res, next);

    // ????????????
    expect(spy_hashPassword.mock.calls.length).toBe(1);
    expect(spy_findOrCreate.mock.calls.length).toBe(1);
    expect(next.mock.calls[0][0].output.statusCode).toBe(409);
  });
});

describe('???????????????', () => {
  it('?????????', async () => {
    const testUser = { name: 'TEST_userName', email: 'test@example.com', verified: true };
    const testToken = { refreshToken: 'TEST_refreshToken', accessToken: 'TEST_accessToken' };
    spy_findOne.mockReturnValue(Promise.resolve(testUser as unknown as Model));
    spy_compareHashPassword.mockReturnValue(Promise.resolve(true));
    spy_createToken.mockReturnValue(Promise.resolve(testToken));
    spy_update.mockReturnValue(Promise.resolve());

    const req = mockReq();
    const res = mockRes();
    const next = jest.fn();
    await signin(req, res, next);

    // ????????????
    expect(spy_findOne.mock.calls.length).toBe(1);
    expect(spy_compareHashPassword.mock.calls.length).toBe(1);
    expect(spy_createToken.mock.calls.length).toBe(1);
    expect(spy_update.mock.calls.length).toBe(1);
    expect(res.status.args[0][0]).toBe(200);

    // ????????????
    expect(res.cookie.args.length).toBe(1);
    expect(Object.keys(res.cookie.args[0]).length).toBe(3);
    expect(res.cookie.args[0][0]).toBe(COOKIE_NAME_TOKEN);
    expect(res.cookie.args[0][1]).toBe(testToken.refreshToken);
    expect(res.cookie.args[0][2]).toBe(COOKIE_OPTION_TOKEN);

    // ???????????????
    expect(res.json.args.length).toBe(1);
    expect(Object.keys(res.json.args[0][0]).length).toBe(3);
    expect(res.json.args[0][0].success).toBe(true);
    expect(res.json.args[0][0].token).toBe(testToken.accessToken);
    expect(Object.keys(res.json.args[0][0].user).length).toBe(3);
    expect(res.json.args[0][0].user.name).toBe(testUser.name);
    expect(res.json.args[0][0].user.email).toBe(testUser.email);
    expect(res.json.args[0][0].user.verified).toBe(testUser.verified);
  });

  it('?????????: ???????????????????????????', async () => {
    spy_findOne.mockReturnValue(Promise.resolve(null));

    const req = mockReq();
    const res = mockRes();
    const next = jest.fn();
    await signin(req, res, next);

    // ????????????
    expect(spy_findOne.mock.calls.length).toBe(1);
    expect(next.mock.calls[0][0].output.statusCode).toBe(401);
  });

  it('?????????: ???????????????????????????', async () => {
    spy_findOne.mockReturnValue(Promise.resolve({} as unknown as Model));
    spy_compareHashPassword.mockReturnValue(Promise.resolve(false));

    const req = mockReq();
    const res = mockRes();
    const next = jest.fn();
    await signin(req, res, next);

    // ????????????
    expect(spy_findOne.mock.calls.length).toBe(1);
    expect(spy_compareHashPassword.mock.calls.length).toBe(1);
    expect(next.mock.calls[0][0].output.statusCode).toBe(401);
  });
});

describe('??????????????????', () => {
  it('?????????', async () => {
    spy_destroy.mockReturnValue(Promise.resolve());

    const req = mockReq({ decoded: {} });
    const res = mockRes();
    const next = jest.fn();
    await signout(req, res, next);

    // ????????????
    expect(spy_destroy.mock.calls.length).toBe(1);
    expect(res.status.args[0][0]).toBe(200);

    // ????????????
    expect(res.clearCookie.args.length).toBe(1);
    expect(Object.keys(res.clearCookie.args[0]).length).toBe(2);
    expect(res.clearCookie.args[0][0]).toBe(COOKIE_NAME_TOKEN);
    expect(res.clearCookie.args[0][1]).toBe(COOKIE_OPTION_TOKEN);

    // ???????????????
    expect(res.json.args.length).toBe(1);
    expect(Object.keys(res.json.args[0][0]).length).toBe(1);
    expect(res.json.args[0][0].success).toBe(true);
  });
});

describe('??????', () => {
  it('?????????', async () => {
    const destroy = jest.fn();
    spy_findByPk.mockReturnValue(Promise.resolve({ destroy } as unknown as Model));
    spy_compareHashPassword.mockReturnValue(Promise.resolve(true));
    spy_transaction.mockImplementation((f) => f.call());
    spy_destroy.mockReturnValue(Promise.resolve());

    const req = mockReq({ decoded: {} });
    const res = mockRes();
    const next = jest.fn();
    await withdraw(req, res, next);

    // ????????????
    expect(spy_findByPk.mock.calls.length).toBe(1);
    expect(spy_compareHashPassword.mock.calls.length).toBe(1);
    expect(spy_transaction.mock.calls.length).toBe(1);
    expect(spy_destroy.mock.calls.length).toBe(1);
    expect(destroy.mock.calls.length).toBe(1);
    expect(res.status.args[0][0]).toBe(200);

    // ????????????
    expect(res.clearCookie.args.length).toBe(1);
    expect(Object.keys(res.clearCookie.args[0]).length).toBe(2);
    expect(res.clearCookie.args[0][0]).toBe(COOKIE_NAME_TOKEN);
    expect(res.clearCookie.args[0][1]).toBe(COOKIE_OPTION_TOKEN);

    // ???????????????
    expect(res.json.args.length).toBe(1);
    expect(Object.keys(res.json.args[0][0]).length).toBe(1);
    expect(res.json.args[0][0].success).toBe(true);
  });

  it('?????????: ???????????????????????????', async () => {
    spy_findByPk.mockReturnValue(Promise.resolve(null));

    const req = mockReq({ decoded: {} });
    const res = mockRes();
    const next = jest.fn();
    await withdraw(req, res, next);

    // ????????????
    expect(spy_findByPk.mock.calls.length).toBe(1);
    expect(next.mock.calls[0][0].output.statusCode).toBe(404);
  });

  it('?????????: ???????????????????????????', async () => {
    spy_findByPk.mockReturnValue(Promise.resolve({} as unknown as Model));
    spy_compareHashPassword.mockReturnValue(Promise.resolve(false));

    const req = mockReq({ decoded: {} });
    const res = mockRes();
    const next = jest.fn();
    await withdraw(req, res, next);

    // ????????????
    expect(spy_findByPk.mock.calls.length).toBe(1);
    expect(spy_compareHashPassword.mock.calls.length).toBe(1);
    expect(next.mock.calls[0][0].output.statusCode).toBe(401);
  });
});

describe('??????????????????????????????', () => {
  it('?????????', async () => {
    spy_findByPk.mockReturnValue(Promise.resolve({} as unknown as Model));
    spy_createIdentifyUrl.mockReturnValue(Promise.resolve('TEST_url'));
    spy_sendMail.mockReturnValue(Promise.resolve());

    const req = mockReq({ decoded: {} });
    const res = mockRes();
    const next = jest.fn();
    await sendIdentify(req, res, next);

    // ????????????
    expect(spy_findByPk.mock.calls.length).toBe(1);
    expect(spy_createIdentifyUrl.mock.calls.length).toBe(1);
    expect(spy_sendMail.mock.calls.length).toBe(1);
    expect(res.status.args[0][0]).toBe(200);

    // ???????????????
    expect(res.json.args.length).toBe(1);
    expect(Object.keys(res.json.args[0][0]).length).toBe(1);
    expect(res.json.args[0][0].success).toBe(true);
  });

  it('?????????: ???????????????????????????', async () => {
    spy_findByPk.mockReturnValue(Promise.resolve(null));

    const req = mockReq({ decoded: {} });
    const res = mockRes();
    const next = jest.fn();
    await sendIdentify(req, res, next);

    // ????????????
    expect(spy_findByPk.mock.calls.length).toBe(1);
    expect(next.mock.calls[0][0].output.statusCode).toBe(404);
  });

  it('?????????: ??????????????????????????????', async () => {
    spy_findByPk.mockReturnValue(Promise.resolve({ verified: true } as unknown as Model));

    const req = mockReq({ decoded: {} });
    const res = mockRes();
    const next = jest.fn();
    await sendIdentify(req, res, next);

    // ????????????
    expect(spy_findByPk.mock.calls.length).toBe(1);
    expect(next.mock.calls[0][0].output.statusCode).toBe(403);
  });
});

describe('??????????????????????????????', () => {
  it('?????????', async () => {
    const save = jest.fn();
    spy_findByPk.mockReturnValue(Promise.resolve({ save } as unknown as Model));
    spy_verifyIdentifyUrl.mockReturnValue(true);

    const req = mockReq();
    const res = mockRes();
    const next = jest.fn();
    await verifyIdentify(req, res, next);

    // ????????????
    expect(spy_findByPk.mock.calls.length).toBe(1);
    expect(spy_verifyIdentifyUrl.mock.calls.length).toBe(1);
    expect(save.mock.calls.length).toBe(1);
    expect(res.status.args[0][0]).toBe(201);

    // ???????????????
    expect(res.json.args.length).toBe(1);
    expect(Object.keys(res.json.args[0][0]).length).toBe(2);
    expect(res.json.args[0][0].success).toBe(true);
    expect(typeof res.json.args[0][0].message).toBe('string');
  });

  it('?????????: ???????????????????????????', async () => {
    spy_findByPk.mockReturnValue(Promise.resolve(null));

    const req = mockReq();
    const res = mockRes();
    const next = jest.fn();
    await verifyIdentify(req, res, next);

    // ????????????
    expect(spy_findByPk.mock.calls.length).toBe(1);
    expect(next.mock.calls[0][0].output.statusCode).toBe(401);
  });

  it('?????????: ??????????????????????????????', async () => {
    spy_findByPk.mockReturnValue(Promise.resolve({ verified: true } as unknown as Model));

    const req = mockReq({ decoded: {} });
    const res = mockRes();
    const next = jest.fn();
    await verifyIdentify(req, res, next);

    // ????????????
    expect(spy_findByPk.mock.calls.length).toBe(1);
    expect(res.status.args[0][0]).toBe(204);

    // ???????????????
    expect(res.json.args.length).toBe(1);
    expect(Object.keys(res.json.args[0][0]).length).toBe(2);
    expect(res.json.args[0][0].success).toBe(true);
    expect(typeof res.json.args[0][0].message).toBe('string');
  });

  it('?????????: URL??????????????????', async () => {
    spy_findByPk.mockReturnValue(Promise.resolve({} as unknown as Model));
    spy_verifyIdentifyUrl.mockReturnValue(false);

    const req = mockReq();
    const res = mockRes();
    const next = jest.fn();
    await verifyIdentify(req, res, next);

    // ????????????
    expect(spy_findByPk.mock.calls.length).toBe(1);
    expect(spy_verifyIdentifyUrl.mock.calls.length).toBe(1);
    expect(next.mock.calls[0][0].output.statusCode).toBe(401);
  });
});

describe('??????????????????????????????????????????', () => {
  it('?????????', async () => {
    spy_findOne.mockReturnValue(Promise.resolve({} as unknown as Model));
    spy_createResetPasswordUrl.mockReturnValue(Promise.resolve('TEST_url'));
    spy_sendMail.mockReturnValue(Promise.resolve());

    const req = mockReq();
    const res = mockRes();
    const next = jest.fn();
    await sendResetPassword(req, res, next);

    // ????????????
    expect(spy_findOne.mock.calls.length).toBe(1);
    expect(spy_createResetPasswordUrl.mock.calls.length).toBe(1);
    expect(spy_sendMail.mock.calls.length).toBe(1);
    expect(res.status.args[0][0]).toBe(200);

    // ???????????????
    expect(res.json.args.length).toBe(1);
    expect(Object.keys(res.json.args[0][0]).length).toBe(1);
    expect(res.json.args[0][0].success).toBe(true);
  });

  it('?????????: ???????????????????????????', async () => {
    spy_findOne.mockReturnValue(Promise.resolve(null));

    const req = mockReq();
    const res = mockRes();
    const next = jest.fn();
    await sendResetPassword(req, res, next);

    // ????????????
    expect(spy_findOne.mock.calls.length).toBe(1);
    expect(next.mock.calls[0][0].output.statusCode).toBe(401);
  });
});

describe('?????????????????????????????????????????????', () => {
  it('?????????', async () => {
    const query = { email: 'TEST_email' };
    const params = { token: 'TEST_token' };
    spy_findOne.mockReturnValue(Promise.resolve(params as unknown as Model));

    const req = mockReq({ params, query });
    const res = mockRes();
    const next = jest.fn();
    await renderResetPassword(req, res, next);

    // ????????????
    expect(spy_findOne.mock.calls.length).toBe(1);
    expect(res.status.args[0][0]).toBe(200);

    // ???????????????
    expect(res.render.args.length).toBe(1);
    expect(Object.keys(res.render.args[0]).length).toBe(2);
    expect(res.render.args[0][0]).toBe(constants.url.form.resetPassword);
    expect(res.render.args[0][1].token).toBe(params.token);
    expect(res.render.args[0][1].email).toBe(query.email);
    expect(res.render.args[0][1].constants).toBe(constants);
  });

  it('?????????: ???????????????????????????', async () => {
    spy_findOne.mockReturnValue(Promise.resolve(null));

    const req = mockReq();
    const res = mockRes();
    const next = jest.fn();
    await renderResetPassword(req, res, next);

    // ????????????
    expect(spy_findOne.mock.calls.length).toBe(1);
    expect(next.mock.calls[0][0].output.statusCode).toBe(401);
  });

  it('?????????: ???????????????????????????????????????????????????', async () => {
    spy_findOne.mockReturnValue(Promise.resolve({ token: 'TEST_token1' } as unknown as Model));

    const req = mockReq({ params: { token: 'TEST_token2' } });
    const res = mockRes();
    const next = jest.fn();
    await renderResetPassword(req, res, next);

    // ????????????
    expect(spy_findOne.mock.calls.length).toBe(1);
    expect(next.mock.calls[0][0].output.statusCode).toBe(401);
  });
});

describe('????????????????????????', () => {
  it('?????????', async () => {
    const destroy = jest.fn();
    const save = jest.fn();
    const passwordReset = { token: 'TEST_token', destroy };
    const user = { password: 'TEST_oldPassword', passwordReset, save };
    spy_findOne.mockReturnValue(Promise.resolve(user as unknown as Model));

    const newPassword = 'TEST_hashedPassword';
    spy_hashPassword.mockReturnValue(newPassword);
    spy_transaction.mockImplementation((f) => f.call());

    const req = mockReq({ body: passwordReset });
    const res = mockRes();
    const next = jest.fn();
    await resetPassword(req, res, next);

    // ????????????
    expect(spy_hashPassword.mock.calls.length).toBe(1);
    expect(spy_findOne.mock.calls.length).toBe(1);
    expect(spy_transaction.mock.calls.length).toBe(1);
    expect(destroy.mock.calls.length).toBe(1);
    expect(save.mock.calls.length).toBe(1);
    expect(user.password).toBe(newPassword);
    expect(res.status.args[0][0]).toBe(200);

    // ???????????????
    expect(res.json.args.length).toBe(1);
    expect(Object.keys(res.json.args[0][0]).length).toBe(1);
    expect(res.json.args[0][0].success).toBe(true);
  });

  it('?????????: ???????????????????????????', async () => {
    spy_findOne.mockReturnValue(Promise.resolve(null));
    spy_hashPassword.mockReturnValue('TEST_hashedPassword');

    const req = mockReq();
    const res = mockRes();
    const next = jest.fn();
    await resetPassword(req, res, next);

    // ????????????
    expect(spy_hashPassword.mock.calls.length).toBe(1);
    expect(spy_findOne.mock.calls.length).toBe(1);
    expect(next.mock.calls[0][0].output.statusCode).toBe(401);
  });

  it('?????????: ?????????????????????????????????????????????????????????', async () => {
    spy_findOne.mockReturnValue(Promise.resolve({} as unknown as Model));
    spy_hashPassword.mockReturnValue('TEST_hashedPassword');

    const req = mockReq();
    const res = mockRes();
    const next = jest.fn();
    await resetPassword(req, res, next);

    // ????????????
    expect(spy_hashPassword.mock.calls.length).toBe(1);
    expect(spy_findOne.mock.calls.length).toBe(1);
    expect(next.mock.calls[0][0].output.statusCode).toBe(401);
  });

  it('?????????: ???????????????????????????????????????????????????', async () => {
    spy_findOne.mockReturnValue(Promise.resolve({ passwordReset: { token: 'TEST_token1' } } as unknown as Model));
    spy_hashPassword.mockReturnValue('TEST_hashedPassword');

    const req = mockReq({ body: { token: 'TEST_token2' } });
    const res = mockRes();
    const next = jest.fn();
    await resetPassword(req, res, next);

    // ????????????
    expect(spy_hashPassword.mock.calls.length).toBe(1);
    expect(spy_findOne.mock.calls.length).toBe(1);
    expect(next.mock.calls[0][0].output.statusCode).toBe(401);
  });
});

describe('??????????????????', () => {
  it('?????????', async () => {
    const testToken = { refreshToken: 'TEST_refreshToken', accessToken: 'TEST_accessToken' };
    spy_createToken.mockReturnValue(Promise.resolve(testToken));

    const req = mockReq({ decoded: {} });
    const res = mockRes();
    const next = jest.fn();
    await refresh(req, res, next);

    // ????????????
    expect(spy_createToken.mock.calls.length).toBe(1);
    expect(res.status.args[0][0]).toBe(200);

    // ????????????
    expect(res.cookie.args.length).toBe(1);
    expect(Object.keys(res.cookie.args[0]).length).toBe(3);
    expect(res.cookie.args[0][0]).toBe(COOKIE_NAME_TOKEN);
    expect(res.cookie.args[0][1]).toBe(testToken.refreshToken);
    expect(res.cookie.args[0][2]).toBe(COOKIE_OPTION_TOKEN);

    // ???????????????
    expect(res.json.args.length).toBe(1);
    expect(Object.keys(res.json.args[0][0]).length).toBe(2);
    expect(res.json.args[0][0].success).toBe(true);
    expect(res.json.args[0][0].token).toBe(testToken.accessToken);
  });
});
