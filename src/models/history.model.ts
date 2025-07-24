import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class History extends Model {
  declare id: number;
  declare ref?: string;
  declare keyword?: string;
  declare answer?: string;
  declare refserialize?: string;
  declare phone?: string;
  declare options?: any;
  declare created_at: Date;
  declare updated_in?: Date;
  declare contact_id?: number;
  declare message?: string;
  declare type?: string; // 'incoming' | 'outgoing'
}

History.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    ref: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: 'message_ref', // Valor por defecto para mensajes del chat
    },
    keyword: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    answer: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '', // Valor por defecto vacío
    },
    refserialize: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '{}', // JSON vacío por defecto
    },
    phone: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    options: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_in: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    contact_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    type: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'History',
    tableName: 'history',
    timestamps: false,
  }
);

export default History;
