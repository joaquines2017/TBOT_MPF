<p align="center">
  <a href="https://builderbot.vercel.app/">
    <picture>
      <img src="https://builderbot.vercel.app/assets/thumbnail-vector.png" height="80">
    </picture>
    <h2 align="center">BuilderBot</h2>
  </a>
</p>



<p align="center">
  <a aria-label="NPM version" href="https://www.npmjs.com/package/@builderbot/bot">
    <img alt="" src="https://img.shields.io/npm/v/@builderbot/bot?color=%2300c200&label=%40bot-whatsapp">
  </a>
 <!-- <a aria-label="Join the community on GitHub" -->
  <!-- href="https://link.codigoencasa.com/DISCORD"> 
    <img alt="" src="https://img.shields.io/discord/915193197645402142?logo=discord"> -->
  </a> 
</p>


# T-BOT: Bot de WhatsApp para Gestión de Tickets

## Descripción
T-BOT es un asistente virtual para WhatsApp que permite gestionar tickets de soporte técnico integrado con Redmine y Botpress.

## Características Principales
- 🎫 Generación de tickets
- 🔍 Consulta de tickets
- ❌ Cancelación de tickets
- 📋 Listado de tickets

## Tecnologías
- Node.js
- TypeScript
- Baileys (WhatsApp Web API)
- PostgreSQL
- Botpress
- Redmine API

## 🚀 Instalación y Configuración

### Requisitos Previos
- Node.js v18 o superior
- PostgreSQL 12 o superior
- Servidor Redmine con API habilitada
- Servidor Botpress (opcional)

### Instalación Paso a Paso

1. **Clonar el repositorio**
```bash
git clone https://github.com/joaquines2017/TBOT_MPF.git
cd TBOT_MPF
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
```

4. **Editar el archivo `.env`** con tus configuraciones:
```env
# Base de datos PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=tu_contraseña
DB_NAME=tbot

# Redmine API
REDMINE_URL=https://tu-redmine-server.com
REDMINE_API_KEY=tu_api_key_de_redmine

# Botpress (opcional)
BOTPRESS_URL=http://localhost:3000
BOTPRESS_BOT_ID=tu_bot_id

# Puerto del servidor
PORT=3008
```

5. **Configurar la base de datos**
```bash
# Ejecutar desde PostgreSQL o usar psql
psql -U postgres -d tbot -f scripts/create_tables.sql
```

6. **Compilar el proyecto**
```bash
npm run build
```

7. **Iniciar la aplicación**
```bash
# Desarrollo
npm run dev

# Producción
npm start
```

### 🐳 Instalación con Docker
```bash
# Levantar PostgreSQL
docker-compose up -d

# Compilar y ejecutar
npm run build
npm start
```

## 📱 Funcionalidades

1. **Gestión de Tickets**
   - Crear tickets
   - Consultar estado
   - Eliminar tickets
   - Reabrir tickets cerrados

2. **Integración con Redmine**
   - Asignación automática
   - Seguimiento de estados
   - Categorización de incidentes

3. **Procesamiento de Lenguaje Natural**
   - Interpretación de consultas
   - Respuestas contextuales
   - Flujo conversacional inteligente

## 🔧 Troubleshooting

### Errores Comunes

**Error de conexión a PostgreSQL:**
```bash
# Verificar que PostgreSQL esté ejecutándose
sudo systemctl status postgresql
# o en Windows
net start postgresql-x64-13
```

**Error "Cannot find module":**
```bash
# Limpiar e instalar dependencias
rm -rf node_modules package-lock.json
npm install
```

**Error de compilación TypeScript:**
```bash
# Limpiar dist y recompilar
rm -rf dist
npm run build
```

### Variables de Entorno Importantes
- `DB_HOST`: Host de PostgreSQL (localhost o IP del servidor)
- `REDMINE_URL`: URL completa de tu servidor Redmine
- `REDMINE_API_KEY`: API Key de un usuario administrador en Redmine

## 📂 Estructura del Proyecto
```
├── src/
│   ├── controllers/     # Controladores de lógica
│   ├── services/        # Servicios de integración
│   ├── models/          # Modelos de base de datos
│   ├── flow/            # Flujos de conversación
│   └── types/           # Definiciones TypeScript
├── scripts/             # Scripts SQL
├── docs/                # Documentación técnica
└── dist/                # Código compilado
```

## 👥 Equipo
- [Joaquín Juárez]
- [Gustavo Salva]
- [José Ruiz]

## 📄 Licencia
[Tipo de licencia]