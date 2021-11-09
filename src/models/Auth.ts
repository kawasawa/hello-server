import { DataTypes, Model, Sequelize } from 'sequelize';

export default class Auth extends Model {
  public user_id!: number;
  public token!: string;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public static initialize(sequelize: Sequelize) {
    return this.init(
      {
        user_id: {
          type: DataTypes.NUMBER,
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
        modelName: 'Auth',
        tableName: 'auth',
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        underscored: true,
      }
    );
  }
}
