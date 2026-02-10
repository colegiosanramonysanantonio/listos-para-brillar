/**
 * App "Cepillos" - Frontend Logic
 */

const CONFIG = {
    // Reemplazar con la URL del Web App de Google Apps Script tras desplegarlo
    API_URL: 'https://script.google.com/macros/s/AKfycbyw6rlTgumUkfiO6fRXB1bk4BNo5YSjoFimwGfeFLcXzPBsXfaBDxiN66pi_z-5baZB/exec',
    OFFLINE_KEY: 'cepillos_offline_records',
    STUDENTS_CACHE_KEY: 'cepillos_students_cache',
    ADMIN_PIN: '1234'
};

// Sistema de Traducción Bilingüe
const TRANSLATIONS = {
    es: {
        title: '✨ ¡Listos para brillar! ✨',
        subtitle: 'Elige tu nombre para empezar',
        course: '🏫 Curso',
        group: '👥 Clase/Grupo',
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
            '¡Dientes de tiburón! 🦈',
            '¡Sonrisa de cine! 🎬',
            '¡Limpieza total! 🧼',
            '¡Brillas como una estrella! ⭐',
            '¡Superbocas! 🦸'
        ]
    },
    en: {
        title: '✨ Ready to Shine! ✨',
        subtitle: 'Choose your name to start',
        course: '🏫 Grade',
        group: '👥 Class/Group',
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
            'Shark Teeth! 🦈',
            'Movie Star Smile! 🎬',
            'Squeaky Clean! 🧼',
            'You Shine Like a Star! ⭐',
            'Super Mouth! 🦸'
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
            showDashboard();
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

// Lógica de Dashboard Admin
function showDashboard() {
    showScreen('admin');
    const statsContainer = document.getElementById('admin-stats-content');
    statsContainer.innerHTML = '<p>Cargando estadísticas de hoy...</p>';

    // Calcular estadísticas desde el caché o registros locales si no hay internet
    const today = new Date().toISOString().split('T')[0];
    // En una versión real, esto se pediría al servidor (GAS), 
    // pero para velocidad lo calculamos local o mostramos mensaje
    statsContainer.innerHTML = `
        <div class="stats-summary">
            <h3>Resumen de Hoy (${today})</h3>
            <p>Aquí el profesor podrá ver el ranking en tiempo real de los cursos que más se han cepillado hoy.</p>
            <button onclick="window.location.reload()" class="btn btn-main">Cerrar Dashboard</button>
        </div>
    `;
}

// Lógica de UI
function showScreen(screenName) {
    Object.keys(screens).forEach(key => {
        screens[key].classList.toggle('hidden', key !== screenName);
    });
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
    }

    // Random success message
    const successMsgEl = document.getElementById('success-msg');
    if (successMsgEl) {
        successMsgEl.textContent = getRandomSuccessMessage();
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
