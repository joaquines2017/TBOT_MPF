import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class TicketRating extends Model {
  declare id: number;
  declare phone: string;
  declare ticket_id: number;
  declare rating: number; // 1-4
  declare created_at: Date;
  declare redmine_updated: boolean;
}

TicketRating.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    phone: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    ticket_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 4,
      },
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    redmine_updated: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: 'TicketRating',
    tableName: 'ticket_ratings',
    timestamps: false,
  }
);

export default TicketRating;
