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
        course: 'Curso',
        group: 'Clase',
        student: 'Alumno',
        btn_register: '¡Hecho! 🦷',
        btn_race: 'Ver Carrera 🏆',
        sending: 'Enviando...',
        success: '¡Registro guardado!',
        offline_stored: 'Guardado (sin conexión) 📡',
        select_default: 'Selecciona...',
        streak_label: 'Racha actual',
        days: 'días',
        successMessages: [
            '¡Genial! Tus dientes brillan ✨',
            '¡Misión cumplida! Dientes limpios 🦷',
            '¡Superhéroe de la sonrisa! 🦸‍♂️',
            '¡Fantástico trabajo! 🌟'
        ],
        level1: [
            '¡Buena racha! Sigue así 🌊',
            '¡Dientes limpios, pez feliz! 🐠',
            '¡Estás cuidando tu sonrisa! 🦷',
            '¡Brilla como una perla! ✨'
        ],
        level2: [
            '¡Racha imparable! Eres un tiburón 🦈',
            '¡Wow! Tu sonrisa ilumina el océano 🌊',
            '¡Experto en cepillo! Sigue nadando 🏊‍♂️',
            '¡Casi un guardián del arrecife! 🛡️'
        ],
        level3: [
            '¡Nivel Capitán desbloqueado! La sonrisa más brillante ⚓',
            '¡Un verdadero Guardián del Arrecife! 🧜‍♂️',
            '¡Leyenda del cepillo! Eres invencible 🔱',
            '¡Increíble! Tu corona de fuego ilumina el mar 🔥'
        ]
    },
    en: {
        title: 'Ready to Shine! ✨',
        subtitle: 'Choose your grade to start',
        course: 'Grade',
        group: 'Class',
        student: 'Student',
        btn_register: 'Done! 🦷',
        btn_race: 'See Race 🏆',
        sending: 'Sending...',
        success: 'Saved!',
        offline_stored: 'Stored (offline) 📡',
        select_default: 'Select...',
        streak_label: 'Current Streak',
        days: 'days',
        successMessages: [
            'Awesome! Your teeth are sparkling ✨',
            'Mission accomplished! Clean teeth 🦷',
            'Smile Superhero! 🦸‍♂️',
            'Fantastic job! 🌟'
        ],
        level1: [
            'Good streak! Keep it up 🌊',
            'Clean teeth, happy fish! 🐠',
            'You are caring for your smile! 🦷',
            'Shine like a pearl! ✨'
        ],
        level2: [
            'Unstoppable streak! You are a shark 🦈',
            'Wow! Your smile lights up the ocean 🌊',
            'Brush expert! Keep swimming 🏊‍♂️',
            'Almost a Reef Guardian! 🛡️'
        ],
        level3: [
            'Captain level unlocked! The brightest smile in school ⚓',
            'A true Reef Guardian! Nothing can beat your consistency 🧜‍♂️',
            'Brushing legend! Champion-level discipline 🔱',
            'Amazing! Your fire crown lights up the darkest corner of the sea 🔥'
        ]
    }
};

let currentLang = 'es';

// Referencias del DOM
const DOM_ELEMENTS = {
    title: document.getElementById('app-title'),
    subtitle: document.getElementById('app-subtitle'),
    cursoLabel: document.getElementById('label-curso'),
    grupoLabel: document.getElementById('label-grupo'),
    alumnoLabel: document.getElementById('label-alumno'),
    cursoSelect: document.getElementById('cursoSelect'),
    grupoSelect: document.getElementById('grupoSelect'),
    alumnoSelect: document.getElementById('alumnoSelect'),
    registerBtn: document.getElementById('registerBtn'),
    raceBtn: document.getElementById('raceBtn'),
    langBtn: document.getElementById('langBtn'),
    adminBtn: document.getElementById('adminBtn'),
    streakContainer: document.getElementById('streak-container'),
    streakCount: document.getElementById('streak-count'),
    streakMessage: document.getElementById('streak-message'),
    streakIcon: document.getElementById('streak-icon'),
    mascot: document.querySelector('.mascot')
};

// Inicialización
function initApp() {
    loadStudentData();
    setupEventListeners();
    updateLanguage();
    syncOfflineRecords(); // Intentar sincronizar al abrir
    
    // Easter Egg: Toque en la mascota
    if (DOM_ELEMENTS.mascot) {
        DOM_ELEMENTS.mascot.addEventListener('click', () => {
            playSound('bubble');
            DOM_ELEMENTS.mascot.style.transform = 'scale(1.1) rotate(10deg)';
            setTimeout(() => DOM_ELEMENTS.mascot.style.transform = 'translateY(0)', 200);
        });
    }
}

// Cargar Datos (FIXED ERROR HANDLING)
async function loadStudentData() {
    try {
        const loadingOption = document.createElement('option');
        loadingOption.text = "Cargando...";
        DOM_ELEMENTS.cursoSelect.add(loadingOption);
        
        console.log('Fetching data from:', CONFIG.API_URL);
        const response = await fetch(CONFIG.API_URL);
        
        if (!response.ok) {
            throw new Error(`Error de red: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Data received:', data);

        if (data.error) {
            throw new Error(data.error);
        }

        DOM_ELEMENTS.cursoSelect.innerHTML = '<option value="">Selecciona curso...</option>';
        
        Object.keys(data).forEach(curso => {
            const option = document.createElement('option');
            option.value = curso;
            option.text = curso;
            DOM_ELEMENTS.cursoSelect.add(option);
        });

        localStorage.setItem(CONFIG.STUDENTS_CACHE_KEY, JSON.stringify(data));
        window.studentData = data;

    } catch (error) {
        console.error('Error loading student data:', error);
        
        // Cache fallback
        const cachedData = localStorage.getItem(CONFIG.STUDENTS_CACHE_KEY);
        if (cachedData) {
            window.studentData = JSON.parse(cachedData);
            DOM_ELEMENTS.cursoSelect.innerHTML = '<option value="">Selecciona curso (Offline)...</option>';
            Object.keys(window.studentData).forEach(curso => {
                const option = document.createElement('option');
                option.value = curso;
                option.text = curso;
                DOM_ELEMENTS.cursoSelect.add(option);
            });
            alert('Aviso: Sin conexión. Usando datos guardados.');
        } else {
            DOM_ELEMENTS.cursoSelect.innerHTML = '<option value="">Error de conexión ⚠️</option>';
            alert('No se pudieron cargar los alumnos. Verifica tu conexión a internet y recarga.');
        }
    }
}

function setupEventListeners() {
    DOM_ELEMENTS.cursoSelect.addEventListener('change', (e) => {
        playSound('pop');
        handleCursoChange(e.target.value);
    });
    DOM_ELEMENTS.grupoSelect.addEventListener('change', (e) => {
        playSound('pop');
        handleGrupoChange(e.target.value);
    });
    DOM_ELEMENTS.alumnoSelect.addEventListener('change', (e) => {
        playSound('pop');
        handleAlumnoChange(e.target.value);
    });

    DOM_ELEMENTS.registerBtn.addEventListener('click', handleRegister);
    
    // Botón de Carrera: Abre el enlace del Dashboard (Google Sheets o Data Studio)
    DOM_ELEMENTS.raceBtn.addEventListener('click', () => {
        playSound('bubble');
        // Reemplazar con el enlace público de tu Dashboard/Carrera
        window.open('https://docs.google.com/spreadsheets/d/1Z_u8zXn2wT3q5PgL4I0nOqJ0pZ6dK2yG/edit?usp=sharing', '_blank');
    });

    DOM_ELEMENTS.langBtn.addEventListener('click', () => {
        playSound('pop');
        currentLang = currentLang === 'es' ? 'en' : 'es';
        updateLanguage();
    });

    DOM_ELEMENTS.adminBtn.addEventListener('click', () => {
        const pin = prompt('PIN de Administrador:');
        if (pin === CONFIG.ADMIN_PIN) {
            showAdminPanel();
        }
    });
}

function updateLanguage() {
    const t = TRANSLATIONS[currentLang];
    DOM_ELEMENTS.title.textContent = t.title;
    DOM_ELEMENTS.subtitle.textContent = t.subtitle;
    DOM_ELEMENTS.cursoLabel.textContent = t.course;
    DOM_ELEMENTS.grupoLabel.textContent = t.group;
    DOM_ELEMENTS.alumnoLabel.textContent = t.student;
    DOM_ELEMENTS.registerBtn.textContent = '🦷 ' + t.btn_register;
    DOM_ELEMENTS.raceBtn.textContent = '🏆 ' + t.btn_race;
    DOM_ELEMENTS.langBtn.textContent = currentLang === 'es' ? '🇬🇧 EN' : '🇪🇸 ES';
    
    // Actualizar placeholders si es necesario
    if (DOM_ELEMENTS.cursoSelect.options[0]) DOM_ELEMENTS.cursoSelect.options[0].text = t.select_default;
    if (DOM_ELEMENTS.grupoSelect.options[0]) DOM_ELEMENTS.grupoSelect.options[0].text = t.select_default;
    if (DOM_ELEMENTS.alumnoSelect.options[0]) DOM_ELEMENTS.alumnoSelect.options[0].text = t.select_default;
}

function handleCursoChange(curso) {
    playAnimation();
    DOM_ELEMENTS.grupoSelect.innerHTML = `<option value="">${TRANSLATIONS[currentLang].select_default}</option>`;
    DOM_ELEMENTS.alumnoSelect.innerHTML = `<option value="">${TRANSLATIONS[currentLang].select_default}</option>`;
    DOM_ELEMENTS.grupoSelect.disabled = true;
    DOM_ELEMENTS.alumnoSelect.disabled = true;
    DOM_ELEMENTS.streakContainer.classList.remove('visible');

    if (!curso || !window.studentData) return;

    const grupos = window.studentData[curso];
    if (grupos) {
        DOM_ELEMENTS.grupoSelect.disabled = false;
        Object.keys(grupos).forEach(grupo => {
            const option = document.createElement('option');
            option.value = grupo;
            option.text = grupo === 'ÚNICO' ? (currentLang === 'es' ? 'Única' : 'Single') : `Clase ${grupo}`;
            DOM_ELEMENTS.grupoSelect.add(option);
        });
        
        // Auto-seleccionar si solo hay un grupo (ÚNICO)
        if (Object.keys(grupos).length === 1) {
            DOM_ELEMENTS.grupoSelect.selectedIndex = 1;
            handleGrupoChange(Object.keys(grupos)[0]);
        }
    }
}

function handleGrupoChange(grupo) {
    playAnimation();
    DOM_ELEMENTS.alumnoSelect.innerHTML = `<option value="">${TRANSLATIONS[currentLang].select_default}</option>`;
    DOM_ELEMENTS.alumnoSelect.disabled = true;
    DOM_ELEMENTS.streakContainer.classList.remove('visible');

    const curso = DOM_ELEMENTS.cursoSelect.value;
    if (!curso || !grupo || !window.studentData) return;

    const alumnos = window.studentData[curso][grupo];
    if (alumnos) {
        DOM_ELEMENTS.alumnoSelect.disabled = false;
        alumnos.sort().forEach(alumno => {
            const option = document.createElement('option');
            option.value = alumno;
            option.text = alumno;
            DOM_ELEMENTS.alumnoSelect.add(option);
        });
    }
}

function handleAlumnoChange(alumno) {
    if (!alumno) {
        DOM_ELEMENTS.streakContainer.classList.remove('visible');
        return;
    }
    
    // Mostrar racha actual (simulada o guardada localmente) de forma optimista
    // En una versión completa, esto vendría del backend
    const curso = DOM_ELEMENTS.cursoSelect.value;
    const grupo = DOM_ELEMENTS.grupoSelect.value;
    updateStreakDisplay(curso, grupo, alumno);
}

function playAnimation() {
    // Pequeña animación de rebote en la mascota
    if (DOM_ELEMENTS.mascot) {
        DOM_ELEMENTS.mascot.classList.remove('bounce');
        void DOM_ELEMENTS.mascot.offsetWidth; // Trigger reflow
        DOM_ELEMENTS.mascot.classList.add('bounce');
    }
}

async function handleRegister() {
    const curso = DOM_ELEMENTS.cursoSelect.value;
    const grupo = DOM_ELEMENTS.grupoSelect.value;
    const alumno = DOM_ELEMENTS.alumnoSelect.value;

    if (!curso || !grupo || !alumno) {
        alert('Por favor, completa todos los campos.');
        return;
    }

    playSound('pop');
    
    const originalText = DOM_ELEMENTS.registerBtn.textContent;
    DOM_ELEMENTS.registerBtn.textContent = TRANSLATIONS[currentLang].sending;
    DOM_ELEMENTS.registerBtn.disabled = true;

    // Efecto de confeti
    confettiEffect();

    const record = {
        fecha: new Date().toISOString(),
        curso,
        grupo,
        alumno,
        estado: 'Sí'
    };

    if (navigator.onLine) {
        try {
            await enviarRegistro(record);
            // Actualizar racha local y mostrar
            const newStreak = calculateStreak(curso, grupo, alumno);
            updateStreakDisplay(curso, grupo, alumno, newStreak);
            playSound('bling');
            showToast(getRandomSuccessMessage(), 'success');
        } catch (error) {
            console.error('Error enviando:', error);
            saveOffline(record);
            showToast(TRANSLATIONS[currentLang].offline_stored, 'warning');
        }
    } else {
        saveOffline(record);
        showToast(TRANSLATIONS[currentLang].offline_stored, 'warning');
    }

    // Resetear UI
    setTimeout(() => {
        DOM_ELEMENTS.registerBtn.textContent = originalText;
        DOM_ELEMENTS.registerBtn.disabled = false;
        DOM_ELEMENTS.alumnoSelect.value = "";
        DOM_ELEMENTS.streakContainer.classList.remove('visible');
    }, 2000);
}

async function enviarRegistro(datos) {
    const response = await fetch(CONFIG.API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(datos)
    });
    
    const result = await response.json();
    if (result.status === 'error') {
        throw new Error(result.message);
    }
    return result;
}

// Sistema Offline
function saveOffline(record) {
    const records = JSON.parse(localStorage.getItem(CONFIG.OFFLINE_KEY) || '[]');
    records.push(record);
    localStorage.setItem(CONFIG.OFFLINE_KEY, JSON.stringify(records));
}

async function syncOfflineRecords() {
    if (!navigator.onLine) return;

    const records = JSON.parse(localStorage.getItem(CONFIG.OFFLINE_KEY) || '[]');
    if (records.length === 0) return;

    showToast(`Sincronizando ${records.length} registros...`, 'info');

    const remaining = [];
    for (const record of records) {
        try {
            await enviarRegistro(record);
        } catch (e) {
            remaining.push(record);
        }
    }

    localStorage.setItem(CONFIG.OFFLINE_KEY, JSON.stringify(remaining));
    if (remaining.length === 0) {
        showToast('¡Sincronización completada!', 'success');
    } else {
        showToast(`Pendientes: ${remaining.length}`, 'warning');
    }
}

// Sistema de Rachas Local (Simulado para feedback inmediato)
function updateStreakDisplay(curso, grupo, alumno, newStreak = null) {
    if (newStreak === null) {
        // Leer racha actual
        newStreak = calculateStreak(curso, grupo, alumno, true); // true = solo lectura
    }
    
    DOM_ELEMENTS.streakCount.textContent = `${newStreak} ${TRANSLATIONS[currentLang].days}`;
    
    // Determinar nivel
    const level = getStreakLevel(newStreak);
    DOM_ELEMENTS.streakIcon.textContent = level === 3 ? '🔥' : (level === 2 ? '🦈' : '⭐');
    
    // Mensaje motivacional
    DOM_ELEMENTS.streakMessage.textContent = getRandomStreakMessage(level);
    
    DOM_ELEMENTS.streakContainer.classList.add('visible');
    
    // Muela de Fuego (Cambiar imagen si existe)
    if (level === 3 && DOM_ELEMENTS.mascot) {
        // Opcional: cambiar imagen de mascota
        // DOM_ELEMENTS.mascot.src = 'img/muela-fuego.svg';
    }
}

function calculateStreak(curso, grupo, alumno, readonly = false) {
    const key = `${curso}_${grupo}_${alumno}`;
    let streaks = JSON.parse(localStorage.getItem(CONFIG.STREAK_KEY) || '{}');
    let data = streaks[key] || { count: 0, lastDate: null };

    if (readonly) return data.count;

    // Lógica simple de incremento diario
    const today = new Date().toDateString();
    if (data.lastDate !== today) {
        data.count++;
        // Aquí se podría añadir lógica compleja de "romper racha" si lastDate es muy antiguo
        // Por ahora mantenemos simple increment
    } else {
        // Ya registró hoy, no suma más, pero mantiene el dato
    }

    data.lastDate = today;
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
    const t = TRANSLATIONS[currentLang];
    const msgs = t[`level${level}`] || t.level1;
    return msgs[Math.floor(Math.random() * msgs.length)];
}

// Audio Feedback System using Web Audio API (FIXED)
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
        if (!ctx) return;
        
        if (ctx.state === 'suspended') {
            ctx.resume().catch(e => console.warn('Audio resume failed', e));
        }

        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        if (name === 'bling') {
            oscillator.frequency.setValueAtTime(523, ctx.currentTime);
            oscillator.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
            oscillator.frequency.setValueAtTime(784, ctx.currentTime + 0.2);
            gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.4);
        } else if (name === 'bubble') {
            oscillator.frequency.setValueAtTime(400, ctx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.15);
        } else if (name === 'pop') {
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(800, ctx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.08);
            gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.1);
        }
    } catch (e) {
        console.warn('Audio fail', e);
    }
}

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
    toast.className = 'toast visible';
    setTimeout(() => { toast.classList.remove('visible'); }, 3000);
}

// Online/Offline Listeners
window.addEventListener('online', () => {
    showToast(currentLang === 'es' ? 'Conexión recuperada 📡' : 'Connection restored 📡', 'success');
    syncOfflineRecords();
});

window.addEventListener('offline', () => {
    showToast(currentLang === 'es' ? 'Modo sin conexión 📡' : 'Offline mode 📡', 'warning');
});

// Admin Panel (Basic Simulation)
function showAdminPanel() {
    const action = confirm('¿Quieres reiniciar la competición? Esto borrará todos los registros actuales.');
    if (action) {
        showResetModal(); 
    }
}

function showResetModal() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay visible';
    overlay.innerHTML = `
        <div class="modal-card">
            <h2>⚠️ Zona de Peligro</h2>
            <p>Escribe <strong>RESET</strong> para confirmar el borrado.</p>
            <div class="modal-actions">
                <button id="btn-confirm-reset" class="btn btn-primary">Borrar Todo</button>
                <button id="btn-cancel-reset" class="btn btn-link">Mejor no...</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    document.getElementById('btn-confirm-reset').onclick = async () => {
        const pin = prompt('Confirmación final:');
        if (pin === 'RESET') {
            try {
                const response = await fetch(CONFIG.API_URL, {
                    method: 'POST',
                    headers: { "Content-Type": "text/plain;charset=utf-8" },
                    body: JSON.stringify({ action: 'resetCompetition' })
                });
                const res = await response.json();
                if (res.status === 'ok') {
                    alert('Competición reiniciada.');
                    window.location.reload();
                } else {
                    alert('Error: ' + res.message);
                }
            } catch (e) {
                alert('Error al reiniciar: ' + e);
            }
        }
        overlay.remove();
    };

    document.getElementById('btn-cancel-reset').onclick = () => {
        overlay.remove();
    };
}

// Inicializar
document.addEventListener('DOMContentLoaded', initApp);