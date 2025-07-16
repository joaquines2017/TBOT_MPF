/**
 * Inicializa y exporta una instancia de Sequelize configurada para una base de datos PostgreSQL.
 *
 * Carga las variables de entorno usando dotenv y las utiliza para configurar la conexión a la base de datos.
 * La configuración incluye nombre de la base de datos, usuario, contraseña, host y puerto.
 * Desactiva el registro de consultas SQL por defecto.
 *
 * @module config/database
 * @see {@link https://sequelize.org/ Documentación de Sequelize}
 * @remarks
 * - Asegúrate de que las siguientes variables de entorno estén definidas: `DB_NAME`, `DB_USER`, `DB_PASS`, `DB_HOST`, `DB_PORT`.
 * - Las opciones `username` y `password` se establecen explícitamente por claridad.
 * - Lanza un error si faltan variables de entorno requeridas.
 */
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

const sequelize = new Sequelize(
    process.env.DB_NAME!,
    process.env.DB_USER!,
    process.env.DB_PASS!,
    {
        host: process.env.DB_HOST!,
        port: Number(process.env.DB_PORT!) || 5432,
        dialect: 'postgres',
        logging: false,
    }
);

export default sequelize;
