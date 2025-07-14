
# Comandos Rápidos T-BOT 🚀

## Menú Principal
- `1` o `generar`: Crear ticket
- `2` o `consultar`: Consultar ticket
- `3` o `cancelar`: Cancelar ticket
- `4` o `ver` o `ver todos`: Ver todos los tickets
- `5` o `ayuda`: Ver ayuda

## Navegación y Opciones en Flujos
- `menu`: Volver al menú principal
- `volver`: Retroceder un paso
- `siguiente` o `4`: Siguiente página (en paginación de tickets)
- `anterior` o `5`: Página anterior (en paginación de tickets)
- `salir` o `3`: Salir y finalizar conversación (en menú de tickets)

## Confirmaciones y Calificaciones
- `si` o `1`: Confirmar acción
- `no` o `2`: Cancelar acción
- `1`, `2`, `3`, `4`: Calificar atención (1=Mala, 2=Buena, 3=Muy Buena, 4=Excelente)

## Alias y Variantes Reconocidas
- `nuevo` o `1`: Filtrar tickets por estado "Nuevo"
- `en curso`, `en proceso`, `en_proceso` o `2`: Filtrar tickets por estado "En curso"

## Edge Cases y Comportamientos Especiales
- Si escribís `3` o `salir` en el menú de tickets, la conversación se cierra inmediatamente.
- Si respondés con un número de ticket cuando se solicita, se procesa la consulta/cancelación.
- Si respondés con una opción inválida, el bot te mostrará el menú correspondiente.
- El menú de paginación de tickets puede mostrar:
  - `3` o `salir`: Salir
  - `4` o `siguiente`: Siguiente página
  - `5` o `anterior`: Página anterior

## Ejemplos de Uso

**Crear ticket:**
```
1
```
ó
```
generar
```

**Consultar ticket:**
```
2
```
Luego ingresar el número de ticket:
```
1234
```

**Ver todos los tickets:**
```
4
```
ó
```
ver todos
```

**Salir del menú de tickets:**
```
3
```
ó
```
salir
```

**Navegar páginas de tickets:**
```
4
```
ó
```
siguiente
```

**Calificar atención:**
```
1
```
ó
```
4
```

**Ayuda:**
```
5
```
ó
```
ayuda
```

## Notas
- Los comandos pueden escribirse en mayúsculas o minúsculas, y con o sin tildes.
- El bot reconoce variantes y alias para facilitar la experiencia del usuario.
