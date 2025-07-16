import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class Contact extends Model {
  declare id: number;
  declare phone: string;
  declare name?: string;
  declare created_at: Date;
  declare updated_in: Date;
  declare last_interaction: Date;
  declare values: any;
}

Contact.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    phone: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING(255),
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
    modelName: 'Contact',
    tableName: 'contact',
    timestamps: false, // Desactivamos timestamps automáticos ya que usamos campos personalizados
    underscored: true,
  }
);

export default Contact;
