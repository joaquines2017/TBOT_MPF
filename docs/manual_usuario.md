# Manual de Usuario T-BOT 📱

## Índice
1. [Introducción](#introducción)
2. [Comenzar a Usar T-BOT](#comenzar-a-usar-t-bot)
3. [Funciones Principales](#funciones-principales)
4. [Solución de Problemas](#solución-de-problemas)

## Introducción
T-BOT es tu asistente virtual de WhatsApp para gestionar tickets de soporte técnico. 
Te permite crear, consultar y gestionar tickets de manera rápida y sencilla.

## Comenzar a Usar T-BOT
1. Agrega el número de T-BOT a tus contactos: [NÚMERO]
2. Envía cualquier mensaje para iniciar
3. T-BOT te responderá con el menú principal

## Funciones Principales

### 1️⃣ Generar un Nuevo Ticket
  
1. Selecciona la categoría del problema:
   - 1️⃣ Problema con impresora
   - 2️⃣ Problema con PC
   - 3️⃣ Problema con teléfono IP
   - 4️⃣ Problema con cámara
   - 5️⃣ Problema con audiencia
2. Selecciona la subcategoría específica
3. Confirma los datos del ticket
   - Si: Para crear el ticket
   - No: Para cancelar

### 2️⃣ Consultar un Ticket
1. Envía "2" o escribe "consultar"
2. Ingresa el número de ticket
3. Recibirás los detalles:
   - ID del ticket
   - Categoría
   - Estado
   - Técnico asignado
   - Fecha de creación

### 3️⃣ Cancelar un Ticket
1. Envía "3" o escribe "cancelar"
2. Ingresa el número de ticket
3. El ticket cambiará a estado "Rechazado"

### 4️⃣ Ver Todos los Tickets
1. Envía "4" o escribe "ver"
2. Recibirás lista de tickets activos
3. Usa "siguiente" o "anterior" para navegar

### 5️⃣ Reabrir un Ticket
1. Envía "5" o escribe "reabrir"
2. Ingresa el número de ticket
3. El ticket volverá a estado activo

### 6️⃣ Ayuda
Envía "6" o escribe "ayuda" para ver este menú

## Estados de los Tickets
- 📌 Nuevo: Recién creado
- ⏳ En Proceso: Asignado a un técnico
- ✅ Resuelto: Problema solucionado
- ❌ Rechazado: Ticket cancelado

## Ejemplos de Uso

### Crear un Ticket
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

### Consultar un Ticket
```
Usuario: 2
Bot: Ingresá el número de ticket...
Usuario: 12345
Bot: 📋 Detalles del ticket #12345...
```

### Cancelar un Ticket
```
Usuario: 3
Bot: Ingresá el número de ticket...
Usuario: 12345
Bot: ✅ El ticket #12345 ha sido rechazado exitosamente.
```

### Ver Todos los Tickets y Paginación
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

### Reabrir un Ticket
```
Usuario: 5
Bot: Ingresá el número de ticket...
Usuario: 12345
Bot: El ticket #12345 ha sido reabierto y está en proceso.
```

### Ayuda
```
Usuario: 6
Bot: Menú principal con opciones y ayuda.
```

## Solución de Problemas

- Si el usuario ingresa un número de ticket inválido:
  - Bot responde: "⚠️ Número de ticket inválido. Por favor, ingresá solo números."
- Si el ticket no existe:
  - Bot responde: "⚠️ No se encontró el ticket #12345"
- Si ocurre un error interno:
  - Bot responde: "❌ Ocurrió un error. Por favor, intentá nuevamente."
- Si el usuario envía una opción no válida en paginación:
  - Bot responde: "Opción no válida. Por favor, elige una opción del menú."

## Recomendaciones

- Finaliza la conversación con "salir" o la opción correspondiente.
- Usa "siguiente" y "anterior" para navegar entre páginas de tickets.
- Envía "ayuda" para ver el menú principal.
