import { Result } from 'express-validator';
import { mockReq, mockRes } from 'sinon-express-mock';

import { verifyValidationResult } from './verifyValidationResult';

let spy_isEmpty: jest.SpyInstance;

beforeEach(() => {
  spy_isEmpty = jest.spyOn(Result.prototype, 'isEmpty');
});

afterEach(() => {
  spy_isEmpty.mockClear();
});

describe('パラメータバリデーションの検証', () => {
  it('正常系', () => {
    spy_isEmpty.mockReturnValue(true);

    const req = mockReq();
    const res = mockRes();
    const next = jest.fn();
    verifyValidationResult(req, res, next);

    // 処理結果
    expect(spy_isEmpty.mock.calls.length).toBe(1);
    expect(next.mock.calls[0][0]).toBe(undefined);
  });

  it('異常系: バリデーションエラーが存在', () => {
    spy_isEmpty.mockReturnValue(false);

    const req = mockReq();
    const res = mockRes();
    const next = jest.fn();
    verifyValidationResult(req, res, next);

    // 処理結果
    expect(spy_isEmpty.mock.calls.length).toBe(1);
    expect(next.mock.calls[0][0].output.statusCode).toBe(400);
  });
});
