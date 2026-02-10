/**
 * App "Cepillos" - Frontend Logic v12
 * - Fix: Syntax Errors
 * - Feature: Gamification (Gold/Silver/Bronze)
 * - Feature: Variable Timers
 * - Feature: Action Screen Correction Logic
 */

const CONFIG = {
    API_URL: 'https://script.google.com/macros/s/AKfycbyE1PQgWwhd05dIgsl82FkmIlBRp034ZiiT1z8OyV3wTj7v34c0LX4uDYIElOHSBa4/exec',
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
        btn_no: 'Volver atrás'
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
        race_title: '🏆 The Great Race',
        race_subtitle: 'Which grade is leading?',
        race_loading: 'Calculating positions... 🏎️💨'
    }
};

let currentLang = 'es';
let studentData = null;
let selectedStudent = { curso: '', grupo: '', nombre: '' };
let currentStreakData = { value: 0, includesToday: false };

const DOM = {
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
        alumno: document.getElementById('select-alumno'),
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
        back: document.getElementById('btn-back'),
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

function initApp() {
    console.log('App v12 Initializing...');
    loadStudentData();
    setupEventListeners();
    updateLanguage();
    syncOfflineRecords();
}

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

    Object.keys(studentData).forEach(curso => {
        const opt = document.createElement('option');
        opt.value = curso;
        opt.text = curso;
        DOM.inputs.curso.add(opt);
    });
}

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
                    <div class="medal-wrapper">${medal ? medal : ''}</div>
                    <span class="course-name">${r.clase}</span>
                </div>
                <div class="race-bar ${rankClass}" style="width: ${Math.max(widthPct, 10)}%;">
                    ${r.points}
                </div>
            `;
            DOM.raceContainer.appendChild(row);
        });

    } catch (e) {
        console.error(e);
        DOM.raceContainer.innerHTML = '<p>Error loading race 🏁</p>';
    }
}

function setupEventListeners() {
    DOM.inputs.curso.addEventListener('change', e => {
        playSound('pop');
        const curso = e.target.value;
        DOM.inputs.grupo.innerHTML = `<option value="">${TRANSLATIONS[currentLang].select_group}</option>`;
        DOM.inputs.alumno.innerHTML = `<option value="">${TRANSLATIONS[currentLang].select_student}</option>`;

        DOM.inputs.grupo.disabled = true;
        DOM.inputs.alumno.disabled = true;
        DOM.buttons.next.classList.add('hidden');
        DOM.buttons.next.disabled = true;

        DOM.inputs.fgGrupo.classList.add('hidden-cascade');
        DOM.inputs.fgGrupo.classList.remove('visible-cascade');
        DOM.inputs.fgAlumno.classList.add('hidden-cascade');
        DOM.inputs.fgAlumno.classList.remove('visible-cascade');

        if (curso && studentData[curso]) {
            DOM.inputs.grupo.disabled = false;
            DOM.inputs.fgGrupo.classList.remove('hidden-cascade');
            DOM.inputs.fgGrupo.classList.add('visible-cascade');

            const grupos = studentData[curso];
            Object.keys(grupos).forEach(grupo => {
                const opt = document.createElement('option');
                opt.value = grupo;
                opt.text = (grupo === 'ÚNICO' || grupo === 'UNICO') ? 'Único' : `Clase ${grupo}`;
                DOM.inputs.grupo.add(opt);
            });

            if (Object.keys(grupos).length === 1) {
                DOM.inputs.grupo.selectedIndex = 1;
                DOM.inputs.grupo.dispatchEvent(new Event('change'));
            }
        }
    });

    DOM.inputs.grupo.addEventListener('change', e => {
        playSound('pop');
        const grupo = e.target.value;
        const curso = DOM.inputs.curso.value;
        DOM.inputs.alumno.innerHTML = `<option value="">${TRANSLATIONS[currentLang].select_student}</option>`;
        DOM.inputs.alumno.disabled = true;
        DOM.buttons.next.classList.add('hidden');
        DOM.buttons.next.disabled = true;
        DOM.inputs.fgAlumno.classList.add('hidden-cascade');
        DOM.inputs.fgAlumno.classList.remove('visible-cascade');

        if (curso && grupo && studentData[curso][grupo]) {
            DOM.inputs.alumno.disabled = false;
            DOM.inputs.fgAlumno.classList.remove('hidden-cascade');
            DOM.inputs.fgAlumno.classList.add('visible-cascade');

            studentData[curso][grupo].sort().forEach(alumno => {
                const opt = document.createElement('option');
                opt.value = alumno;
                opt.text = alumno;
                DOM.inputs.alumno.add(opt);
            });
        }
    });

    DOM.inputs.alumno.addEventListener('change', async e => {
        playSound('pop');
        selectedStudent.curso = DOM.inputs.curso.value;
        selectedStudent.grupo = DOM.inputs.grupo.value;
        selectedStudent.nombre = e.target.value;

        if (selectedStudent.nombre) {
            DOM.buttons.next.classList.remove('hidden');
            DOM.buttons.next.disabled = false;
            currentStreakData = await fetchStreak(selectedStudent.curso, selectedStudent.grupo, selectedStudent.nombre);
        } else {
            DOM.buttons.next.classList.add('hidden');
            DOM.buttons.next.disabled = true;
        }
    });

    DOM.buttons.next.addEventListener('click', () => {
        playSound('bubble');
        showScreen('action');
        const firstName = selectedStudent.nombre.split(' ')[0];
        const t = TRANSLATIONS[currentLang];
        DOM.text.greeting.innerHTML = `
                    ${t.greeting_prefix}<span class="highlight-name" style="font-size: clamp(2rem, 5vw, 3rem)">${firstName}</span>! ✨
                    <br>
                    <span class="question-text">${t.question}</span>
                `;
    });

    DOM.buttons.back.addEventListener('click', () => {
        playSound('pop');
        showScreen('selection');
    });

    DOM.buttons.race.addEventListener('click', () => {
        playSound('bubble');
        showScreen('race');
        loadRace();
    });

    DOM.buttons.raceBack.addEventListener('click', () => showScreen('selection'));

    DOM.buttons.yes.addEventListener('click', () => handleRegister('Sí'));
    DOM.buttons.no.addEventListener('click', () => handleRegister('No'));

    DOM.buttons.lang.addEventListener('click', () => {
        playSound('pop');
        currentLang = currentLang === 'es' ? 'en' : 'es';
        updateLanguage();
    });

    DOM.buttons.admin.addEventListener('click', () => {
        const pin = prompt('PIN:');
        if (pin === CONFIG.ADMIN_PIN) showScreen('admin');
    });

    DOM.buttons.adminClose.addEventListener('click', () => showScreen('selection'));

    DOM.buttons.adminReset.addEventListener('click', async () => {
        if (confirm('RESET ALL DATA?')) {
            await fetch(CONFIG.API_URL, { method: 'POST', body: JSON.stringify({ action: 'resetCompetition' }) });
            location.reload();
        }
    });
}

function handleRegister(estado) {
    if (DOM.buttons.yes.disabled) return;
    DOM.buttons.yes.disabled = true;
    DOM.buttons.no.disabled = true;

    if (estado === 'Sí') {
        playSound('bling');
        confettiEffect();

        let displayStreak = currentStreakData.value;
        if (!currentStreakData.includesToday) {
            displayStreak++;
        }

        showSuccessScreen(displayStreak);

        const record = {
            fecha: new Date().toISOString(),
            curso: selectedStudent.curso,
            grupo: selectedStudent.grupo,
            alumno: selectedStudent.nombre,
            estado: estado
        };

        const send = async () => {
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
        };
        send();
    } else {
        // "No" is now "Volver atrás" (Correction)
        playSound('pop');
        showScreen('selection');
        DOM.buttons.yes.disabled = false;
        DOM.buttons.no.disabled = false;
    }
}

function showSuccessScreen(streak) {
    showScreen('success');

    // Updated Logic for Redesign
    const label = streak === 1 ? 'DÍA' : 'DÍAS';

    // Counter: Number + Label (Yellow/Bold defined in CSS)
    DOM.text.streakDays.innerHTML = `${streak}<br><span style="font-size:0.4em">${label}</span>`;

    // Messages Adapted by Course Level (User Specific List)
    const MESSAGES_LOWER = [
        "⭐ Brillas como una estrella",
        "🏆 Sonrisa de campeón",
        "😁🦷 Dientes limpios, sonrisa feliz",
        "✨ Estás que reluces"
    ];
    const MESSAGES_UPPER = [
        "🚀 Nivel brillo máximo",
        "🎯 Tu sonrisa gana puntos",
        "💡 Hoy iluminas la clase",
        "🔆 Has encendido tu sonrisa",
        "🎯 Misión dientes limpios: superada"
    ];

    // Default pool
    let pool = [...MESSAGES_LOWER, ...MESSAGES_UPPER];

    const curso = selectedStudent.curso || '';
    if (curso.startsWith('1') || curso.startsWith('2') || curso.toLowerCase().includes('infantil')) {
        pool = MESSAGES_LOWER;
    } else if (curso.startsWith('3') || curso.startsWith('4') || curso.startsWith('5') || curso.startsWith('6')) {
        pool = MESSAGES_UPPER;
    }

    const randomMsg = pool[Math.floor(Math.random() * pool.length)];
    DOM.text.streakMessage.innerHTML = randomMsg.replace(/\n/g, '<br>');
    DOM.text.streakLabel.textContent = '';

    // Auto-resize long messages logic
    if (randomMsg.length > 25) {
        DOM.text.streakMessage.style.fontSize = "clamp(1.5rem, 6vw, 3rem)";
    } else {
        DOM.text.streakMessage.style.removeProperty('font-size');
    }

    // Visual Level Logic
    let level = 1;
    if (streak >= 4) level = 2;
    if (streak >= 11) level = 3;
    DOM.text.streakMuela.src = `img/Muela de fuego-nivel ${level}.svg`;

    // Variable Timer Logic based on Course
    let seconds = 5;
    if (curso.startsWith('1') || curso.startsWith('2')) {
        seconds = 10;
    } else if (curso.startsWith('3') || curso.startsWith('4')) {
        seconds = 7;
    } else if (curso.startsWith('5') || curso.startsWith('6')) {
        seconds = 5;
    }

    const updateCountdown = () => {
        const prefix = TRANSLATIONS[currentLang].countdown_prefix;
        DOM.text.countdown.textContent = `${prefix}${seconds}...`;
    };
    updateCountdown();

    const interval = setInterval(() => {
        seconds--;
        if (seconds < 0) {
            clearInterval(interval);
            resetApp();
        } else {
            updateCountdown();
        }
    }, 1000);
}

function showScreen(screenName) {
    Object.values(DOM.screens).forEach(el => el.classList.add('hidden'));
    DOM.screens[screenName].classList.remove('hidden');

    if (screenName === 'action' || screenName === 'success') {
        DOM.headers.left.style.display = 'none';
        DOM.headers.right.style.display = 'none';
    } else {
        DOM.headers.left.style.display = 'block';
        DOM.headers.right.style.display = 'block';
    }
}

function resetApp() {
    selectedStudent = { curso: '', grupo: '', nombre: '' };
    DOM.inputs.curso.value = "";
    DOM.inputs.grupo.innerHTML = `<option value="">${TRANSLATIONS[currentLang].select_group}</option>`;
    DOM.inputs.alumno.innerHTML = `<option value="">${TRANSLATIONS[currentLang].select_student}</option>`;
    DOM.inputs.grupo.disabled = true;
    DOM.inputs.alumno.disabled = true;

    DOM.inputs.fgGrupo.classList.add('hidden-cascade');
    DOM.inputs.fgGrupo.classList.remove('visible-cascade');
    DOM.inputs.fgAlumno.classList.add('hidden-cascade');
    DOM.inputs.fgAlumno.classList.remove('visible-cascade');

    DOM.buttons.next.classList.add('hidden');
    DOM.buttons.yes.disabled = false;
    DOM.buttons.no.disabled = false;
    showScreen('selection');
}

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
    if (DOM.inputs.alumno.options[0]) DOM.inputs.alumno.options[0].text = t.select_student;

    // Update Action Buttons
    const btnYesText = document.querySelector('#btn-yes .text');
    const btnNoText = document.querySelector('#btn-no .text');
    if (btnYesText) btnYesText.textContent = t.btn_yes;
    if (btnNoText) btnNoText.textContent = t.btn_no;
}

function getRandomMessage(streak) {
    const es = ['¡Sigue así!', '¡Eres un crack!', '¡Dientes limpios!', '¡Brillante!'];
    const en = ['Keep it up!', 'You rock!', 'Clean teeth!', 'Shining!'];
    return (currentLang === 'es' ? es : en)[Math.floor(Math.random() * 4)];
}

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

let audioCtx = null;
function playSound(type) {
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        if (type === 'pop') {
            osc.frequency.value = 800; gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1); osc.start(); osc.stop(audioCtx.currentTime + 0.1);
        } else if (type === 'bubble') {
            osc.frequency.setValueAtTime(400, audioCtx.currentTime); osc.frequency.linearRampToValueAtTime(800, audioCtx.currentTime + 0.1); gain.gain.setValueAtTime(0.1, audioCtx.currentTime); osc.start(); osc.stop(audioCtx.currentTime + 0.15);
        } else if (type === 'bling') {
            osc.frequency.setValueAtTime(523, audioCtx.currentTime); oscillator = osc;
            osc.start(); osc.stop(audioCtx.currentTime + 0.2);
        }
    } catch (e) { }
}
const confettiEffect = () => { /* ... */ };
document.addEventListener('DOMContentLoaded', initApp);