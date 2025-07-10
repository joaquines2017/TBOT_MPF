import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class Ticket extends Model {}

Ticket.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
        },
        status: {
            type: DataTypes.STRING,
            defaultValue: 'open',
        },
    },
    {
        sequelize,
        modelName: 'Ticket',
        tableName: 'tickets',
        timestamps: true,
    }
);

export default Ticket;
