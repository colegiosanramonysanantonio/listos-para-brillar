/**
 * App "Cepillos" - Frontend Logic
 */

const CONFIG = {
    // Reemplazar con la URL del Web App de Google Apps Script tras desplegarlo
    API_URL: 'https://script.google.com/macros/s/AKfycbyuZlGw3PGWyPgqjUWXGyXb95gCdyECtoNw5ECYSCmjP7WiAs-pqCbaDV2FvKH-i6Rt/exec',
    OFFLINE_KEY: 'cepillos_offline_records',
    STUDENTS_CACHE_KEY: 'cepillos_students_cache',
    STREAK_KEY: 'cepillos_streaks',
    ADMIN_PIN: '1926'
};

// Sistema de Traducción Bilingüe
const TRANSLATIONS = {
    es: {
        title: '¡Listos para brillar! ✨',
        subtitle: 'Elige tu curso para empezar',
        course: '🏫 Curso',
        group: '👥 Grupo',
        who: '👤 ¿Quién eres?',
        selectCourse: 'Selecciona curso...',
        selectGroup: 'Selecciona grupo...',
        searchName: 'Busca tu nombre...',
        next: 'Siguiente 👉',
        viewRace: 'Ver Carrera 🏆',
        question: '¿Hoy te has lavado los dientes,',
        done: '¡Hecho!',
        notYet: 'Aún no...',
        back: '⬅️ Volver atrás',
        raceTitle: '🏆 La Gran Carrera',
        raceSubtitle: '¿Qué curso llegará primero a la meta?',
        backToReg: 'Volver al Registro',
        countdown: 'Volviendo al inicio en {n} segundos...',
        successMessages: [
            'Brillas como una estrella ⭐',
            'Hoy iluminas la clase 💡',
            'Sonrisa de campeón 🏆',
            'Estás que reluces ✨',
            'Has encendido tu sonrisa 🔆',
            'Dientes limpios, sonrisa feliz 😁🦷',
            'Misión dientes limpios: superada ✅🎯'
        ]
    },
    en: {
        title: 'Ready to Shine! ✨',
        subtitle: 'Choose your grade to start',
        course: '🏫 Grade',
        group: '👥 Group',
        who: '👤 Who are you?',
        selectCourse: 'Select grade...',
        selectGroup: 'Select group...',
        searchName: 'Find your name...',
        next: 'Next 👉',
        viewRace: 'View Race 🏆',
        question: 'Did you brush your teeth today,',
        done: 'Done!',
        notYet: 'Not yet...',
        back: '⬅️ Go Back',
        raceTitle: '🏆 The Great Race',
        raceSubtitle: 'Which grade will reach the finish line first?',
        backToReg: 'Back to Register',
        countdown: 'Returning home in {n} seconds...',
        successMessages: [
            'You shine like a star ⭐',
            'You brighten up the class 💡',
            'Champion smile 🏆',
            'You are glowing ✨',
            'You lit up your smile 🔆',
            'Clean teeth, happy smile 😁🦷',
            'Clean teeth mission: complete ✅🎯'
        ]
    }
};

// Mensajes de racha por nivel
const STREAK_MESSAGES = {
    es: {
        level1: [
            '¡Buen comienzo! Estás dando el primer paso hacia una sonrisa de estrella ⭐',
            '¡Primeros días superados! El arrecife ya empieza a brillar gracias a ti 🪸',
            '¡Pequeño gran paso! Pronto serás un auténtico experto 🌟',
            '¡Calentamiento completado! Tu muela de fuego acaba de encenderse 🔥'
        ],
        level2: [
            '¡Eres constante como las mareas! Tus dientes ya brillan como perlas 💎',
            '¡Qué energía! Se nota que te tomas en serio la protección de tu arrecife dental 🐠',
            '¡Imparable! Estás entrenando tu sonrisa igual que entrenas en EF 💪',
            '¡Cuidado! Tu muela está empezando a soltar chispas de pura limpieza ✨'
        ],
        level3: [
            '¡Nivel Capitán desbloqueado! Tienes la sonrisa más brillante de todo el colegio 👑',
            '¡Eres un auténtico Guardián del Arrecife! Nada puede con tu constancia 🛡️',
            '¡Leyenda del cepillado! Tienes la disciplina de un gran campeón 🏆',
            '¡Increíble! Tu corona de fuego ilumina hasta el rincón más oscuro del mar 🌊'
        ]
    },
    en: {
        level1: [
            'Great start! You are taking the first step towards a star smile ⭐',
            'First days done! The reef is starting to shine thanks to you 🪸',
            'Small big step! Soon you will be a true expert 🌟',
            'Warm-up complete! Your fire tooth just lit up 🔥'
        ],
        level2: [
            'You are steady like the tides! Your teeth shine like pearls 💎',
            'Such energy! You really care about your dental reef 🐠',
            'Unstoppable! Training your smile like you train in PE 💪',
            'Watch out! Your tooth is sparking with pure cleanliness ✨'
        ],
        level3: [
            'Captain level unlocked! The brightest smile in school 👑',
            'A true Reef Guardian! Nothing can beat your consistency 🛡️',
            'Brushing legend! Champion-level discipline 🏆',
            'Amazing! Your fire crown lights up the darkest corner of the sea 🌊'
        ]
    }
};

let currentLang = 'es';

function t(key) {
    return TRANSLATIONS[currentLang][key] || key;
}

function getRandomSuccessMessage() {
    const msgs = TRANSLATIONS[currentLang].successMessages;
    return msgs[Math.floor(Math.random() * msgs.length)];
}

// ========== STREAK SYSTEM ==========
function getStreakKey(curso, grupo, alumno) {
    return `${curso}_${grupo}_${alumno}`;
}

function getStreakData(key) {
    const streaks = JSON.parse(localStorage.getItem(CONFIG.STREAK_KEY) || '{}');
    return streaks[key] || { count: 0, lastDate: null };
}

function updateStreak(curso, grupo, alumno) {
    const key = getStreakKey(curso, grupo, alumno);
    const streaks = JSON.parse(localStorage.getItem(CONFIG.STREAK_KEY) || '{}');
    const data = streaks[key] || { count: 0, lastDate: null };

    const today = new Date().toDateString();
    const lastDate = data.lastDate ? new Date(data.lastDate).toDateString() : null;

    if (lastDate === today) {
        // Mismo día: mantener racha
        return data.count;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    if (lastDate === yesterdayStr) {
        // Día consecutivo: incrementar
        data.count = data.count + 1;
    } else {
        // Más de un día o primera vez: reiniciar a 1
        data.count = 1;
    }

    data.lastDate = new Date().toISOString();
    streaks[key] = data;
    localStorage.setItem(CONFIG.STREAK_KEY, JSON.stringify(streaks));

    return data.count;
}

function getStreakLevel(count) {
    if (count >= 11) return 3;
    if (count >= 4) return 2;
    return 1;
}

function getRandomStreakMessage(level) {
    const levelKey = `level${level}`;
    const msgs = STREAK_MESSAGES[currentLang][levelKey];
    return msgs[Math.floor(Math.random() * msgs.length)];
}

// Audio Feedback System using Web Audio API
let audioContext = null;

function getAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContext;
}

function playSound(name) {
    try {
        const ctx = getAudioContext();
        if (ctx.state === 'suspended') ctx.resume();

        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        if (name === 'bling') {
            // Sonido de éxito: tono alegre ascendente
            oscillator.frequency.setValueAtTime(523, ctx.currentTime); // C5
            oscillator.frequency.setValueAtTime(659, ctx.currentTime + 0.1); // E5
            oscillator.frequency.setValueAtTime(784, ctx.currentTime + 0.2); // G5
            gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.4);
        } else if (name === 'bubble') {
            // Sonido de burbuja: tono suave
            oscillator.frequency.setValueAtTime(400, ctx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.15);
        } else if (name === 'pop') {
            // Sonido de pop: explosión corta para botones
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(800, ctx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.08);
            gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.1);
        }
    } catch (e) { /* Silent fail for unsupported browsers */ }
}

// Estado de la App
let state = {
    allStudents: {}, // Estructura: { "1º": { "A": ["Juan", "Ana"], "B": [...] }, ... }
    selection: {
        curso: '',
        grupo: '',
        alumno: '',
        currentStreak: 0,
        streakLastDate: null
    }
};

// Sistema de racha eliminado - los datos vienen solo de Google Sheets


// Selectores
const screens = {
    selection: document.getElementById('selection-screen'),
    action: document.getElementById('action-screen'),
    success: document.getElementById('success-screen'),
    race: document.getElementById('race-screen'),
    admin: document.getElementById('admin-screen')
};

const selects = {
    curso: document.getElementById('select-curso'),
    grupo: document.getElementById('select-grupo'),
    alumno: document.getElementById('select-alumno')
};

const buttons = {
    next: document.getElementById('btn-next'),
    yes: document.getElementById('btn-yes'),
    no: document.getElementById('btn-no'),
    back: document.getElementById('btn-back'),
    admin: document.getElementById('btn-admin-access')
};

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    loadCachedStudents();
    fetchStudents();
    setupEventListeners();
    syncOfflineRecords();
});

function setupEventListeners() {
    // Referencias a los contenedores de form-group
    const fgGrupo = document.getElementById('fg-grupo');
    const fgAlumno = document.getElementById('fg-alumno');

    selects.curso.addEventListener('change', (e) => {
        playSound('bubble');
        state.selection.curso = e.target.value;
        state.selection.grupo = '';
        state.selection.alumno = '';
        updateGroupSelect();
        validateSelection();

        // CASCADA: Mostrar grupo con animación
        if (e.target.value && fgGrupo) {
            fgGrupo.classList.remove('hidden-cascade');
            fgGrupo.classList.add('visible-cascade');
        } else if (fgGrupo) {
            fgGrupo.classList.add('hidden-cascade');
            fgGrupo.classList.remove('visible-cascade');
            fgAlumno.classList.add('hidden-cascade');
            fgAlumno.classList.remove('visible-cascade');
            buttons.next.classList.add('hidden');
        }
    });

    selects.grupo.addEventListener('change', (e) => {
        playSound('bubble');
        state.selection.grupo = e.target.value;
        state.selection.alumno = '';
        updateAlumnoSelect();
        validateSelection();

        // CASCADA: Mostrar alumno con animación (sin focus automático)
        if (e.target.value && fgAlumno) {
            fgAlumno.classList.remove('hidden-cascade');
            fgAlumno.classList.add('visible-cascade');
        } else if (fgAlumno) {
            fgAlumno.classList.add('hidden-cascade');
            fgAlumno.classList.remove('visible-cascade');
            buttons.next.classList.add('hidden');
        }
    });

    selects.alumno.addEventListener('change', async (e) => {
        playSound('bubble');
        state.selection.alumno = e.target.value;
        validateSelection();

        // CASCADA: Mostrar botón siguiente y cargar racha del servidor
        if (e.target.value) {
            buttons.next.classList.remove('hidden');
            // Cargar racha real desde Sheets
            fetchStreakFromServer();
        } else {
            buttons.next.classList.add('hidden');
        }
    });

    /**
     * Consulta la racha actual al servidor para el alumno seleccionado
     */
    async function fetchStreakFromServer() {
        const { curso, grupo, alumno } = state.selection;
        const originalText = buttons.next.textContent;

        buttons.next.disabled = true;
        buttons.next.textContent = currentLang === 'es' ? '⌛ Cargando racha...' : '⌛ Loading streak...';

        try {
            const url = `${CONFIG.API_URL}?type=streak&curso=${encodeURIComponent(curso)}&grupo=${encodeURIComponent(grupo)}&alumno=${encodeURIComponent(alumno)}`;
            console.log("Consultando racha en:", url);

            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const data = await response.json();
            state.selection.currentStreak = data.streak || 0;
            state.selection.streakLastDate = data.lastDate || null;
            console.log(`✅ Racha de ${alumno} cargada desde servidor: ${state.selection.currentStreak} (Último: ${state.selection.streakLastDate})`);

            // Si hay racha, podemos dar un pequeño feedback visual
            if (state.selection.currentStreak > 0) {
                buttons.next.textContent = (currentLang === 'es' ? '¡Listo! Siguiente' : 'Ready! Next') + ' 🔥';
            } else {
                buttons.next.textContent = originalText;
            }
        } catch (e) {
            console.error("❌ Error cargando racha de Sheets:", e);
            // Fallback a racha local
            const key = getStreakKey(curso, grupo, alumno);
            const localData = getStreakData(key);
            state.selection.currentStreak = localData.count;
            buttons.next.textContent = originalText;
        } finally {
            buttons.next.disabled = false;
            // Si el texto sigue siendo el de carga, restaurar
            if (buttons.next.textContent.includes('⌛')) {
                buttons.next.textContent = originalText;
            }
        }
    }

    buttons.next.addEventListener('click', () => {
        playSound('bubble');
        showScreen('action');
        document.getElementById('greeting-name').textContent = `${t('question')} ${state.selection.alumno}?`;
    });

    buttons.back.addEventListener('click', () => {
        playSound('bubble');
        showScreen('selection');
    });

    buttons.yes.addEventListener('click', () => submitRanking('Sí'));
    buttons.no.addEventListener('click', () => submitRanking('No'));

    buttons.admin.addEventListener('click', () => {
        const pin = prompt('Introduce el PIN de Administrador (Cole):');
        if (pin === CONFIG.ADMIN_PIN) {
            renderAdminPanel();
        } else {
            alert('PIN incorrecto');
        }
    });

    // Race Screen
    const btnShowRace = document.getElementById('btn-show-race');
    const btnRaceBack = document.getElementById('btn-race-back');

    if (btnShowRace) {
        btnShowRace.addEventListener('click', () => {
            playSound('bubble');
            showScreen('race');
            fetchRaceStats();
        });
    }

    if (btnRaceBack) {
        btnRaceBack.addEventListener('click', () => {
            playSound('bubble');
            showScreen('selection');
        });
    }

    // Language Toggle
    const btnLang = document.getElementById('btn-lang-toggle');
    if (btnLang) {
        btnLang.addEventListener('click', () => {
            playSound('bubble');
            currentLang = currentLang === 'es' ? 'en' : 'es';
            updateUILanguage();
        });
    }
}

// ========== ADMIN PANEL LOGIC ==========
function renderAdminPanel() {
    showScreen('admin');
    const mainMenu = document.getElementById('admin-main-menu');
    const contentArea = document.getElementById('admin-content');

    mainMenu.classList.remove('hidden');
    contentArea.classList.add('hidden');
    contentArea.innerHTML = '';

    // Main Menu Listeners
    document.getElementById('btn-admin-reset').onclick = () => {
        playSound('bubble');
        showResetConfirmation();
    };

    document.getElementById('btn-admin-back').onclick = () => {
        playSound('bubble');
        showScreen('selection');
    };
}

function showResetConfirmation() {
    const mainMenu = document.getElementById('admin-main-menu');
    const contentArea = document.getElementById('admin-content');

    mainMenu.classList.add('hidden');
    contentArea.classList.remove('hidden');

    contentArea.innerHTML = `
        <div class="reset-warning">
            <span class="icon" style="font-size: 3rem;">⚠️</span>
            <strong>¿REINICIAR COMPETICIÓN?</strong>
            <p>Se borrarán todos los registros de la carrera y se pondrán a cero las casillas de todos los alumnos de todas las clases.</p>
            <p style="font-size: 0.8rem; opacity: 0.7; margin-top: 10px;">Esta acción no se puede deshacer.</p>
            
            <div class="admin-actions-bar" style="justify-content: center; margin-top: 25px;">
                <button id="btn-confirm-reset" class="btn btn-main" style="background: #ff7675;">Sí, REINICIAR</button>
                <button id="btn-cancel-reset" class="btn btn-link">Mejor no...</button>
            </div>
        </div>
    `;

    document.getElementById('btn-confirm-reset').onclick = async () => {
        const pin = prompt('Escribe "RESET" para confirmar:');
        if (pin === 'RESET') {
            try {
                const response = await fetch(CONFIG.API_URL, {
                    method: 'POST',
                    body: JSON.stringify({ action: 'resetCompetition' })
                });
                const res = await response.json();
                if (res.status === 'ok') {
                    alert('Competición reiniciada con éxito.');
                    window.location.reload();
                }
            } catch (e) {
                alert('Error al reiniciar: ' + e);
            }
        }
    };

    document.getElementById('btn-cancel-reset').onclick = () => {
        playSound('bubble');
        renderAdminPanel();
    };
}

// Lógica de UI
function showScreen(screenName) {
    Object.keys(screens).forEach(key => {
        screens[key].classList.toggle('hidden', key !== screenName);
    });

    // Ocultar siempre la barra de medallas (usuario la reemplazará luego)
    const achievementsBar = document.getElementById('achievements-bar');
    if (achievementsBar) {
        achievementsBar.classList.add('hidden');
    }

    // Ocultar botones de idioma y ajustes en pantallas secundarias
    const headerLeft = document.querySelector('.app-header-left');
    const headerRight = document.querySelector('.app-header-right');
    const showHeaderButtons = (screenName === 'selection' || screenName === 'race');

    if (headerLeft) headerLeft.classList.toggle('hidden', !showHeaderButtons);
    if (headerRight) headerRight.classList.toggle('hidden', !showHeaderButtons);


    // RESET CASCADA: Al volver a selección, ocultar grupo/alumno/siguiente
    if (screenName === 'selection') {
        const fgGrupo = document.getElementById('fg-grupo');
        const fgAlumno = document.getElementById('fg-alumno');
        const btnNext = document.getElementById('btn-next');

        if (fgGrupo) {
            fgGrupo.classList.add('hidden-cascade');
            fgGrupo.classList.remove('visible-cascade');
        }
        if (fgAlumno) {
            fgAlumno.classList.add('hidden-cascade');
            fgAlumno.classList.remove('visible-cascade');
        }
        if (btnNext) {
            btnNext.classList.add('hidden');
        }

        // Reset selects
        if (selects.curso) selects.curso.value = '';
        if (selects.grupo) {
            selects.grupo.value = '';
            selects.grupo.disabled = true;
        }
        if (selects.alumno) {
            selects.alumno.value = '';
            selects.alumno.disabled = true;
        }

        // Reset state
        state.selection = { curso: '', grupo: '', alumno: '' };
    }
}


function updateCursoSelect() {
    const cursos = Object.keys(state.allStudents);
    selects.curso.innerHTML = '<option value="">Selecciona curso...</option>' +
        cursos.map(c => `<option value="${c}">${c}</option>`).join('');

    // Resetear grupo y alumno al cargar cursos
    selects.grupo.innerHTML = '<option value="">Selecciona grupo...</option>';
    selects.grupo.disabled = true;
    selects.alumno.innerHTML = '<option value="">Busca tu nombre...</option>';
    selects.alumno.disabled = true;
}

function updateGroupSelect() {
    const curso = state.selection.curso;
    if (curso && state.allStudents[curso]) {
        const grupos = Object.keys(state.allStudents[curso]);
        selects.grupo.innerHTML = '<option value="">Selecciona grupo...</option>' +
            grupos.map(g => `<option value="${g}">${g}</option>`).join('');
        selects.grupo.disabled = false;
    } else {
        selects.grupo.innerHTML = '<option value="">Selecciona grupo...</option>';
        selects.grupo.disabled = true;
    }
    updateAlumnoSelect();
}

function updateAlumnoSelect() {
    const { curso, grupo } = state.selection;
    if (curso && grupo !== undefined && state.allStudents[curso] && state.allStudents[curso][grupo]) {
        const nombres = state.allStudents[curso][grupo];
        selects.alumno.innerHTML = '<option value="">Busca tu nombre...</option>' +
            nombres.map(n => `<option value="${n}">${n}</option>`).join('');
        selects.alumno.disabled = false;
    } else {
        selects.alumno.innerHTML = '<option value="">Busca tu nombre...</option>';
        selects.alumno.disabled = true;
    }
}

function validateSelection() {
    const { curso, grupo, alumno } = state.selection;
    buttons.next.disabled = !(curso && grupo && alumno);
}

// API e Integración
async function fetchStudents() {
    try {
        const response = await fetch(CONFIG.API_URL);
        const data = await response.json();
        if (data.error) throw new Error(data.error);

        state.allStudents = data;
        localStorage.setItem(CONFIG.STUDENTS_CACHE_KEY, JSON.stringify(data));
        updateCursoSelect();
    } catch (err) {
        console.error('Error cargando alumnos, usando caché:', err);
    }
}

function loadCachedStudents() {
    const cached = localStorage.getItem(CONFIG.STUDENTS_CACHE_KEY);
    if (cached) {
        state.allStudents = JSON.parse(cached);
        updateCursoSelect();
    } else {
        // Datos de ejemplo para el primer arranque si no hay internet
        state.allStudents = {
            "1º": { "A": ["Hugo", "Lucía", "Mateo"], "B": ["Sara", "Dani"] },
            "2º": { "A": ["Martina", "Leo"], "B": ["Emma", "Bruno"] }
        };
        updateCursoSelect();
    }
}

async function submitRanking(estado) {
    const payload = {
        ...state.selection,
        estado: estado,
        timestamp: new Date().toISOString()
    };

    showScreen('success');

    // Gamification: sound and confetti for positive action
    if (estado === 'Sí') {
        playSound('bling');
        if (typeof confetti === 'function') {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 }
            });
        }

        // Feedback visual del Guardián si hoy es festivo/finde
        const todayObj = new Date();
        const proteccion = GuardianRacha.verificarDia(todayObj);

        // Actualizar racha:
        // Si la racha es 0, siempre subimos a 1 (primer registro)
        // PROTECCIÓN ESTRICTA: Si es día protegido, NO sumamos racha. Solo mantenemos.

        const todayStr = todayObj.toISOString().split('T')[0];
        const serverLastDateStr = state.selection.streakLastDate ? state.selection.streakLastDate.split('T')[0] : null;

        let streak = state.selection.currentStreak;

        if (proteccion.esDiaProtegido) {
            console.log("🛡️ Día protegido. Racha congelada (no suma, no resta).");
            // No tocamos 'streak', se queda como vino del servidor o caché
        } else if (streak === 0) {
            streak = 1;
        } else if (serverLastDateStr && serverLastDateStr !== todayStr) {
            // Comprobar si se ha roto la racha (¿hubo días lectivos vacíos en medio?)
            let dateCursor = new Date(serverLastDateStr);
            dateCursor.setDate(dateCursor.getDate() + 1); // Empezamos el día después del último registro

            let rachaRota = false;
            const todayLimit = new Date(todayStr);

            while (dateCursor < todayLimit) {
                const check = GuardianRacha.verificarDia(dateCursor);
                if (!check.esDiaProtegido) {
                    // Si encontramos un día lectivo que NO se registró, la racha se rompe
                    rachaRota = true;
                    break;
                }
                dateCursor.setDate(dateCursor.getDate() + 1);
            }

            if (rachaRota) {
                console.log("⚠️ Racha interrumpida por falta de limpieza en día lectivo. Reiniciando.");
                streak = 1;
            } else {
                streak = streak + 1;
            }
        } else {
            console.log("La racha del servidor ya incluía hoy. No sumamos.");
        }
        if (proteccion.esDiaProtegido) {
            console.log("🛡️ Guardián activado:", proteccion.mensajeJustificacion);
            // Podríamos mostrar el mensaje en la UI si quisiéramos
        }

        const level = getStreakLevel(streak);

        // Actualizar UI de racha
        const muelaImg = document.getElementById('streak-muela');
        const daysEl = document.getElementById('streak-days');
        const labelEl = document.getElementById('streak-label');
        const messageEl = document.getElementById('streak-message');

        if (muelaImg) muelaImg.src = `img/Muela de fuego-nivel ${level}.svg`;
        if (daysEl) daysEl.textContent = streak;
        if (labelEl) labelEl.textContent = streak === 1 ? (currentLang === 'es' ? 'día' : 'day') : (currentLang === 'es' ? 'días' : 'days');

        // Mensaje: Si hoy es día protegido, el Guardián aparece en el mensaje
        if (proteccion.esDiaProtegido && messageEl) {
            messageEl.innerHTML = `<span style="color: #FFD700; font-weight: bold;">🛡️ ${proteccion.mensajeJustificacion}</span><br>${getRandomStreakMessage(level)}`;
        } else if (messageEl) {
            messageEl.textContent = getRandomStreakMessage(level);
        }

        // Sincronizar localmente también por seguridad
        const key = getStreakKey(state.selection.curso, state.selection.grupo, state.selection.alumno);
        const streaks = JSON.parse(localStorage.getItem(CONFIG.STREAK_KEY) || '{}');
        streaks[key] = { count: streak, lastDate: new Date().toISOString() };
        localStorage.setItem(CONFIG.STREAK_KEY, JSON.stringify(streaks));
    } else {
        // Si dice "No", mostrar mensaje de ánimo sin incrementar racha
        const muelaImg = document.getElementById('streak-muela');
        const daysEl = document.getElementById('streak-days');
        const labelEl = document.getElementById('streak-label');
        const messageEl = document.getElementById('streak-message');

        if (muelaImg) muelaImg.src = 'img/Muela de fuego-nivel 1.svg';
        if (daysEl) daysEl.textContent = '🦷';
        if (labelEl) labelEl.textContent = '';
        if (messageEl) messageEl.textContent = currentLang === 'es' ? '¡Mañana será un gran día para cepillarte!' : 'Tomorrow will be a great day to brush!';
    }


    // Enviar en segundo plano (sin await para no bloquear la UI)
    fetch(CONFIG.API_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }).then(() => {
        console.log('Registro enviado correctamente');
    }).catch(err => {
        console.warn('Error de red, guardando para sincronizar después:', err);
        saveOffline(payload);
    });

    // Volver al inicio con cuenta atrás dinámica
    // Más tiempo para los más pequeños (1º y 2º)
    const curso = state.selection.curso;
    const esInfantil = curso.startsWith('1') || curso.startsWith('2');
    let secondsLeft = esInfantil ? 10 : 7;
    const countdownEl = document.getElementById('countdown-text');
    countdownEl.textContent = t('countdown').replace('{n}', secondsLeft);

    const interval = setInterval(() => {
        secondsLeft--;
        if (secondsLeft > 0) {
            countdownEl.textContent = t('countdown').replace('{n}', secondsLeft);
        } else {
            clearInterval(interval);
            // Reset y volver al inicio
            state.selection = { curso: '', grupo: '', alumno: '' };
            selects.curso.value = '';
            updateGroupSelect();
            validateSelection();
            countdownEl.textContent = ''; // Reset texto
            showScreen('selection');
        }
    }, 700);
}

// Gestión Offline
function saveOffline(payload) {
    const records = JSON.parse(localStorage.getItem(CONFIG.OFFLINE_KEY) || '[]');
    records.push(payload);
    localStorage.setItem(CONFIG.OFFLINE_KEY, JSON.stringify(records));
}

async function syncOfflineRecords() {
    const records = JSON.parse(localStorage.getItem(CONFIG.OFFLINE_KEY) || '[]');
    if (records.length === 0) return;

    console.log(`Sincronizando ${records.length} registros pendientes...`);

    // Intentar enviar registros uno a uno
    const remaining = [];
    for (const record of records) {
        try {
            await fetch(CONFIG.API_URL, {
                method: 'POST',
                mode: 'no-cors',
                body: JSON.stringify(record)
            });
        } catch (err) {
            remaining.push(record);
        }
    }

    localStorage.setItem(CONFIG.OFFLINE_KEY, JSON.stringify(remaining));
}

// Race Screen Logic
async function fetchRaceStats() {
    const container = document.getElementById('race-container');
    container.innerHTML = '<div class="loading-race">Calculando posiciones... 🏎️💨</div>';

    try {
        const response = await fetch(`${CONFIG.API_URL}?type=stats`);
        const stats = await response.json();

        if (stats.error) throw new Error(stats.error);

        // Convert to array, filter out non-course keys, and sort
        const sorted = Object.entries(stats)
            .filter(([key]) => key !== 'debug_info' && key !== 'error')
            .map(([curso, count]) => ({ curso, count }))
            .sort((a, b) => b.count - a.count);

        const maxCount = sorted[0]?.count || 1;

        container.innerHTML = sorted.map((item, index) => {
            const widthPercent = Math.max(10, (item.count / maxCount) * 100);
            const isLeader = index === 0 && item.count > 0;
            return `
                <div class="race-bar-wrapper">
                    <span class="race-label">${item.curso}</span>
                    <div class="race-bar ${isLeader ? 'leader' : ''}" style="width: ${widthPercent}%">
                        ${item.count} ${isLeader ? '🏆' : ''}
                    </div>
                </div>
            `;
        }).join('');
    } catch (err) {
        console.error('Error fetching race stats:', err);
        container.innerHTML = '<p>No se pudieron cargar las estadísticas. Inténtalo de nuevo.</p>';
    }
}

// Language UI Update
function updateUILanguage() {
    // Selection Screen
    const titleEl = document.querySelector('#selection-screen header h1');
    const subtitleEl = document.querySelector('#selection-screen header p');
    if (titleEl) titleEl.textContent = t('title');
    if (subtitleEl) subtitleEl.textContent = t('subtitle');

    // Labels
    const labels = document.querySelectorAll('#selection-screen label');
    if (labels[0]) labels[0].textContent = t('course');
    if (labels[1]) labels[1].textContent = t('group');
    if (labels[2]) labels[2].textContent = t('who');

    // Buttons
    const btnNext = document.getElementById('btn-next');
    const btnShowRace = document.getElementById('btn-show-race');
    const btnYes = document.querySelector('#btn-yes .text');
    const btnNo = document.querySelector('#btn-no .text');
    const btnBack = document.getElementById('btn-back');
    const btnRaceBack = document.getElementById('btn-race-back');

    if (btnNext) btnNext.innerHTML = t('next');
    if (btnShowRace) btnShowRace.innerHTML = t('viewRace');
    if (btnYes) btnYes.textContent = t('done');
    if (btnNo) btnNo.textContent = t('notYet');
    if (btnBack) btnBack.innerHTML = t('back');
    if (btnRaceBack) btnRaceBack.textContent = t('backToReg');

    // Race Screen
    const raceTitleEl = document.querySelector('#race-screen header h1');
    const raceSubEl = document.querySelector('#race-screen header p');
    if (raceTitleEl) raceTitleEl.textContent = t('raceTitle');
    if (raceSubEl) raceSubEl.textContent = t('raceSubtitle');

    // Update select placeholders
    selects.curso.querySelector('option[value=""]').textContent = t('selectCourse');
    selects.grupo.querySelector('option[value=""]').textContent = t('selectGroup');
    selects.alumno.querySelector('option[value=""]').textContent = t('searchName');

    // Language button text
    const btnLang = document.getElementById('btn-lang-toggle');
    if (btnLang) btnLang.textContent = currentLang === 'es' ? '🇬🇧 EN' : '🇪🇸 ES';
}

// ========== SECRET DEBUG SYSTEM ==========
let logoClicks = 0;
let logoTimer = null;

document.addEventListener('click', (e) => {
    if (e.target.classList.contains('school-logo')) {
        logoClicks++;
        clearTimeout(logoTimer);
        logoTimer = setTimeout(() => { logoClicks = 0; }, 2000);

        if (logoClicks >= 5) {
            const panel = document.getElementById('test-panel');
            if (panel) {
                panel.classList.toggle('hidden');
                if (!panel.classList.contains('hidden')) {
                    console.log("🕵️ Modo Desarrollador Activado");
                    playSound('bling');
                }
            }
            logoClicks = 0;
        }
    }
});

/**
 * Función de depuración para probar rachas desde la UI
 * @param {number} days - Número de días de racha a simular
 */
window.debugSetStreak = function (days) {
    const curso = selects.curso.value;
    const grupo = selects.grupo.value;
    const alumno = selects.alumno.value;

    if (!alumno) {
        alert(currentLang === 'es' ? '¡Primero selecciona un alumno!' : 'Please select a student first!');
        return;
    }

    const key = getStreakKey(curso, grupo, alumno);
    const streaks = JSON.parse(localStorage.getItem(CONFIG.STREAK_KEY) || '{}');

    // Simulamos que ayer fue su último cepillado para que hoy sume 1
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    streaks[key] = {
        count: days - 1,
        lastDate: yesterday.toISOString()
    };

    localStorage.setItem(CONFIG.STREAK_KEY, JSON.stringify(streaks));
    alert(currentLang === 'es' ?
        `✅ Datos preparados. ¡Ahora pulsa "Siguiente" y luego "¡Hecho!" para enviar el registro real a Google Sheets con racha de ${days} días!` :
        `✅ Data ready. Click "Next" and then "Done!" to send a real record to Google Sheets with a ${days}-day streak!`);
};

// Toast System
function showToast(message, type = 'info') {
    let toast = document.getElementById('app-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'app-toast';
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.className = 	oast visible ;
    setTimeout(() => { toast.classList.remove('visible'); }, 3000);
}

// Online/Offline Listeners
window.addEventListener('online', () => {
    showToast(currentLang === 'es' ? 'Conexi�n recuperada ??' : 'Connection restored ??', 'success');
    syncOfflineRecords();
});

window.addEventListener('offline', () => {
    showToast(currentLang === 'es' ? 'Modo sin conexi�n ??' : 'Offline mode ??', 'warning');
});
