import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';

// Configurar dotenv para cargar variables de entorno
dotenv.config({ path: path.join(process.cwd(), '.env') });

// Debug: verificar variables en database.ts
console.log('🔧 [database.ts] Variables de entorno:');
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASS:', process.env.DB_PASS ? '***' : 'undefined');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);

// Verifica que las variables de entorno necesarias estén definidas
if (!process.env.DB_NAME || !process.env.DB_USER || !process.env.DB_PASS || !process.env.DB_HOST || !process.env.DB_PORT) {
    throw new Error('Faltan variables de entorno necesarias para la base de datos');
}

// Crear instancia de Sequelize
const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT),
        dialect: 'postgres',
        logging: false,
        define: {
            timestamps: true,
            underscored: true
        }
    }
);

export default sequelize;
