import MailService from '@sendgrid/mail';

import { sendMail } from './mail';

let spy_send: jest.SpyInstance;

beforeEach(() => {
  spy_send = jest.spyOn(MailService, 'send');
});

afterEach(() => {
  spy_send.mockClear();
});

describe('メールの送信', () => {
  it('正常系', async () => {
    spy_send.mockReturnValue(Promise.resolve());

    await sendMail({ to: 'test@example.com', subject: 'TEST_subject', html: 'TEST_html' });

    // 処理結果
    expect(spy_send.mock.calls.length).toBe(1);
  });
});
