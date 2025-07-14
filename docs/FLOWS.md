# Documentación de Flujos Conversacionales

## Flujos Principales

### 1. Generación de Ticket
**Inicio:**
- Trigger: Usuario envía "generar" o "1"
- Estado: `nodo_saludo` → `esperando_categoria`

**Selección de Categoría:**
- Muestra: Lista de categorías disponibles
- Estado: `subcat_*`
- Validación: Opción válida

**Selección de Subcategoría:**
- Muestra: Lista específica de la categoría
- Validación: Opción válida
- Acción: Prepara datos del ticket

**Confirmación:**
- Muestra: Resumen del ticket
- Estado: `nodo_confirmar_envio`
- Acción: Crea ticket en Redmine

**Cierre:**
- Estado: `esperando_calificacion`
- Mensaje: Solicita calificación
- Acción: Finaliza conversación y limpia estado

**Ejemplo de interacción:**
```
Usuario: 1
Bot: Selecciona la categoría...
Usuario: 2
Bot: Selecciona la subcategoría...
Usuario: si
Bot: ✅ Ticket creado con éxito...
Bot: 📝 Por favor, calificá la atención: 1️⃣ Mala 2️⃣ Buena 3️⃣ Muy Buena 4️⃣ Excelente
Usuario: 4
Bot: ¡Gracias por tu calificación! La conversación ha finalizado.
```

### 2. Consulta de Ticket
**Inicio:**
- Trigger: "consultar" o "2"
- Estado: `esperando_id_consulta`

**Proceso:**
- Validación: Número válido
- Consulta: Redmine API
- Respuesta: Detalles formateados

**Ejemplo:**
```
Usuario: 2
Bot: Ingresá el número de ticket...
Usuario: 12345
Bot: 📋 Detalles del ticket #12345...
```

### 3. Cancelación de Ticket
**Inicio:**
- Trigger: "cancelar" o "3"
- Estado: `esperando_id_cancelar`

**Proceso:**
- Validación: Número + Permisos
- Acción: Cambio estado en Redmine
- Confirmación: Mensaje al usuario

**Ejemplo:**
```
Usuario: 3
Bot: Ingresá el número de ticket...
Usuario: 12345
Bot: ✅ El ticket #12345 ha sido rechazado exitosamente.
```

### 4. Ver Todos los Tickets y Paginación
**Inicio:**
- Trigger: "ver" o "4"
- Estado: `mostrando_tickets`

**Selección de Estado:**
- Bot muestra menú: 1️⃣ Nuevo 2️⃣ En curso
- Usuario selecciona estado
- Estado: `paginando_tickets`

**Navegación:**
- Opciones: 3️⃣ Salir 4️⃣ Siguiente 5️⃣ Anterior
- Bot muestra tickets paginados
- Usuario navega con "siguiente", "anterior" o "salir"

**Cierre:**
- Si usuario envía "3" o "salir": Bot responde con mensaje de despedida y finaliza conversación

**Ejemplo:**
```
Usuario: 4
Bot: Elija el estado de los tickets...
Usuario: 1
Bot: Estos son tus tickets con estado "Nuevo": ... Opciones: 3️⃣ Salir 4️⃣ Siguiente
Usuario: 4
Bot: ...siguiente página...
Usuario: 3
Bot: 🤖 T-BOT ha finalizado la conversación. Gracias por comunicarte con nosotros. Saludos.
```

## Estados de Sesión

```typescript
interface EstadosSesion {
  nodo_saludo: 'Menú principal',
  esperando_categoria: 'Selección categoría',
  subcat_impresora: 'Subcategorías impresora',
  subcat_pc: 'Subcategorías PC',
  subcat_telefonoip: 'Subcategorías teléfono',
  subcat_camara: 'Subcategorías cámara',
  subcat_audiencia: 'Subcategorías audiencia',
  nodo_confirmar_envio: 'Confirmación final',
  esperando_id_consulta: 'Esperando número consulta',
  esperando_id_cancelar: 'Esperando número cancelar',
  mostrando_tickets: 'Menú de estado de tickets',
  paginando_tickets: 'Navegando tickets paginados',
  esperando_calificacion: 'Esperando calificación',
  esperando_calificacion_tickets: 'Calificación tras ver todos'
}
```


## Flujos Especiales y Edge Cases

### 5. Calificación de Atención
**Trigger:** Tras crear/cancelar ticket o finalizar consulta/paginación.
- Estado: `esperando_calificacion` o `esperando_calificacion_tickets`
- Bot solicita calificación (1-4)
- Usuario responde con número
- Bot agradece y finaliza conversación

**Ejemplo:**
```
Bot: 📝 Por favor, calificá la atención: 1️⃣ Mala 2️⃣ Buena 3️⃣ Muy Buena 4️⃣ Excelente
Usuario: 2
Bot: ¡Gracias por tu calificación! 🙏 La conversación ha finalizado.
```

### 6. Errores y Casos de Uso
- Si el usuario ingresa un número de ticket inválido:
  - Bot responde: "⚠️ Número de ticket inválido. Por favor, ingresá solo números."
- Si el ticket no existe:
  - Bot responde: "⚠️ No se encontró el ticket #12345"
- Si ocurre un error interno:
  - Bot responde: "❌ Ocurrió un error. Por favor, intentá nuevamente."
- Si el usuario envía una opción no válida en paginación:
  - Bot responde: "Opción no válida. Por favor, elige una opción del menú."

### Recomendaciones de Uso
- Siempre finalizar la conversación con "salir" o la opción correspondiente.
- Si tienes dudas, envía "ayuda" para ver el menú principal.
- Para navegar entre páginas de tickets, usa "siguiente" y "anterior".

---

## Mensajes del Sistema

### Mensajes de Éxito
```typescript
const mensajesExito = {
  ticketCreado: '✅ Ticket creado con éxito\n🆔 ID: 12345\n📂 Categoría: impresora\n✏️ Asunto: problema X\n👤 Asignado al técnico: Juan Pérez\n🕒 Creado: 13/07/2025',
  ticketCancelado: '✅ El ticket #12345 ha sido rechazado exitosamente.\n📊 Estado: Rechazado',
  consultaExitosa: '📋 Detalles del ticket #12345...'
}
```

### Mensajes de Error
```typescript
const mensajesError = {
  numeroInvalido: '⚠️ Número de ticket inválido. Por favor, ingresá solo números.',
  ticketNoEncontrado: '⚠️ No se encontró el ticket #12345',
  errorSistema: '❌ Ocurrió un error. Por favor, intentá nuevamente.',
  opcionNoValida: 'Opción no válida. Por favor, elige una opción del menú.'
}

