/**
 * Script para crear la tabla bot_sessions con la estructura correcta
 */
import sequelize from '../config/database';
import { DataTypes } from 'sequelize';

const createBotSessionsTable = async () => {
  try {
    console.log('🔧 Verificando estructura de la tabla bot_sessions...');
    
    // Verificar si la tabla existe
    const tableExists = await sequelize.getQueryInterface().showAllTables();
    console.log('📋 Tablas existentes:', tableExists);
    
    if (tableExists.includes('bot_sessions')) {
      console.log('📝 Tabla bot_sessions existe, verificando columnas...');
      
      // Obtener estructura actual de la tabla
      const tableDescription = await sequelize.getQueryInterface().describeTable('bot_sessions');
      console.log('📊 Estructura actual:', tableDescription);
      
      // Verificar y agregar columnas faltantes
      const requiredColumns = {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
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
      };
      
      for (const [columnName, columnDef] of Object.entries(requiredColumns)) {
        if (!tableDescription[columnName]) {
          console.log(`➕ Agregando columna faltante: ${columnName}`);
          await sequelize.getQueryInterface().addColumn('bot_sessions', columnName, columnDef);
        } else {
          console.log(`✅ Columna ${columnName} ya existe`);
        }
      }
      
    } else {
      console.log('🆕 Creando tabla bot_sessions...');
      await sequelize.getQueryInterface().createTable('bot_sessions', {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
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
      });
      console.log('✅ Tabla bot_sessions creada exitosamente');
    }
    
    // Verificar estructura final
    const finalStructure = await sequelize.getQueryInterface().describeTable('bot_sessions');
    console.log('🎉 Estructura final de bot_sessions:', finalStructure);
    
  } catch (error) {
    console.error('❌ Error al crear/verificar tabla bot_sessions:', error);
  } finally {
    await sequelize.close();
  }
};

// Ejecutar si es llamado directamente
if (require.main === module) {
  createBotSessionsTable();
}

export default createBotSessionsTable;
