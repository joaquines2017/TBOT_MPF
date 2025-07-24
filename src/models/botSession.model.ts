import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import sequelize from '../config/database';

interface BotSessionAttributes {
  id: number;
  user_id: string;
  current_node: string;
  last_input_type?: string | null;
  last_input_value?: string | null;
  updated_at?: Date | null;
  phone: string;
  created_at: Date;
  updated_in?: Date | null;
  last_interaction?: Date | null;
  values?: object | null;
}

class BotSession extends Model<BotSessionAttributes, Omit<BotSessionAttributes, 'id' | 'created_at'>> {
  declare id: CreationOptional<number>;
  declare user_id: string;
  declare current_node: string;
  declare last_input_type: string | null;
  declare last_input_value: string | null;
  declare updated_at: Date | null;
  declare phone: string;
  declare created_at: CreationOptional<Date>;
  declare updated_in: Date | null;
  declare last_interaction: Date | null;
  declare values: object | null;
}

BotSession.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.STRING(32),
      allowNull: false,
    },
    current_node: {
      type: DataTypes.STRING(64),
      allowNull: false,
    },
    last_input_type: {
      type: DataTypes.STRING(16),
      allowNull: true,
    },
    last_input_value: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
    phone: {
      type: DataTypes.STRING(255),
      allowNull: false,
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
    last_interaction: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    values: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'BotSession',
    tableName: 'bot_sessions',
    timestamps: false,
  }
);

export default BotSession;
