/**
 * App "Cepillos" - Frontend Logic (Fixed Reset & Optimistic UI)
 */

const CONFIG = {
    API_URL: 'https://script.google.com/macros/s/AKfycbyuZlGw3PGWyPgqjUWXGyXb95gCdyECtoNw5ECYSCmjP7WiAs-pqCbaDV2FvKH-i6Rt/exec',
    RACE_URL: 'https://docs.google.com/spreadsheets/d/1Z_u8zXn2wT3q5PgL4I0nOqJ0pZ6dK2yG/edit?usp=sharing',
    OFFLINE_KEY: 'cepillos_offline_records',
    STUDENTS_CACHE_KEY: 'cepillos_students_cache',
    STREAK_KEY: 'cepillos_streaks',
    ADMIN_PIN: '1926'
};

const TRANSLATIONS = {
    es: {
        loading: 'Cargando...',
        select_course: 'Selecciona curso...',
        select_group: 'Selecciona grupo...',
        select_student: 'Busca tu nombre...',
        btn_next: 'Siguiente 👉',
        question: '¿Hoy te has lavado los dientes?',
        streak_days: 'días',
        success_title: '¡Genial!',
        offline_mode: 'Modo sin conexión 📡',
        connection_restored: 'Conexión recuperada 📡',
        sending: 'Enviando...',
        btn_race: 'Ver Carrera 🏆',
        btn_admin_back: '⬅️ Salir del Panel'
    },
    en: {
        loading: 'Loading...',
        select_course: 'Select grade...',
        select_group: 'Select class...',
        select_student: 'Find your name...',
        btn_next: 'Next 👉',
        question: 'Did you brush your teeth today?',
        streak_days: 'days',
        success_title: 'Awesome!',
        offline_mode: 'Offline mode 📡',
        connection_restored: 'Connection restored 📡',
        sending: 'Sending...',
        btn_race: 'See Race 🏆',
        btn_admin_back: '⬅️ Exit Panel'
    }
};

let currentLang = 'es';
let studentData = null;
let selectedStudent = { curso: '', grupo: '', nombre: '' };

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
        streakMuela: document.getElementById('streak-muela')
    }
};

function initApp() {
    console.log('Initializing App v5...');
    loadStudentData();
    setupEventListeners();
    updateLanguage();
    syncOfflineRecords();
}

// Data Loading
async function loadStudentData() {
    try {
        const option = document.createElement('option');
        option.text = TRANSLATIONS[currentLang].loading;
        DOM.inputs.curso.add(option);

        const response = await fetch(CONFIG.API_URL);
        if (!response.ok) throw new Error('Network response was not ok');

        studentData = await response.json();
        if (studentData.error) throw new Error(studentData.error);

        localStorage.setItem(CONFIG.STUDENTS_CACHE_KEY, JSON.stringify(studentData));
        populateCursos();

    } catch (error) {
        console.error('Load Error:', error);
        // Fallback Cache
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

function setupEventListeners() {
    // Selection Flow
    DOM.inputs.curso.addEventListener('change', e => {
        playSound('pop');
        const curso = e.target.value;
        // Reset sub-selects
        DOM.inputs.grupo.innerHTML = `<option value="">${TRANSLATIONS[currentLang].select_group}</option>`;
        DOM.inputs.alumno.innerHTML = `<option value="">${TRANSLATIONS[currentLang].select_student}</option>`;
        DOM.inputs.grupo.disabled = true;
        DOM.inputs.alumno.disabled = true;
        DOM.buttons.next.classList.add('hidden');
        DOM.buttons.next.disabled = true;

        // Hide cascades (Safety reset)
        DOM.inputs.fgGrupo.classList.add('hidden-cascade');
        DOM.inputs.fgAlumno.classList.add('hidden-cascade');

        if (curso && studentData[curso]) {
            DOM.inputs.grupo.disabled = false;
            // Use requestAnimationFrame to ensure CSS transition can happen if we added animation
            DOM.inputs.fgGrupo.classList.remove('hidden-cascade');
            DOM.inputs.fgGrupo.classList.add('visible-cascade'); // Add explicit visible class for animation

            const grupos = studentData[curso];
            Object.keys(grupos).forEach(grupo => {
                const opt = document.createElement('option');
                opt.value = grupo;
                opt.text = (grupo === 'ÚNICO' || grupo === 'UNICO') ? 'Único' : `Clase ${grupo}`;
                DOM.inputs.grupo.add(opt);
            });

            // Auto Select if only one group
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

    DOM.inputs.alumno.addEventListener('change', e => {
        playSound('pop');
        selectedStudent.curso = DOM.inputs.curso.value;
        selectedStudent.grupo = DOM.inputs.grupo.value;
        selectedStudent.nombre = e.target.value;

        if (selectedStudent.nombre) {
            DOM.buttons.next.classList.remove('hidden');
            DOM.buttons.next.disabled = false;
        } else {
            DOM.buttons.next.classList.add('hidden');
            DOM.buttons.next.disabled = true;
        }
    });

    // Navigation
    DOM.buttons.next.addEventListener('click', () => {
        playSound('bubble');
        showScreen('action');
        const firstName = selectedStudent.nombre.split(' ')[0];
        // Use translation logic or direct string
        const baseTitle = currentLang === 'es' ? `¡Hola, ${firstName}!` : `Hello, ${firstName}!`;
        DOM.text.greeting.textContent = baseTitle;
    });

    DOM.buttons.back.addEventListener('click', () => {
        playSound('pop');
        showScreen('selection');
    });

    DOM.buttons.race.addEventListener('click', () => {
        playSound('bubble');
        // Validate URL before opening
        if (CONFIG.RACE_URL) {
            window.open(CONFIG.RACE_URL, '_blank');
        } else {
            alert('Enlace de carrera no configurado');
        }
    });

    DOM.buttons.raceBack.addEventListener('click', () => {
        showScreen('selection');
    });

    // Action Buttons
    DOM.buttons.yes.addEventListener('click', () => handleRegister('Sí'));
    DOM.buttons.no.addEventListener('click', () => handleRegister('No'));

    // Header
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

    // Admin Reset
    DOM.buttons.adminReset.addEventListener('click', async () => {
        const confirmMsg = currentLang === 'es' ? '¿Seguro que quieres borrar TODO? escribe RESET' : 'Sure to delete ALL? type RESET';
        const pin = prompt(confirmMsg);
        if (pin === 'RESET') {
            try {
                showToast('Reiniciando...', 'info');
                await fetch(CONFIG.API_URL, {
                    method: 'POST',
                    body: JSON.stringify({ action: 'resetCompetition' })
                });
                alert('Competición reiniciada / Competition reset');
                location.reload();
            } catch (e) {
                alert('Error: ' + e);
            }
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
    } else {
        playSound('pop');
    }

    const record = {
        fecha: new Date().toISOString(),
        curso: selectedStudent.curso,
        grupo: selectedStudent.grupo,
        alumno: selectedStudent.nombre,
        estado: estado
    };

    // Calculate Streak Immediately
    const currentStreak = calculateStreak(record.curso, record.grupo, record.alumno, estado === 'Sí');

    // ---------------------------------------------------------
    // OPTIMISTIC UI: Show success/redirect immediately
    // ---------------------------------------------------------
    if (estado === 'Sí') {
        showSuccessScreen(currentStreak);
    } else {
        setTimeout(() => {
            resetApp();
            showToast(currentLang === 'es' ? '¡Ánimo para mañana!' : 'See you tomorrow!', 'info');
        }, 500);
    }

    // Send in Background
    const sendData = async () => {
        if (navigator.onLine) {
            try {
                // We don't await this for the UI update, but we do catch errors
                await fetch(CONFIG.API_URL, {
                    method: "POST",
                    headers: { "Content-Type": "text/plain;charset=utf-8" },
                    body: JSON.stringify(record)
                });
                console.log('Record sent successfully');
            } catch (e) {
                console.warn('Send failed, saving offline', e);
                saveOffline(record);
            }
        } else {
            saveOffline(record);
        }
    };

    sendData(); // Fire and forget (sort of)
}

function showSuccessScreen(streak) {
    showScreen('success');
    DOM.text.streakDays.textContent = streak;
    DOM.text.streakLabel.textContent = TRANSLATIONS[currentLang].streak_days;

    // Message based on streak
    DOM.text.streakMessage.textContent = getRandomMessage(streak);

    let level = 1;
    if (streak >= 4) level = 2;
    if (streak >= 11) level = 3;
    DOM.text.streakMuela.src = `img/Muela de fuego-nivel ${level}.svg`;

    // Countdown
    let seconds = 5;
    const countdownEl = document.getElementById('countdown-text');
    const interval = setInterval(() => {
        seconds--;
        countdownEl.textContent = currentLang === 'es'
            ? `Volviendo en ${seconds}...`
            : `Returning in ${seconds}...`;

        if (seconds <= 0) {
            clearInterval(interval);
            resetApp();
        }
    }, 1000);
}

function showScreen(screenName) {
    Object.values(DOM.screens).forEach(el => {
        if (el) el.classList.add('hidden');
    });
    if (DOM.screens[screenName]) DOM.screens[screenName].classList.remove('hidden');
}

function resetApp() {
    // Reset Data
    selectedStudent = { curso: '', grupo: '', nombre: '' };

    // Reset Inputs
    DOM.inputs.curso.value = "";
    DOM.inputs.grupo.innerHTML = `<option value="">${TRANSLATIONS[currentLang].select_group}</option>`;
    DOM.inputs.alumno.innerHTML = `<option value="">${TRANSLATIONS[currentLang].select_student}</option>`;
    DOM.inputs.grupo.disabled = true;
    DOM.inputs.alumno.disabled = true;

    // Reset Visibility (FIX for User Issue #1)
    DOM.inputs.fgGrupo.classList.add('hidden-cascade');
    DOM.inputs.fgGrupo.classList.remove('visible-cascade');
    DOM.inputs.fgAlumno.classList.add('hidden-cascade');
    DOM.inputs.fgAlumno.classList.remove('visible-cascade');

    // Reset Buttons
    DOM.buttons.next.classList.add('hidden');
    DOM.buttons.yes.disabled = false;
    DOM.buttons.no.disabled = false;

    showScreen('selection');
}

// Helpers
function calculateStreak(curso, grupo, alumno, increment) {
    const key = `${curso}_${grupo}_${alumno}`;
    let streaks = JSON.parse(localStorage.getItem(CONFIG.STREAK_KEY) || '{}');
    let data = streaks[key] || { count: 0, lastDate: null };

    if (increment) {
        const today = new Date().toDateString();
        // Simple daily check
        if (data.lastDate !== today) {
            data.count++;
            data.lastDate = today;
            streaks[key] = data;
            localStorage.setItem(CONFIG.STREAK_KEY, JSON.stringify(streaks));
        }
    }
    return data.count;
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

    showToast(currentLang === 'es' ? `Sincronizando ${records.length}...` : `Syncing...`);
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

    // Update Static UI
    DOM.buttons.race.innerHTML = t.btn_race;
    DOM.buttons.adminClose.innerHTML = t.btn_admin_back;
    DOM.buttons.next.innerHTML = t.btn_next;

    // Update Select Placeholders (only if they are currently selected/empty)
    if (DOM.inputs.curso.value === "") DOM.inputs.curso.options[0].text = t.select_course;
    if (DOM.inputs.grupo.value === "") DOM.inputs.grupo.options[0].text = t.select_group;
    if (DOM.inputs.alumno.value === "") DOM.inputs.alumno.options[0].text = t.select_student;

    // Update Question text
    const greetingEl = document.querySelector('#action-screen h2');
    if (greetingEl && selectedStudent.nombre) {
        // Re-render greeting with new lang
        const firstName = selectedStudent.nombre.split(' ')[0];
        greetingEl.textContent = currentLang === 'es' ? `¡Hola, ${firstName}!` : `Hello, ${firstName}!`;
    }
}

function getRandomMessage(streak) {
    // Simple motivators
    const es = ['¡Sigue así!', '¡Eres un crack!', '¡Dientes limpios!', '¡Brillante!'];
    const en = ['Keep it up!', 'You rock!', 'Clean teeth!', 'Shining!'];
    const list = currentLang === 'es' ? es : en;
    return list[Math.floor(Math.random() * list.length)];
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
    setTimeout(() => {
        t.className = 'toast';
    }, 3000);
}

// Audio
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
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(523, audioCtx.currentTime);
            osc.frequency.setValueAtTime(659, audioCtx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.4);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.4);
        }
    } catch (e) { console.log('Audio error', e); }
}

const confettiEffect = () => {
    // Basic DOM confetti
    for (let i = 0; i < 30; i++) {
        const p = document.createElement('div');
        p.style.position = 'fixed';
        p.style.left = Math.random() * 100 + 'vw';
        p.style.top = '-10px';
        p.style.width = '8px';
        p.style.height = '8px';
        p.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
        p.style.transition = 'top 1s ease-in, transform 1s linear';
        p.style.zIndex = '9999';
        document.body.appendChild(p);
        setTimeout(() => {
            p.style.top = '110vh';
            p.style.transform = `rotate(${Math.random() * 360}deg)`;
        }, 10);
        setTimeout(() => p.remove(), 1100);
    }
};

document.addEventListener('DOMContentLoaded', initApp);