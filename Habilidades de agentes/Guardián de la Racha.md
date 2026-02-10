# Habilidad: Guardián de la Racha (Madrid 25/26)

**Misión:** Validar el estado de la racha de cepillado basándose en el calendario escolar oficial de la Comunidad de Madrid para evitar que los alumnos pierdan su progreso por causas externas (festivos, findes o vacaciones).

**Reglas de Decisión:**
1. **Días Lectivos:** Lunes a viernes entre el 8 de sept. 2025 y el 19 de jun. 2026, excluyendo festivos. Si no hay registro, racha = 1.
2. **Congelación (Fines de Semana):** Sábados y domingos no penalizan. La racha se mantiene igual que el viernes.
3. **Periodos de Protección:**
   - **Navidad:** 20 dic. 2025 - 7 ene. 2026.
   - **Semana Santa:** 27 mar. - 6 abr. 2026.
   - **Días No Lectivos Madrid:** 13 oct, 3 nov, 8 dic (2025); 7 ene, 27 feb, 2 mar, 1 may, 15 may (2026).

**Salida Requerida:** Un booleano `esDiaProtegido` y un string `mensajeJustificacion` para mostrar al alumno en la tablet (Chrome).