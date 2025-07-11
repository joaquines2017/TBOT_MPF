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
  <a aria-label="Join the community on GitHub" href="https://link.codigoencasa.com/DISCORD">
    <img alt="" src="https://img.shields.io/discord/915193197645402142?logo=discord">
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

## Estructura del Proyecto
````markdown
# Clonar repositorio
git clone [url-repositorio]

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Iniciar en desarrollo
npm run dev

# Iniciar en producción
npm start
````

## Configuración
Editar archivo `.env`:
```env
DB_HOST=host.docker.internal
DB_PORT=5432
DB_USER=usuario
DB_PASS=contraseña
DB_NAME=tbot
REDMINE_URL=https://tu-redmine.com
REDMINE_API_KEY=tu-api-key
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

## 👥 Equipo
- [Joaquín Juárez]
- [Gustavo Salva]
- [José Ruiz]

## 📄 Licencia
[Tipo de licencia]