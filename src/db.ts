import { Options, Sequelize } from 'sequelize';

import { DATABASE_URL, IS_PROD } from './env';
import Auth from './models/Auth';
import PasswordReset from './models/PasswordReset';
import User from './models/User';

export const initilizeDatabase = () => {
  Auth.initialize(dbInstance);
  PasswordReset.initialize(dbInstance);
  User.initialize(dbInstance);
  User.associate();
};

const dbOptions: Options = {
  dialect: 'postgres',
  protocol: 'postgres',
  pool: {
    max: 10,
    min: 3,
    acquire: 30000,
    evict: 10000,
  },
};

export const dbInstance = new Sequelize(
  DATABASE_URL,
  IS_PROD
    ? {
        ...dbOptions,
        dialectOptions: {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
        },
      }
    : dbOptions
);

export const dbNow = Sequelize.literal('CURRENT_TIMESTAMP');
