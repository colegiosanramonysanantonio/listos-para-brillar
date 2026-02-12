/**
 * App "Cepillos" - Frontend Logic v4.0
 * Performance Audit: Dead code removal, memory leak fixes, DOM optimization
 */

const CONFIG = {
    API_URL: 'https://script.google.com/macros/s/AKfycbz_vgiIW-1fRFrb0JT7pXfamYZnZAtktfGjCYnTLm9G51j-a2rQyvz4gT4AZVuZHW_P/exec',
    OFFLINE_KEY: 'cepillos_offline_records',
    STUDENTS_CACHE_KEY: 'cepillos_students_cache',
    ADMIN_PIN: '1926'
};

const TRANSLATIONS = {
    es: {
        loading: 'Cargando...',
        intro_title: '¡Listos para brillar! ✨',
        intro_subtitle: 'Elige tu curso para empezar',
        label_course: '🏫 Curso',
        label_group: '👥 Grupo',
        label_student: '👤 ¿Quién eres?',
        select_course: 'Selecciona curso...',
        select_group: 'Selecciona grupo...',
        select_student: 'Busca tu nombre...',
        btn_next: 'Siguiente 👉',
        greeting_prefix: '¡Hola, ',
        question: '¿Tus dientes ya están listos para brillar?',
        streak_days: 'días',
        success_title: '¡Genial!',
        offline_mode: 'Modo sin conexión 📡',
        connection_restored: 'Conexión recuperada 📡',
        sending: 'Enviando...',
        btn_race: 'Ver Carrera 🏆',
        btn_admin_back: '⬅️ Salir del Panel',
        countdown_prefix: 'Volviendo en ',
        race_title: '🏆 La Gran Carrera',
        race_subtitle: '¿Qué curso va en cabeza?',
        race_loading: 'Calculando posiciones... 🏎️💨',
        btn_back_home: 'Volver al Inicio',
        btn_yes: '¡Sí, brillan! ✨',
        btn_no: 'Volver atrás',
        messages_lower: [
            "<span class='emoji-small'>⭐</span> Brillas como una estrella",
            "<span class='emoji-small'>🏆</span> Sonrisa de campeón",
            "<span class='emoji-small'>😁🦷</span> Dientes limpios, sonrisa feliz",
            "<span class='emoji-small'>✨</span> Estás que reluces"
        ],
        messages_upper: [
            "<span class='emoji-small'>🚀</span> Nivel brillo máximo",
            "<span class='emoji-small'>🎯</span> Tu sonrisa gana puntos",
            "<span class='emoji-small'>💡</span> Hoy iluminas la clase",
            "<span class='emoji-small'>🔆</span> Has encendido tu sonrisa",
            "<span class='emoji-small'>🎯</span> Misión dientes limpios: superada"
        ],
        streak_day_singular: 'DÍA',
        streak_day_plural: 'DÍAS',
        btn_back_generic: '⬅️ Volver atrás',
        class_prefix: 'Clase '
    },
    en: {
        loading: 'Loading...',
        intro_title: 'Ready to Shine! ✨',
        intro_subtitle: 'Choose your grade to start',
        label_course: '🏫 Grade',
        label_group: '👥 Class',
        label_student: '👤 Who are you?',
        select_course: 'Select grade...',
        select_group: 'Select class...',
        select_student: 'Find your name...',
        btn_next: 'Next 👉',
        greeting_prefix: 'Hello, ',
        question: 'Are your teeth ready to shine?',
        streak_days: 'days',
        success_title: 'Awesome!',
        offline_mode: 'Offline mode 📡',
        connection_restored: 'Connection restored 📡',
        sending: 'Sending...',
        btn_race: 'See Race 🏆',
        btn_back_home: 'Back to Home',
        btn_yes: 'Yes, shiny! ✨',
        btn_no: 'Go Back',
        btn_admin_back: '⬅️ Exit Panel',
        countdown_prefix: 'Returning in ',
        race_subtitle: 'Which grade is leading?',
        race_loading: 'Calculating positions... 🏎️💨',
        messages_lower: [
            "<span class='emoji-small'>⭐</span> You shine like a star",
            "<span class='emoji-small'>🏆</span> Champion smile",
            "<span class='emoji-small'>😁🦷</span> Clean teeth, happy smile",
            "<span class='emoji-small'>✨</span> You are glowing"
        ],
        messages_upper: [
            "<span class='emoji-small'>🚀</span> Maximum shine level",
            "<span class='emoji-small'>🎯</span> Your smile scores points",
            "<span class='emoji-small'>💡</span> You light up the class today",
            "<span class='emoji-small'>🔆</span> You ignited your smile",
            "<span class='emoji-small'>🎯</span> Mission clean teeth: accomplished"
        ],
        streak_day_singular: 'DAY',
        streak_day_plural: 'DAYS',
        btn_back_generic: '⬅️ Go Back',
        class_prefix: 'Class '
    }
};

// ── State ──
let currentLang = 'es';
let studentData = null;
let selectedStudent = { curso: '', grupo: '', nombre: '' };
let currentStreakData = { value: 0, includesToday: false };
let countdownInterval = null;
let audioCtx = null;
let streakRequestId = 0; // FIX: Counter to invalidate stale streak fetches

// ── Wide-mode screens (Set for O(1) lookup instead of string comparison) ──
const WIDE_SCREENS = new Set(['action', 'success', 'race', 'admin']);

// ── DOM Cache (cached once at init) ──
let DOM = null;

function cacheDom() {
    DOM = {
        app: document.getElementById('app'), // FIX: Cached instead of querying every showScreen()
        screens: {
            selection: document.getElementById('selection-screen'),
            action: document.getElementById('action-screen'),
            success: document.getElementById('success-screen'),
            race: document.getElementById('race-screen'),
            admin: document.getElementById('admin-screen')
        },
        inputs: {
            curso: document.getElementById('select-curso'),
            grupo: document.getElementById('select-grupo'),
            nameGrid: document.getElementById('name-grid'),
            fgGrupo: document.getElementById('fg-grupo'),
            fgAlumno: document.getElementById('fg-alumno')
        },
        labels: {
            curso: document.getElementById('label-curso'),
            grupo: document.getElementById('label-grupo'),
            alumno: document.getElementById('label-alumno')
        },
        headers: {
            introTitle: document.querySelector('#selection-screen header h1'),
            introSubtitle: document.querySelector('#selection-screen header p'),
            raceTitle: document.querySelector('#race-screen header h1'),
            raceSubtitle: document.querySelector('#race-screen header p'),
            left: document.querySelector('.app-header-left'),
            right: document.querySelector('.app-header-right')
        },
        raceContainer: document.getElementById('race-container'),
        buttons: {
            next: document.getElementById('btn-next'),
            race: document.getElementById('btn-show-race'),
            lang: document.getElementById('btn-lang-toggle'),
            admin: document.getElementById('btn-admin-access'),
            yes: document.getElementById('btn-yes'),
            no: document.getElementById('btn-no'),
            raceBack: document.getElementById('btn-race-back'),
            adminClose: document.getElementById('btn-admin-back'),
            adminReset: document.getElementById('btn-admin-reset')
        },
        text: {
            greeting: document.getElementById('greeting-name'),
            streakDays: document.getElementById('streak-days'),
            streakLabel: document.getElementById('streak-label'),
            streakMessage: document.getElementById('streak-message'),
            streakMuela: document.getElementById('streak-muela'),
            countdown: document.getElementById('countdown-text')
        }
    };
}

// ── Initialization ──
function initApp() {
    cacheDom();
    loadStudentData();
    setupEventListeners();
    updateLanguage();
    syncOfflineRecords();
}

// ── Data Loading ──
async function loadStudentData() {
    try {
        const option = document.createElement('option');
        option.text = TRANSLATIONS[currentLang].loading;
        DOM.inputs.curso.add(option);

        const response = await fetch(`${CONFIG.API_URL}?type=alumnado`);
        if (!response.ok) throw new Error('Network response was not ok');

        studentData = await response.json();
        if (studentData.error) throw new Error(studentData.error);

        localStorage.setItem(CONFIG.STUDENTS_CACHE_KEY, JSON.stringify(studentData));
        populateCursos();
    } catch (error) {
        console.error('Load Error:', error);
        const cached = localStorage.getItem(CONFIG.STUDENTS_CACHE_KEY);
        if (cached) {
            studentData = JSON.parse(cached);
            populateCursos();
            showToast('Usando datos guardados (Offline)', 'warning');
        } else {
            DOM.inputs.curso.innerHTML = '<option>Error de conexión ⚠️</option>';
        }
    }
}

function populateCursos() {
    DOM.inputs.curso.innerHTML = `<option value="">${TRANSLATIONS[currentLang].select_course}</option>`;
    if (!studentData) return;

    const fragment = document.createDocumentFragment();
    Object.keys(studentData).forEach(curso => {
        const opt = document.createElement('option');
        opt.value = curso;
        opt.text = curso;
        fragment.appendChild(opt);
    });
    DOM.inputs.curso.appendChild(fragment);
}

// ── API Calls ──
async function fetchStreak(curso, grupo, alumno) {
    if (!navigator.onLine) return { value: 0, includesToday: false };
    try {
        const url = `${CONFIG.API_URL}?type=streak&curso=${encodeURIComponent(curso)}&grupo=${encodeURIComponent(grupo)}&alumno=${encodeURIComponent(alumno)}`;
        const res = await fetch(url);
        const data = await res.json();
        return {
            value: data.streak || 0,
            includesToday: data.includesToday || false
        };
    } catch (e) {
        return { value: 0, includesToday: false };
    }
}

async function loadRace() {
    DOM.raceContainer.innerHTML = `<div class="loading-race">${TRANSLATIONS[currentLang].race_loading}</div>`;
    try {
        const res = await fetch(`${CONFIG.API_URL}?type=ranking`);
        const ranking = await res.json();

        DOM.raceContainer.innerHTML = '';
        if (!ranking || ranking.length === 0) {
            DOM.raceContainer.innerHTML = '<p>No data yet.</p>';
            return;
        }

        const maxPoints = Math.max(...ranking.map(r => r.points));
        const fragment = document.createDocumentFragment();

        ranking.forEach((r, index) => {
            const row = document.createElement('div');
            row.className = 'race-bar-wrapper';

            const widthPct = maxPoints > 0 ? (r.points / maxPoints) * 100 : 0;
            let rankClass = '';
            let medal = '';
            if (index === 0) { rankClass = 'gold'; medal = '🥇'; }
            else if (index === 1) { rankClass = 'silver'; medal = '🥈'; }
            else if (index === 2) { rankClass = 'bronze'; medal = '🥉'; }

            row.innerHTML = `
                <div class="race-label">
                    <div class="medal-wrapper">${medal}</div>
                    <span class="course-name">${r.clase}</span>
                </div>
                <div class="race-bar ${rankClass}" style="width: ${Math.max(widthPct, 10)}%;">
                    ${r.points}
                </div>
            `;
            fragment.appendChild(row);
        });
        DOM.raceContainer.appendChild(fragment);
    } catch (e) {
        console.error(e);
        DOM.raceContainer.innerHTML = '<p>Error loading race 🏁</p>';
    }
}

// ── Event Listeners ──
function setupEventListeners() {
    DOM.inputs.curso.addEventListener('change', handleCursoChange);
    DOM.inputs.grupo.addEventListener('change', handleGrupoChange);
    // Name grid uses event delegation (click handler added in populateNameGrid)
    DOM.buttons.next.addEventListener('click', handleNextClick);
    DOM.buttons.race.addEventListener('click', () => { playSound('bubble'); showScreen('race'); loadRace(); });
    DOM.buttons.raceBack.addEventListener('click', () => showScreen('selection'));
    DOM.buttons.yes.addEventListener('click', () => handleRegister('Sí'));
    DOM.buttons.no.addEventListener('click', () => handleRegister('No'));
    DOM.buttons.lang.addEventListener('click', () => { playSound('pop'); currentLang = currentLang === 'es' ? 'en' : 'es'; updateLanguage(); });
    DOM.buttons.admin.addEventListener('click', () => { const pin = prompt('PIN:'); if (pin === CONFIG.ADMIN_PIN) showScreen('admin'); });
    DOM.buttons.adminClose.addEventListener('click', () => showScreen('selection'));
    DOM.buttons.adminReset.addEventListener('click', handleAdminReset);
}

function handleCursoChange(e) {
    playSound('pop');
    const curso = e.target.value;
    const t = TRANSLATIONS[currentLang];

    // Reset streak data when changing course (prevents stale data)
    currentStreakData = { value: 0, includesToday: false };
    streakRequestId++;

    DOM.inputs.grupo.innerHTML = `<option value="">${t.select_group}</option>`;
    DOM.inputs.nameGrid.innerHTML = '';
    DOM.inputs.grupo.disabled = true;
    DOM.buttons.next.classList.add('hidden');
    DOM.buttons.next.disabled = true;

    toggleCascade(DOM.inputs.fgGrupo, false);
    toggleCascade(DOM.inputs.fgAlumno, false);

    if (curso && studentData[curso]) {
        DOM.inputs.grupo.disabled = false;
        toggleCascade(DOM.inputs.fgGrupo, true);

        const grupos = studentData[curso];
        Object.keys(grupos).forEach(grupo => {
            const opt = document.createElement('option');
            opt.value = grupo;
            const prefix = t.class_prefix;
            opt.text = (grupo === 'ÚNICO' || grupo === 'UNICO')
                ? (currentLang === 'es' ? 'Único' : 'Unique')
                : `${prefix}${grupo}`;
            DOM.inputs.grupo.add(opt);
        });

        if (Object.keys(grupos).length === 1) {
            DOM.inputs.grupo.selectedIndex = 1;
            DOM.inputs.grupo.dispatchEvent(new Event('change'));
        }
    }
}

function handleGrupoChange(e) {
    playSound('pop');
    const grupo = e.target.value;
    const curso = DOM.inputs.curso.value;
    const t = TRANSLATIONS[currentLang];

    // Reset streak data when changing group
    currentStreakData = { value: 0, includesToday: false };
    streakRequestId++;

    DOM.inputs.nameGrid.innerHTML = '';
    DOM.buttons.next.classList.add('hidden');
    DOM.buttons.next.disabled = true;
    toggleCascade(DOM.inputs.fgAlumno, false);

    if (curso && grupo && studentData[curso][grupo]) {
        toggleCascade(DOM.inputs.fgAlumno, true);
        populateNameGrid(studentData[curso][grupo].slice().sort());
    }
}

function populateNameGrid(names) {
    const grid = DOM.inputs.nameGrid;
    grid.innerHTML = '';
    const fragment = document.createDocumentFragment();

    names.forEach(name => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'name-btn';
        btn.textContent = name;
        btn.dataset.name = name;
        fragment.appendChild(btn);
    });
    grid.appendChild(fragment);

    // Event delegation: single listener on the grid container
    grid.onclick = (e) => {
        const btn = e.target.closest('.name-btn');
        if (!btn) return;
        handleNameSelection(btn);
    };
}

async function handleNameSelection(btn) {
    playSound('pop');

    // Deselect previous
    const prev = DOM.inputs.nameGrid.querySelector('.name-btn.selected');
    if (prev) prev.classList.remove('selected');
    btn.classList.add('selected');

    selectedStudent.curso = DOM.inputs.curso.value;
    selectedStudent.grupo = DOM.inputs.grupo.value;
    selectedStudent.nombre = btn.dataset.name;

    // Reset streak immediately so stale data never shows
    currentStreakData = { value: 0, includesToday: false };

    if (selectedStudent.nombre) {
        DOM.buttons.next.classList.remove('hidden');
        DOM.buttons.next.disabled = false;

        // FIX: Race condition guard — only accept the latest fetch result
        const thisRequest = ++streakRequestId;
        const result = await fetchStreak(selectedStudent.curso, selectedStudent.grupo, selectedStudent.nombre);

        // If the user changed selection while we were fetching, discard this response
        if (thisRequest === streakRequestId) {
            currentStreakData = result;
        }
    } else {
        DOM.buttons.next.classList.add('hidden');
        DOM.buttons.next.disabled = true;
    }
}

function handleNextClick() {
    playSound('bubble');
    showScreen('action');
    const firstName = selectedStudent.nombre.split(' ')[0];
    const t = TRANSLATIONS[currentLang];
    DOM.text.greeting.innerHTML = `
        ${t.greeting_prefix}<span class="highlight-name">${firstName}</span>! ✨
        <br>
        <span class="question-text">${t.question}</span>
    `;
}

async function handleAdminReset() {
    if (confirm('RESET ALL DATA?')) {
        await fetch(CONFIG.API_URL, { method: 'POST', body: JSON.stringify({ action: 'resetCompetition' }) });
        location.reload();
    }
}

// ── Helpers ──
function toggleCascade(el, show) {
    if (show) {
        el.classList.remove('hidden-cascade');
        el.classList.add('visible-cascade');
    } else {
        el.classList.add('hidden-cascade');
        el.classList.remove('visible-cascade');
    }
}

// ── Registration Logic ──
function handleRegister(estado) {
    if (DOM.buttons.yes.disabled) return;
    DOM.buttons.yes.disabled = true;
    DOM.buttons.no.disabled = true;

    if (estado === 'Sí') {
        DOM.buttons.yes.classList.add('btn-success-active');
        playSound('bling');
        confettiEffect();

        let displayStreak = currentStreakData.value;
        if (!currentStreakData.includesToday) displayStreak++;

        setTimeout(() => showSuccessScreen(displayStreak), 500);

        const record = {
            fecha: new Date().toISOString(),
            curso: selectedStudent.curso,
            grupo: selectedStudent.grupo,
            alumno: selectedStudent.nombre,
            estado: estado
        };
        sendRecord(record);
    } else {
        playSound('pop');
        showScreen('selection');
        DOM.buttons.yes.disabled = false;
        DOM.buttons.no.disabled = false;
    }
}

async function sendRecord(record) {
    if (navigator.onLine) {
        try {
            await fetch(CONFIG.API_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify(record)
            });
        } catch (e) {
            saveOffline(record);
        }
    } else {
        saveOffline(record);
    }
}

// ── Success Screen ──
function showSuccessScreen(streak) {
    showScreen('success');

    const t = TRANSLATIONS[currentLang];
    const label = streak === 1 ? t.streak_day_singular : t.streak_day_plural;

    // FIX: Using CSS classes instead of inline styles to avoid forced reflow
    DOM.text.streakDays.innerHTML = `<div class="streak-number">${streak}</div><div class="streak-unit">${label}</div>`;

    // Message pool selection
    const curso = selectedStudent.curso || '';
    let pool;
    if (curso.startsWith('1') || curso.startsWith('2') || curso.toLowerCase().includes('infantil')) {
        pool = t.messages_lower;
    } else if (curso.startsWith('3') || curso.startsWith('4') || curso.startsWith('5') || curso.startsWith('6')) {
        pool = t.messages_upper;
    } else {
        pool = [...t.messages_lower, ...t.messages_upper];
    }

    const randomMsg = pool[Math.floor(Math.random() * pool.length)];
    DOM.text.streakMessage.innerHTML = randomMsg.replace(/\n/g, '<br>');
    DOM.text.streakLabel.textContent = '';

    // Auto-resize using CSS class instead of inline style
    const textContent = DOM.text.streakMessage.textContent || DOM.text.streakMessage.innerText;
    DOM.text.streakMessage.classList.toggle('streak-message-long', textContent.length > 25);

    // Visual Level
    let level = 1;
    if (streak >= 4) level = 2;
    if (streak >= 11) level = 3;
    DOM.text.streakMuela.src = `img/Muela de fuego-nivel ${level}.svg`;

    // Variable Timer based on Course
    let seconds = 5;
    if (curso.startsWith('1') || curso.startsWith('2')) seconds = 10;
    else if (curso.startsWith('3') || curso.startsWith('4')) seconds = 7;

    const updateCountdown = () => {
        DOM.text.countdown.textContent = `${t.countdown_prefix}${seconds}...`;
    };
    updateCountdown();

    // FIX: Clear previous interval before starting new one (prevent memory leak)
    clearCountdown();
    countdownInterval = setInterval(() => {
        seconds--;
        if (seconds < 0) {
            clearCountdown();
            resetApp();
        } else {
            updateCountdown();
        }
    }, 1000);
}

function clearCountdown() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
}

// ── Screen Navigation ──
function showScreen(screenName) {
    Object.values(DOM.screens).forEach(el => el.classList.add('hidden'));
    DOM.screens[screenName].classList.remove('hidden');

    const isWide = WIDE_SCREENS.has(screenName);
    DOM.headers.left.style.display = isWide ? 'none' : 'block';
    DOM.headers.right.style.display = isWide ? 'none' : 'block';
    DOM.app.classList.toggle('wide-mode', isWide); // FIX: Uses cached DOM.app
}

function resetApp() {
    clearCountdown();
    selectedStudent = { curso: '', grupo: '', nombre: '' };
    const t = TRANSLATIONS[currentLang];

    DOM.inputs.curso.value = "";
    DOM.inputs.grupo.innerHTML = `<option value="">${t.select_group}</option>`;
    DOM.inputs.nameGrid.innerHTML = '';
    DOM.inputs.grupo.disabled = true;

    toggleCascade(DOM.inputs.fgGrupo, false);
    toggleCascade(DOM.inputs.fgAlumno, false);

    DOM.buttons.next.classList.add('hidden');
    DOM.buttons.yes.disabled = false;
    DOM.buttons.yes.classList.remove('btn-success-active');
    DOM.buttons.no.disabled = false;
    showScreen('selection');
}

// ── Offline Support ──
function saveOffline(record) {
    const records = JSON.parse(localStorage.getItem(CONFIG.OFFLINE_KEY) || '[]');
    records.push(record);
    localStorage.setItem(CONFIG.OFFLINE_KEY, JSON.stringify(records));
}

async function syncOfflineRecords() {
    if (!navigator.onLine) return;
    const records = JSON.parse(localStorage.getItem(CONFIG.OFFLINE_KEY) || '[]');
    if (records.length === 0) return;

    const failed = [];
    for (const record of records) {
        try {
            await fetch(CONFIG.API_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify(record)
            });
        } catch (e) {
            failed.push(record);
        }
    }
    localStorage.setItem(CONFIG.OFFLINE_KEY, JSON.stringify(failed));
    if (failed.length === 0) showToast(TRANSLATIONS[currentLang].connection_restored, 'success');
}

// ── Language ──
function updateLanguage() {
    const t = TRANSLATIONS[currentLang];
    DOM.buttons.lang.textContent = currentLang === 'es' ? '🇬🇧 EN' : '🇪🇸 ES';
    DOM.buttons.race.innerHTML = t.btn_race;
    DOM.buttons.raceBack.innerHTML = t.btn_back_home;
    DOM.buttons.adminClose.innerHTML = t.btn_admin_back;
    DOM.buttons.next.innerHTML = t.btn_next;

    if (DOM.headers.introTitle) DOM.headers.introTitle.textContent = t.intro_title;
    if (DOM.headers.introSubtitle) DOM.headers.introSubtitle.textContent = t.intro_subtitle;
    if (DOM.headers.raceTitle) DOM.headers.raceTitle.textContent = t.race_title;
    if (DOM.headers.raceSubtitle) DOM.headers.raceSubtitle.textContent = t.race_subtitle;
    if (DOM.labels.curso) DOM.labels.curso.textContent = t.label_course;
    if (DOM.labels.grupo) DOM.labels.grupo.textContent = t.label_group;
    if (DOM.labels.alumno) DOM.labels.alumno.textContent = t.label_student;

    if (DOM.inputs.curso.options[0]) DOM.inputs.curso.options[0].text = t.select_course;
    if (DOM.inputs.grupo.options[0]) DOM.inputs.grupo.options[0].text = t.select_group;

    const btnYesText = document.querySelector('#btn-yes .text');
    const btnNoText = document.querySelector('#btn-no .text');
    if (btnYesText) btnYesText.textContent = t.btn_yes;
    if (btnNoText) btnNoText.textContent = t.btn_no;
}

// ── UI Utilities ──
function showToast(msg, type) {
    let t = document.getElementById('app-toast');
    if (!t) {
        t = document.createElement('div');
        t.id = 'app-toast';
        t.className = 'toast';
        document.body.appendChild(t);
    }
    t.textContent = msg;
    t.className = 'toast visible';
    if (type) t.classList.add(type);
    setTimeout(() => t.className = 'toast', 3000);
}

// ── Audio (FIX: Removed global oscillator leak) ──
function playSound(type) {
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        if (type === 'pop') {
            osc.frequency.value = 800;
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.1);
        } else if (type === 'bubble') {
            osc.frequency.setValueAtTime(400, audioCtx.currentTime);
            osc.frequency.linearRampToValueAtTime(800, audioCtx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.15);
        } else if (type === 'bling') {
            osc.frequency.setValueAtTime(523, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.2);
        }
    } catch (e) { /* Audio not available */ }
}

function confettiEffect() {
    if (typeof confetti === 'function') {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#FFD700', '#FF0000', '#00FF00', '#0000FF']
        });
    }
}

// ── Boot ──
document.addEventListener('DOMContentLoaded', initApp);