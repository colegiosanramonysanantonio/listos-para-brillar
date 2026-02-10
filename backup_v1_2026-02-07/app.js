/**
 * App "Cepillos" - Frontend Logic
 */

const CONFIG = {
    // Reemplazar con la URL del Web App de Google Apps Script tras desplegarlo
    API_URL: 'https://script.google.com/macros/s/AKfycbx2biqu74o6e1SGhc0nAwY4QEoCgtl2zoaQItm__MhEUglioXKzoQIb0ltKQhdhb913/exec',
    OFFLINE_KEY: 'cepillos_offline_records',
    STUDENTS_CACHE_KEY: 'cepillos_students_cache',
    STREAK_KEY: 'cepillos_user_streaks',
    ADMIN_PIN: '1926'
};

// Sistema de Traducción Bilingüe
const TRANSLATIONS = {
    es: {
        title: '¡Listos para brillar! ✨',
        subtitle: 'Elige tu nombre para empezar',
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
        subtitle: 'Choose your name to start',
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

let currentLang = 'es';

function t(key) {
    return TRANSLATIONS[currentLang][key] || key;
}

function getRandomSuccessMessage() {
    const msgs = TRANSLATIONS[currentLang].successMessages;
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
        alumno: ''
    }
};

// ========== STREAK SYSTEM ==========
/**
 * Obtiene la racha actual del usuario
 * @param {string} userId - Identificador único del usuario (curso_grupo_alumno)
 * @returns {Object} { streak: number, lastDate: string }
 */
function getUserStreak(userId) {
    const streaks = JSON.parse(localStorage.getItem(CONFIG.STREAK_KEY) || '{}');
    return streaks[userId] || { streak: 0, lastDate: null };
}

/**
 * Actualiza la racha del usuario
 * @param {string} userId - Identificador único del usuario
 * @param {boolean} brushedToday - Si se cepilló hoy
 */
function updateUserStreak(userId, brushedToday) {
    const streaks = JSON.parse(localStorage.getItem(CONFIG.STREAK_KEY) || '{}');
    const today = new Date().toISOString().split('T')[0];
    const userStreak = streaks[userId] || { streak: 0, lastDate: null };

    if (!brushedToday) {
        // Si dijo "No", no actualizamos la racha
        return userStreak;
    }

    // Si ya registró hoy, no cambiar nada
    if (userStreak.lastDate === today) {
        return userStreak;
    }

    // Calcular si es consecutivo
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (userStreak.lastDate === yesterdayStr) {
        // Racha consecutiva
        userStreak.streak++;
    } else if (userStreak.lastDate === null || userStreak.lastDate < yesterdayStr) {
        // Nueva racha o racha rota
        userStreak.streak = 1;
    }

    userStreak.lastDate = today;
    streaks[userId] = userStreak;
    localStorage.setItem(CONFIG.STREAK_KEY, JSON.stringify(streaks));

    return userStreak;
}

/**
 * Actualiza la visualización de medallas según la racha
 * @param {number} streak - Días consecutivos
 */
function updateMedalsDisplay(streak) {
    const medals = {
        bronze: document.querySelector('.medal.bronze'),
        silver: document.querySelector('.medal.silver'),
        gold: document.querySelector('.medal.gold')
    };

    // Resetear medallas
    Object.values(medals).forEach(m => m?.classList.remove('earned'));

    // Asignar medallas según racha
    if (streak >= 7) {
        medals.bronze?.classList.add('earned');
    }
    if (streak >= 10) {
        medals.silver?.classList.add('earned');
    }
    if (streak >= 18) {
        medals.gold?.classList.add('earned');
    }
}

/**
 * Muestra la racha actual en la pantalla de selección
 * Ahora obtiene la racha desde Google Sheets
 */
async function displayCurrentStreak(curso, grupo, alumno) {
    const achievementsBar = document.getElementById('achievements-bar');
    const streakText = achievementsBar?.querySelector('span:first-child');

    // Mostrar estado de carga
    if (streakText) {
        streakText.textContent = 'Cargando racha...';
    }

    try {
        // Fetch desde el servidor
        const url = `${CONFIG.API_URL}?type=streak&curso=${encodeURIComponent(curso)}&grupo=${encodeURIComponent(grupo)}&alumno=${encodeURIComponent(alumno)}`;
        console.log('Fetching streak from server:', url);

        const response = await fetch(url);
        const data = await response.json();

        console.log('Streak API Response:', data); // DEBUG IMPORTANTE

        if (data.error) {
            console.error('Server reported error:', data.error);
        }

        const streak = data.streak || 0;

        updateMedalsDisplay(streak);

        if (achievementsBar) {
            achievementsBar.style.display = 'flex';
            if (streakText) {
                if (streak > 0) {
                    streakText.textContent = `Racha: ${streak} ${streak === 1 ? 'día' : 'días'}`;
                } else {
                    streakText.textContent = 'Sin racha';
                }
            }
        }

        // También guardar en localStorage como respaldo
        const userId = `${curso}_${grupo}_${alumno}`;
        const streaks = JSON.parse(localStorage.getItem(CONFIG.STREAK_KEY) || '{}');
        streaks[userId] = { streak: streak, lastDate: data.lastDate };
        localStorage.setItem(CONFIG.STREAK_KEY, JSON.stringify(streaks));

    } catch (err) {
        console.error('Error fetching streak:', err);
        // Fallback a localStorage
        const userId = `${curso}_${grupo}_${alumno}`;
        const userStreak = getUserStreak(userId);
        updateMedalsDisplay(userStreak.streak);

        if (achievementsBar && streakText) {
            achievementsBar.style.display = 'flex';
            streakText.textContent = userStreak.streak > 0
                ? `Racha: ${userStreak.streak} ${userStreak.streak === 1 ? 'día' : 'días'}`
                : 'Sin racha';
        }
    }
}

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
    selects.curso.addEventListener('change', (e) => {
        playSound('bubble');
        state.selection.curso = e.target.value;
        state.selection.grupo = '';
        state.selection.alumno = '';
        updateGroupSelect();
        validateSelection();
    });

    selects.grupo.addEventListener('change', (e) => {
        playSound('bubble');
        state.selection.grupo = e.target.value;
        state.selection.alumno = '';
        updateAlumnoSelect();
        validateSelection();
    });

    selects.alumno.addEventListener('change', (e) => {
        playSound('bubble');
        state.selection.alumno = e.target.value;
        validateSelection();

        // Mostrar racha del alumno seleccionado (ahora desde el servidor)
        // Comentado por petición de rediseño: no mostrar en portada
        /*
        if (state.selection.curso && state.selection.grupo && state.selection.alumno) {
            displayCurrentStreak(state.selection.curso, state.selection.grupo, state.selection.alumno);
        }
        */
    });

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

    // Controlar visibilidad de la barra de logros (medallas)
    const achievementsBar = document.getElementById('achievements-bar');
    if (achievementsBar) {
        // Ocultar en selección y en la carrera, mostrar en acción y éxito
        const hideOn = ['selection', 'race', 'admin'];
        achievementsBar.classList.toggle('hidden', hideOn.includes(screenName));
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

    // Actualizar racha del usuario
    const userId = `${state.selection.curso}_${state.selection.grupo}_${state.selection.alumno}`;
    const updatedStreak = updateUserStreak(userId, estado === 'Sí');

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
    }

    // Random success message con racha
    const successMsgEl = document.getElementById('success-msg');
    if (successMsgEl) {
        let message = getRandomSuccessMessage();
        if (estado === 'Sí' && updatedStreak.streak > 1) {
            message += ` 🔥 ¡${updatedStreak.streak} días seguidos!`;
        }
        successMsgEl.textContent = message;
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
    let secondsLeft = 3;
    const countdownEl = document.getElementById('countdown-text');
    countdownEl.textContent = t('countdown').replace('{n}', secondsLeft); // Mostrar "3" inmediatamente

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
            countdownEl.textContent = t('countdown').replace('{n}', 3); // Reset texto para la próxima
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
