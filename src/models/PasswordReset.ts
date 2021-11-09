import { DataTypes, Model, Sequelize } from 'sequelize';

export default class PasswordReset extends Model {
  public email!: string;
  public token!: string;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public static initialize(sequelize: Sequelize) {
    return this.init(
      {
        email: {
          type: DataTypes.STRING,
          primaryKey: true,
          allowNull: false,
        },
        token: {
          type: DataTypes.TEXT,
          unique: true,
          allowNull: false,
        },
      },
      {
        sequelize,
        modelName: 'PasswordReset',
        tableName: 'password_resets',
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        underscored: true,
      }
    );
  }
}
