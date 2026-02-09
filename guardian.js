/**
 * Guardián de la Racha - Calendario Escolar Madrid 2025/2026
 * Misión: Proteger el progreso de los alumnos en días no lectivos.
 */

const GuardianRacha = (function () {
    // Configuración del calendario 25/26
    const CALENDARIO = {
        inicioCurso: '2025-09-08',
        finCurso: '2026-06-19',
        navidad: { inicio: '2025-12-20', fin: '2026-01-07' },
        semanaSanta: { inicio: '2026-03-27', fin: '2026-04-06' },
        festivos: [
            '2025-10-13', // Día no lectivo tras el 12 oct
            '2025-11-01', // Todos los Santos
            '2025-11-03', // Traslado festivo
            '2025-12-06', // Constitución
            '2025-12-08', // Inmaculada
            '2026-02-27', // Día no lectivo
            '2026-03-02', // Día no lectivo
            '2026-05-01', // Día del Trabajo
            '2026-05-02', // Comunidad de Madrid
            '2026-05-15', // San Isidro
        ]
    };

    /**
     * Comprueba si una fecha es protegida (finde, festivo o vacaciones)
     * @param {Date} fecha - Fecha a comprobar (default hoy)
     * @returns {Object} { esDiaProtegido: boolean, mensajeJustificacion: string }
     */
    function verificarDia(fecha = new Date()) {
        const diaSemana = fecha.getDay(); // 0: Dom, 6: Sáb
        const isoDate = fecha.toISOString().split('T')[0];

        // 1. Fines de semana
        if (diaSemana === 0 || diaSemana === 6) {
            return {
                esDiaProtegido: true,
                mensajeJustificacion: (currentLang === 'es' ? '¡Día de descanso! Racha protegida. ¡Tu esfuerzo sigue brillando! ✨' : 'Rest day! Streak protected. Your effort keeps shining! ✨')
            };
        }

        // 2. Navidad
        if (isoDate >= CALENDARIO.navidad.inicio && isoDate <= CALENDARIO.navidad.fin) {
            return {
                esDiaProtegido: true,
                mensajeJustificacion: (currentLang === 'es' ? '¡Modo Vacaciones! Tu racha está a salvo en el arrecife 🎄🌊' : 'Vacation Mode! Your streak is safe in the reef 🎄🌊')
            };
        }

        // 3. Semana Santa
        if (isoDate >= CALENDARIO.semanaSanta.inicio && isoDate <= CALENDARIO.semanaSanta.fin) {
            return {
                esDiaProtegido: true,
                mensajeJustificacion: (currentLang === 'es' ? '¡Modo Vacaciones! Tu racha está a salvo en el arrecife 🕊️🌊' : 'Vacation Mode! Your streak is safe in the reef 🕊️🌊')
            };
        }

        // 4. Festivos específicos
        if (CALENDARIO.festivos.includes(isoDate)) {
            return {
                esDiaProtegido: true,
                mensajeJustificacion: (currentLang === 'es' ? '¡Día especial! Racha protegida. ¡Sigue brillando! ✨' : 'Special day! Streak protected. Keep shining! ✨')
            };
        }

        // 5. Fuera de curso (Verano)
        if (isoDate < CALENDARIO.inicioCurso || isoDate > CALENDARIO.finCurso) {
            return {
                esDiaProtegido: true,
                mensajeJustificacion: (currentLang === 'es' ? '¡Vacaciones de verano! 🏖️' : 'Summer holidays! 🏖️')
            };
        }

        return {
            esDiaProtegido: false,
            mensajeJustificacion: ''
        };
    }

    return {
        verificarDia
    };
})();
