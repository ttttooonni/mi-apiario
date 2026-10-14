# Mi Apiario — lista de acciones pendientes

Prioridad absoluta: conservar todos los datos e historiales existentes. No marcar como terminada una tarea hasta que pase validaciones y revisión del despliegue.

## Identidad visual
- [x] Definir dirección visual: símbolo apícola moderno con tradición, verde bosque, crema y miel.
- [x] Crear SVG escalable del símbolo y usarlo en la cabecera y navegación.
- [ ] Adaptar el favicon y generar iconos PNG de 192×192 y 512×512.
- [ ] Verificar el icono instalado en Android/iOS y su legibilidad en tamaño pequeño.

## Navegación y acciones rápidas
- [ ] Simplificar navegación móvil a cinco destinos: Inicio, Apiarios, Acción (+), Colmenas y Más.
- [ ] El botón Acción debe abrir un menú inferior funcional, no una ruta vacía.
- [ ] Acciones del menú: Revisión, Sanidad/tratamiento, Alimentación, Producción y Tarea pendiente.
- [ ] Después de elegir la acción, seleccionar una colonia o varias; permitir seleccionar todas o solo las necesarias.
- [ ] Reutilizar lógica y validaciones existentes; no duplicar formularios ni comandos.
- [ ] Mantener Alimentación separada de Sanidad y como operación ocasional.
- [ ] Las acciones en cascada deben crear un registro individual por colonia y mantener su historial.
- [ ] Permitir convertir las colonias excluidas en tareas pendientes, con confirmación clara.
- [ ] Mantener Sanidad, Producción, Histórico y Datos accesibles desde Más.

## Tutorial y ayuda
- [ ] Actualizar la guía para reflejar la navegación definitiva y el menú Acción.
- [ ] Explicar paso a paso selección de apiario, tipo de acción, alcance y colonias.
- [ ] Explicar alimentación ocasional e independiente de Sanidad.
- [ ] Explicar cómo comprobar las acciones guardadas en el historial.
- [ ] Revisar el texto sobre restauración de copias: avisar claramente antes de sustituir datos actuales.

## Datos y calidad — bloqueantes
- [ ] Verificar compatibilidad con registros existentes y copias JSON antiguas.
- [ ] Nunca reemplazar datos por un estado vacío si falla la lectura; proteger la recuperación.
- [ ] Ejecutar typecheck, tests, lint y build de Pages.
- [ ] Probar cascada: selección vacía, todas/parte de colonias, error y tareas pendientes.
- [ ] Revisar manifest, favicon e iconos de instalación.
- [ ] Comprobar GitHub Actions y despliegue publicado antes de anunciar que está listo.
- [ ] Prueba manual en móvil y escritorio; comprobar que los datos existentes siguen visibles.

## Estado conocido
- Las acciones en cascada ya cuentan con lógica reutilizable en el proyecto; revisarla antes de modificarla.
- El tutorial actual ya explica alimentación, acciones en cascada y copias; falta alinearlo con la navegación final.
- La navegación nueva y el menú central aún no están implementados.
