import MailService from '@sendgrid/mail';

import { MAIL_ADDRESS, MAIL_API_KEY } from '../env';

MailService.setApiKey(MAIL_API_KEY);

/**
 * メールを送信します。
 * @param data 送信に必要な情報
 * @returns レスポンス
 */
export const sendMail = (data: { to: string; subject: string; html: string }) =>
  MailService.send({ from: MAIL_ADDRESS, ...data });
