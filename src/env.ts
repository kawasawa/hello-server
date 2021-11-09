export const validateEnvValues = () => {
  const emptyEnv = [];
  let _: string | undefined;

  _ = process.env.ORIGIN;
  if (!_) emptyEnv.push('ORIGIN');

  _ = process.env.DATABASE_URL;
  if (!_) emptyEnv.push('DATABASE_URL');

  _ = process.env.MAIL_API_KEY;
  if (!_) emptyEnv.push('MAIL_API_KEY');

  _ = process.env.MAIL_ADDRESS;
  if (!_) emptyEnv.push('MAIL_ADDRESS');

  _ = process.env.MAIL_SIGNATURE_SECRET;
  if (!_) emptyEnv.push('MAIL_SIGNATURE_SECRET');

  _ = process.env.REFRESH_TOKEN_SECRET;
  if (!_) emptyEnv.push('REFRESH_TOKEN_SECRET');

  _ = process.env.ACCESS_TOKEN_SECRET;
  if (!_) emptyEnv.push('ACCESS_TOKEN_SECRET');

  _ = process.env.PASSWORD_RESET_TOKEN_SECRET;
  if (!_) emptyEnv.push('PASSWORD_RESET_TOKEN_SECRET');

  if (0 < emptyEnv.length) throw new Error(`Invalid env values.: ${emptyEnv.join(', ')}`);
};

export const APP_NAME = process.env.npm_package_name;
export const APP_VERSION = process.env.npm_package_version;

export const IS_PROD = process.env.NODE_ENV === 'production' ? true : false;

export const PORT = Number(process.env.PORT) || 8080;
export const ORIGIN: string | boolean = process.env.ORIGIN?.toLowerCase() == 'true' ? true : String(process.env.ORIGIN);

export const DATABASE_URL = String(process.env.DATABASE_URL);

export const MAIL_API_KEY = String(process.env.MAIL_API_KEY);
export const MAIL_ADDRESS = String(process.env.MAIL_ADDRESS);
export const MAIL_SIGNATURE_SECRET = String(process.env.MAIL_SIGNATURE_SECRET);

export const REFRESH_TOKEN_SECRET = String(process.env.REFRESH_TOKEN_SECRET);
export const ACCESS_TOKEN_SECRET = String(process.env.ACCESS_TOKEN_SECRET);
export const PASSWORD_RESET_TOKEN_SECRET = String(process.env.PASSWORD_RESET_TOKEN_SECRET);
