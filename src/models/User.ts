import { Association, DataTypes, Model, Sequelize } from 'sequelize';

import Auth from './Auth';
import PasswordReset from './PasswordReset';

export default class User extends Model {
  public id!: number;
  public name!: string;
  public email!: string;
  public password!: string;
  public verified!: boolean;
  public signedin_at!: Date;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public static initialize(sequelize: Sequelize) {
    return this.init(
      {
        id: {
          type: DataTypes.NUMBER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        email: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        password: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        verified: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        signedin_at: {
          type: 'TIMESTAMP',
          allowNull: true,
        },
      },
      {
        sequelize,
        modelName: 'User',
        tableName: 'users',
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        underscored: true,
      }
    );
  }

  // associations
  public readonly auth?: Auth;
  public readonly passwordReset?: PasswordReset;
  public static associations: {
    auth: Association<User, Auth>;
    passwordReset: Association<User, PasswordReset>;
  };

  public static associate() {
    this.hasOne(Auth, {
      sourceKey: 'id',
      foreignKey: 'user_id',
      as: 'auth',
    });
    this.hasOne(PasswordReset, {
      sourceKey: 'email',
      foreignKey: 'email',
      as: 'passwordReset',
    });
    return this;
  }
}
