# Documentación Técnica T-BOT

## 🏗️ Arquitectura del Sistema

### Componentes Core
1. **WhatsApp Layer (Baileys)**
   - Gestión de conexión WebSocket
   - Manejo de eventos de mensajería
   - Procesamiento de multimedia

2. **BuilderBot Core**
   - Gestión de sesiones de usuario
   - Manejo de estados de conversación
   - Sistema de routing de mensajes
   - Gestión de errores y reconexión

3. **Intent Mapper**
   - Análisis de mensajes entrantes
   - Mapeo a intenciones del sistema
   - Gestión de flujos conversacionales
   - Validación de entradas

4. **Botpress NLP**
   - Procesamiento de lenguaje natural
   - Detección de intenciones
   - Entrenamiento de modelos
   - Generación de respuestas contextuales

5. **Ticket Flow**
   - Lógica de negocio de tickets
   - Validación de datos
   - Gestión de estados de tickets
   - Integración con sistemas externos

### Integraciones Externas
1. **Redmine API**
   - Creación de tickets
   - Consulta de estados
   - Actualización de tickets
   - Gestión de usuarios

2. **PostgreSQL**
   - Almacenamiento de sesiones
   - Cache de datos
   - Logs del sistema
   - Métricas y analytics

## 🔄 Flujos del Sistema

### 1. Generación de Ticket
```mermaid
sequenceDiagram
    Usuario->>WhatsApp: Envía mensaje
    WhatsApp->>BuilderBot: Procesa mensaje
    BuilderBot->>IntentMapper: Mapea intención
    IntentMapper->>Botpress: Solicita categorías
    Botpress->>Usuario: Muestra opciones
    Usuario->>BuilderBot: Selecciona categoría
    BuilderBot->>Redmine: Crea ticket
    Redmine->>Usuario: Confirma creación
```

### 2. Consulta de Ticket
```mermaid
sequenceDiagram
    Usuario->>BuilderBot: Solicita consulta
    BuilderBot->>Redmine: Consulta ticket
    Redmine->>BuilderBot: Devuelve datos
    BuilderBot->>Usuario: Muestra información
```

## 🛠️ Configuración Técnica

### Variables de Entorno
```env
# WhatsApp
WA_CLIENT_ID=
WA_WEBHOOK_URL=

# Botpress
BP_API_URL=
BP_BOT_ID=

# Redmine
REDMINE_URL=
REDMINE_API_KEY=

# Database
DB_HOST=
DB_PORT=
DB_NAME=
```

### Dependencias Principales
```json
{
  "@builderbot/bot": "^1.0.0",
  "@builderbot/provider-baileys": "^1.0.0",
  "axios": "^0.24.0",
  "dotenv": "^10.0.0",
  "pg": "^8.7.0"
}
```

## 📊 Monitoreo y Logs

### Niveles de Log
1. **DEBUG**: Información detallada de desarrollo
2. **INFO**: Eventos normales del sistema
3. **WARN**: Advertencias y errores recuperables
4. **ERROR**: Errores críticos que requieren atención

### Métricas Clave
- Tiempo de respuesta
- Tasa de éxito de mensajes
- Uso de memoria
- Conexiones activas
- Tickets procesados/hora

## 🔐 Seguridad

### Autenticación
- Tokens JWT para APIs
- API Keys para servicios externos
- Encriptación de datos sensibles

### Rate Limiting
- Límites por usuario
- Protección contra flood
- Blacklisting de IPs maliciosas

## 🚀 Despliegue

### Requisitos
- Node.js 16+
- PostgreSQL 13+
- Redis (opcional)
- PM2 o similar

### Pasos de Despliegue
1. Clonar repositorio
2. Instalar dependencias
3. Configurar variables de entorno
4. Compilar TypeScript
5. Iniciar con PM2
