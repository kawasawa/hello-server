import bcrypt from 'bcrypt';
import crypto, { Hash, Hmac } from 'crypto';
import jwt from 'jsonwebtoken';
import { Model, Sequelize } from 'sequelize';
import { mockReq } from 'sinon-express-mock';

import { constants } from '../constants';
import User from '../models/User';

import {
  compareHashPassword,
  createIdentifyUrl,
  createResetPasswordUrl,
  createToken,
  hashPassword,
  verifyIdentifyUrl,
} from './util';

let spy_bcrypt_hashSync: jest.SpyInstance;
let spy_bcrypt_compare: jest.SpyInstance;
let spy_crypto_createHash: jest.SpyInstance;
let spy_crypto_createHmac: jest.SpyInstance;
let spy_jwt_sign: jest.SpyInstance;
let spy_encodeURIComponent: jest.SpyInstance;
let spy_getTime: jest.SpyInstance;
let spy_transaction: jest.SpyInstance;
let spy_create: jest.SpyInstance;
let spy_destroy: jest.SpyInstance;

beforeEach(() => {
  spy_bcrypt_hashSync = jest.spyOn(bcrypt, 'hashSync');
  spy_bcrypt_compare = jest.spyOn(bcrypt, 'compare');
  spy_crypto_createHash = jest.spyOn(crypto, 'createHash');
  spy_crypto_createHmac = jest.spyOn(crypto, 'createHmac');
  spy_jwt_sign = jest.spyOn(jwt, 'sign');
  spy_encodeURIComponent = jest.spyOn(global, 'encodeURIComponent');
  spy_getTime = jest.spyOn(Date.prototype, 'getTime');
  spy_transaction = jest.spyOn(Sequelize.prototype, 'transaction');
  spy_create = jest.spyOn(Model, 'create');
  spy_destroy = jest.spyOn(Model, 'destroy');
});

afterEach(() => {
  spy_bcrypt_hashSync.mockClear();
  spy_bcrypt_compare.mockClear();
  spy_crypto_createHmac.mockClear();
  spy_crypto_createHash.mockClear();
  spy_jwt_sign.mockClear();
  spy_encodeURIComponent.mockClear();
  spy_getTime.mockClear();
  spy_transaction.mockClear();
  spy_create.mockClear();
  spy_destroy.mockClear();
});

describe('パスワードのハッシュ', () => {
  it('正常系', () => {
    const hashedPassword = 'hashedPassword';
    spy_bcrypt_hashSync.mockReturnValue(hashedPassword);

    const result = hashPassword('plainPassword');

    // 処理結果
    expect(spy_bcrypt_hashSync.mock.calls.length).toBe(1);
    expect(result).toBe(hashedPassword);
  });
});

describe('ハッシュ化されたパスワードの比較', () => {
  it('正常系', async () => {
    spy_bcrypt_compare.mockReturnValue(Promise.resolve(true));

    const result = await compareHashPassword('plainPassword', 'hashedPassword');

    // 処理結果
    expect(spy_bcrypt_compare.mock.calls.length).toBe(1);
    expect(result).toBe(true);
  });

  it('異常系: パスワードの不一致', async () => {
    spy_bcrypt_compare.mockReturnValue(Promise.resolve(false));

    const result = await compareHashPassword('plainPassword', 'hashedPassword');

    // 処理結果
    expect(spy_bcrypt_compare.mock.calls.length).toBe(1);
    expect(result).toBe(false);
  });
});

describe('認証トークンの生成', () => {
  it('正常系', async () => {
    spy_jwt_sign.mockImplementation((payload, secretOrPrivateKey, options) => String(options?.expiresIn));
    spy_transaction.mockImplementation((f) => f.call());
    spy_create.mockReturnValue(Promise.resolve());
    spy_destroy.mockReturnValue(Promise.resolve());

    const { refreshToken, accessToken } = await createToken(1);

    // 処理結果
    expect(spy_jwt_sign.mock.calls.length).toBe(2);
    expect(spy_transaction.mock.calls.length).toBe(1);
    expect(spy_create.mock.calls.length).toBe(1);
    expect(spy_destroy.mock.calls.length).toBe(1);
    expect(refreshToken).toBe(constants.value.refreshTokenExpires);
    expect(accessToken).toBe(constants.value.accessTokenExpires);
  });
});

describe('本人確認用URLの生成', () => {
  it('正常系', () => {
    const protocol = 'https';
    const host = 'example.com';
    const hash = 'TEST_hash';
    const signature = 'TEST_signature';
    const userId = 123456;
    const expires = 1;

    spy_getTime.mockReturnValue(expires);
    const hash_digest = jest.fn().mockReturnValue(hash);
    const hash_update = jest.fn().mockReturnValue({ digest: hash_digest } as unknown as Hash);
    spy_crypto_createHash.mockReturnValue({ update: hash_update } as unknown as Hash);
    const hmac_digest = jest.fn().mockReturnValue(signature);
    const hmac_update = jest.fn().mockReturnValue({ digest: hmac_digest } as unknown as Hmac);
    spy_crypto_createHmac.mockReturnValue({ update: hmac_update } as unknown as Hmac);
    const get = jest.fn().mockImplementation((name: string) => {
      switch (name) {
        case 'host':
          return host;
        default:
          throw new Error();
      }
    });

    const req = mockReq({ protocol, get });
    const url = createIdentifyUrl(req, { id: userId } as unknown as User);

    // 処理結果
    expect(spy_getTime.mock.calls.length).toBe(1);
    expect(spy_crypto_createHash.mock.calls.length).toBe(1);
    expect(hash_update.mock.calls.length).toBe(1);
    expect(hash_digest.mock.calls.length).toBe(1);
    expect(spy_crypto_createHmac.mock.calls.length).toBe(1);
    expect(hmac_update.mock.calls.length).toBe(1);
    expect(hmac_digest.mock.calls.length).toBe(1);
    expect(get.mock.calls.length).toBe(1);
    expect(url).toBe(
      `${protocol}://${host}${constants.url.base}${constants.url.auth.base}${constants.url.auth.identify_verify}/${userId}/${hash}?expires=${expires}&signature=${signature}`
    );
  });
});

describe('本人確認用URLの検証', () => {
  it('正常系', () => {
    const hash = 'TEST_hash';
    const signature = 'TEST_signature';
    const expires = 1;

    spy_getTime.mockReturnValue(expires);
    const hash_digest = jest.fn().mockReturnValue(hash);
    const hash_update = jest.fn().mockReturnValue({ digest: hash_digest } as unknown as Hash);
    spy_crypto_createHash.mockReturnValue({ update: hash_update } as unknown as Hash);
    const hmac_digest = jest.fn().mockReturnValue(signature);
    const hmac_update = jest.fn().mockReturnValue({ digest: hmac_digest } as unknown as Hmac);
    spy_crypto_createHmac.mockReturnValue({ update: hmac_update } as unknown as Hmac);

    const req = mockReq({ params: { hash }, query: { signature, expires }, originalUrl: '' });
    const result = verifyIdentifyUrl(req, {} as unknown as User);

    // 処理結果
    expect(spy_getTime.mock.calls.length).toBe(1);
    expect(spy_crypto_createHash.mock.calls.length).toBe(1);
    expect(hash_update.mock.calls.length).toBe(1);
    expect(hash_digest.mock.calls.length).toBe(1);
    expect(spy_crypto_createHmac.mock.calls.length).toBe(1);
    expect(hmac_update.mock.calls.length).toBe(1);
    expect(hmac_digest.mock.calls.length).toBe(1);
    expect(result).toBe(true);
  });

  it('異常系: 有効期限の超過', () => {
    const expires = 1;
    spy_getTime.mockReturnValue(expires + 1);

    const req = mockReq({ query: { expires } });
    const result = verifyIdentifyUrl(req, {} as unknown as User);

    // 処理結果
    expect(spy_getTime.mock.calls.length).toBe(1);
    expect(result).toBe(false);
  });

  it('異常系: ハッシュの不一致', () => {
    const signature = 'TEST_signature';
    const expires = 1;

    spy_getTime.mockReturnValue(expires);
    const hash_digest = jest.fn().mockReturnValue('TEST_hash1');
    const hash_update = jest.fn().mockReturnValue({ digest: hash_digest } as unknown as Hash);
    spy_crypto_createHash.mockReturnValue({ update: hash_update } as unknown as Hash);
    const hmac_digest = jest.fn().mockReturnValue(signature);
    const hmac_update = jest.fn().mockReturnValue({ digest: hmac_digest } as unknown as Hmac);
    spy_crypto_createHmac.mockReturnValue({ update: hmac_update } as unknown as Hmac);

    const req = mockReq({ params: { hash: 'TEST_hash2' }, query: { signature, expires }, originalUrl: '' });
    const result = verifyIdentifyUrl(req, {} as unknown as User);

    // 処理結果
    expect(spy_getTime.mock.calls.length).toBe(1);
    expect(spy_crypto_createHash.mock.calls.length).toBe(1);
    expect(hash_update.mock.calls.length).toBe(1);
    expect(hash_digest.mock.calls.length).toBe(1);
    expect(spy_crypto_createHmac.mock.calls.length).toBe(1);
    expect(hmac_update.mock.calls.length).toBe(1);
    expect(hmac_digest.mock.calls.length).toBe(1);
    expect(result).toBe(false);
  });

  it('異常系: シグネチャの不一致', () => {
    const hash = 'TEST_hash';
    const expires = 1;

    spy_getTime.mockReturnValue(expires);
    const hash_digest = jest.fn().mockReturnValue(hash);
    const hash_update = jest.fn().mockReturnValue({ digest: hash_digest } as unknown as Hash);
    spy_crypto_createHash.mockReturnValue({ update: hash_update } as unknown as Hash);
    const hmac_digest = jest.fn().mockReturnValue('TEST_signature1');
    const hmac_update = jest.fn().mockReturnValue({ digest: hmac_digest } as unknown as Hmac);
    spy_crypto_createHmac.mockReturnValue({ update: hmac_update } as unknown as Hmac);

    const req = mockReq({ params: { hash }, query: { signature: 'TEST_signature2', expires }, originalUrl: '' });
    const result = verifyIdentifyUrl(req, {} as unknown as User);

    // 処理結果
    expect(spy_getTime.mock.calls.length).toBe(1);
    expect(spy_crypto_createHash.mock.calls.length).toBe(1);
    expect(hash_update.mock.calls.length).toBe(1);
    expect(hash_digest.mock.calls.length).toBe(1);
    expect(spy_crypto_createHmac.mock.calls.length).toBe(1);
    expect(hmac_update.mock.calls.length).toBe(1);
    expect(hmac_digest.mock.calls.length).toBe(1);
    expect(result).toBe(false);
  });
});

describe('パスワード用URLの生成', () => {
  it('正常系', async () => {
    const protocol = 'https';
    const host = 'example.com';
    const token = 'TEST_token';

    const digest = jest.fn().mockReturnValue(token);
    const update = jest.fn().mockReturnValue({ digest } as unknown as Hmac);
    spy_crypto_createHmac.mockReturnValue({ update } as unknown as Hmac);
    const get = jest.fn().mockImplementation((name: string) => {
      switch (name) {
        case 'host':
          return host;
        default:
          throw new Error();
      }
    });
    spy_transaction.mockImplementation((f) => f.call());
    spy_destroy.mockReturnValue(Promise.resolve());
    spy_create.mockReturnValue(Promise.resolve());
    const email = 'test@example.com';
    spy_encodeURIComponent.mockReturnValue(email);

    const req = mockReq({ protocol, get });
    const url = await createResetPasswordUrl(req);

    // 処理結果
    expect(spy_crypto_createHmac.mock.calls.length).toBe(1);
    expect(update.mock.calls.length).toBe(1);
    expect(digest.mock.calls.length).toBe(1);
    expect(get.mock.calls.length).toBe(1);
    expect(spy_transaction.mock.calls.length).toBe(1);
    expect(spy_destroy.mock.calls.length).toBe(1);
    expect(spy_create.mock.calls.length).toBe(1);
    expect(spy_encodeURIComponent.mock.calls.length).toBe(1);
    expect(url).toBe(
      `${protocol}://${host}${constants.url.base}${constants.url.auth.base}${constants.url.auth.resetPassword}/${token}?email=${email}`
    );
  });
});
