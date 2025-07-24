
# Arquitectura del Sistema

## Componentes Principales

### 1. BuilderBot (Core)
- Manejo de conexión WhatsApp (Baileys)
- Gestión de estados de conversación y sesión (`SessionData`)
- Enrutamiento y procesamiento de mensajes
- Integración con servicios externos (Redmine, Botpress)

### 2. Controladores
- `intentMapper`: Normaliza y mapea mensajes a intenciones (intents)
- `ticketFlow`: Orquesta los flujos de tickets (crear, consultar, cancelar, ver todos, paginación, calificación)

### 3. Servicios
- `BotpressService`: Comunicación con Botpress para respuestas conversacionales
- `RedmineService`: CRUD de tickets, miembros, contactos y calificaciones en Redmine

### 4. Gestión de Estado
```typescript
interface SessionData {
  estado: Record<string, string>
  contexto: Record<string, any>
  conversacionFinalizada: Record<string, boolean>
  paginaActual: Record<string, number>
}
```

## Flujo de Datos
1. Mensaje WhatsApp → BuilderBot
2. BuilderBot → intentMapper (normaliza input)
3. BuilderBot → ticketFlow (si es flujo de tickets)
4. ticketFlow → RedmineService (si requiere acción en Redmine)
5. ticketFlow → BuilderBot (respuesta)
6. BuilderBot → BotpressService (si no es flujo de tickets)
7. Respuesta final → WhatsApp

## Diagrama de Secuencia (Textual)

```
Usuario
  |
  v
WhatsApp
  |
  v
BuilderBot (app.ts)
  |---> intentMapper.controller.ts
  |---> ticket.flow.ts
  |         |---> RedmineService
  |         |---> BotpressService
  |
  v
WhatsApp (respuesta)
```

## Integración y Edge Cases
- El flujo de tickets es gestionado 100% por BuilderBot, NO por Botpress.
- El comando `salir` o `3` en menú de tickets finaliza la conversación y limpia el estado.
- El bot maneja paginación, filtrado y calificación de tickets.
- Si ocurre un error, el estado se resetea y se informa al usuario.
- El sistema es tolerante a variantes de input y alias.

## Variables de Entorno Clave
- `REDMINE_URL`, `REDMINE_API_KEY`: Acceso a Redmine
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`: Base de datos
- `PORT`: Puerto de la app

## Despliegue y Dependencias
- Node.js, TypeScript, Baileys, BuilderBot, PostgreSQL, Redmine, Botpress
- Docker y docker-compose recomendados para producción

## Notas
- El código está modularizado para facilitar mantenimiento y escalabilidad.
- Los flujos de tickets y navegación están desacoplados de Botpress para mayor control.
