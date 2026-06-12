/* ========================================
   SecureKey — Frontend con Pyodide
   Python corre directamente en el navegador.
   Sin servidor. Solo abre index.html.
   ======================================== */

// =========== PYTHON CODE (embebido) ===========
// Este es el mismo código de password_logic.py embebido aquí
// para que funcione abriendo el HTML directamente (protocolo file://)
const PYTHON_CODE = `
import random
import json

SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?'

LEET_MAP = {
    'a': ['@', '4'], 'b': ['8'], 'c': ['('], 'e': ['3'],
    'g': ['9'], 'i': ['!', '1'], 'l': ['1', '|'], 'o': ['0'],
    's': ['$', '5'], 't': ['7', '+'], 'z': ['2']
}

COMMON_PASSWORDS = [
    'password', '123456', '12345678', 'qwerty', 'abc123', 'monkey',
    'master', 'dragon', 'login', 'letmein', 'welcome', 'shadow',
    'sunshine', 'princess', 'football', 'charlie', 'admin', 'access',
    'hello', 'trustno1', 'iloveyou', 'baseball', 'superman', 'batman',
    'michael', 'jennifer', 'jordan', 'hunter', 'ranger', 'buster',
    'soccer', 'harley', 'summer', 'george', 'daniel', 'thomas',
    'robert', 'pepper', 'ginger', 'joshua', 'andrew', 'david',
    'starwars', 'matrix', 'pass', 'word', 'qwerty123', 'password1',
    '1234', '123456789', '1234567890', '0987654321', 'contrasena'
]

WORD_FRAGMENTS = [
    'Sol', 'Lun', 'Str', 'Brv', 'Fnx', 'Nyx', 'Zph', 'Wrp',
    'Drk', 'Flm', 'Vlt', 'Crx', 'Prx', 'Mnt', 'Glx', 'Rbx'
]

SEQUENCES = [
    '123', '234', '345', '456', '567', '678', '789', '890',
    'abc', 'bcd', 'cde', 'def', 'efg', 'fgh', 'ghi',
    'qwerty', 'asdf', 'zxcv', 'qwer', '1234', '0000',
    '1111', '2222', '3333', '4444', '5555', '6666',
    '7777', '8888', '9999', 'aaaa', 'bbbb', 'cccc'
]


def leet_speak(word):
    result = []
    for char in word:
        lower = char.lower()
        if lower in LEET_MAP and random.random() > 0.4:
            options = LEET_MAP[lower]
            result.append(random.choice(options))
        else:
            result.append(char.upper() if random.random() > 0.5 else char.lower())
    return ''.join(result)


def random_symbols(count):
    return ''.join(random.choice(SYMBOLS) for _ in range(count))


def random_digits(count):
    return ''.join(str(random.randint(0, 9)) for _ in range(count))


def random_fragment():
    return random.choice(WORD_FRAGMENTS)


def shuffle_middle(text):
    if len(text) <= 4:
        return text
    chars = list(text)
    middle = chars[1:-1]
    random.shuffle(middle)
    return chars[0] + ''.join(middle) + chars[-1]


def ensure_requirements(password):
    pwd = password
    if not any(c.isupper() for c in pwd):
        pwd = pwd[:1] + 'X' + pwd[1:]
    if not any(c.islower() for c in pwd):
        pwd += 'k'
    if not any(c.isdigit() for c in pwd):
        pwd += str(random.randint(0, 9))
    if not any(c in SYMBOLS for c in pwd):
        pwd += random.choice(SYMBOLS)
    while len(pwd) < 12:
        pwd += random.choice(SYMBOLS)
        pwd += str(random.randint(0, 9))
    return pwd


def generate_passwords(keyword):
    words = keyword.split()
    if len(words) > 3:
        words = words[:3]
    keyword = "".join(words)
    passwords = []

    # Estrategia 1: Leet speak + año + fragmento
    leet = leet_speak(keyword)
    year = random.randint(2020, 2026)
    sym = random_symbols(2)
    frag = random_fragment()
    pwd1 = f"{sym[0]}{leet}{sym[1]}{year}{frag}"
    passwords.append(ensure_requirements(pwd1))

    # Estrategia 2: Palabra invertida + fragmento + dígitos
    reversed_word = keyword[::-1]
    leet_rev = leet_speak(reversed_word)
    digits = random_digits(3)
    sym2 = random_symbols(2)
    frag2 = random_fragment()
    pwd2 = f"{frag2}{sym2[0]}{leet_rev}{digits}{sym2[1]}"
    passwords.append(ensure_requirements(pwd2))

    # Estrategia 3: Intercalado mayúsculas/minúsculas + símbolos
    upper = keyword.upper()
    lower = keyword.lower()
    interleaved = ''
    for i in range(len(keyword)):
        interleaved += upper[i] if i % 2 == 0 else lower[i]
        if i % 3 == 0 and i > 0:
            interleaved += random.choice(SYMBOLS)
    digits3 = random_digits(4)
    frag3 = random_fragment()
    pwd3 = f"{interleaved}#{digits3}{frag3}"
    pwd3 = shuffle_middle(pwd3)
    passwords.append(ensure_requirements(pwd3))

    return json.dumps(passwords)


def is_common_password(pwd):
    lower = pwd.lower()
    return any(common in lower for common in COMMON_PASSWORDS)


def has_obvious_sequence(pwd):
    lower = pwd.lower()
    return any(seq in lower for seq in SEQUENCES)


def count_char_types(pwd):
    count = 0
    if any(c.isupper() for c in pwd): count += 1
    if any(c.islower() for c in pwd): count += 1
    if any(c.isdigit() for c in pwd): count += 1
    if any(not c.isalnum() for c in pwd): count += 1
    return count


def estimate_crack_time(pwd):
    length = len(pwd)
    pool_size = 0
    if any(c.islower() for c in pwd): pool_size += 26
    if any(c.isupper() for c in pwd): pool_size += 26
    if any(c.isdigit() for c in pwd): pool_size += 10
    if any(not c.isalnum() for c in pwd): pool_size += 33
    if pool_size == 0:
        return ''
    combinations = pool_size ** length
    seconds = combinations / 1e10
    if seconds < 1:
        return 'Se podria descifrar instantaneamente'
    elif seconds < 60:
        return f'Tiempo estimado: {round(seconds)} segundos'
    elif seconds < 3600:
        return f'Tiempo estimado: {round(seconds / 60)} minutos'
    elif seconds < 86400:
        return f'Tiempo estimado: {round(seconds / 3600)} horas'
    elif seconds < 31536000:
        return f'Tiempo estimado: {round(seconds / 86400)} dias'
    elif seconds < 31536000 * 100:
        return f'Tiempo estimado: {round(seconds / 31536000)} anos'
    elif seconds < 31536000 * 1e6:
        return f'Tiempo estimado: {round(seconds / 31536000):,} anos'
    else:
        return 'Tiempo estimado: millones de anos — Practicamente imposible!'


def check_password(pwd):
    checks = {
        'length': len(pwd) >= 12,
        'upper': any(c.isupper() for c in pwd),
        'lower': any(c.islower() for c in pwd),
        'number': any(c.isdigit() for c in pwd),
        'symbol': any(not c.isalnum() for c in pwd),
        'common': not is_common_password(pwd),
        'sequence': not has_obvious_sequence(pwd),
    }
    passed_count = sum(checks.values())
    length_bonus = min(len(pwd) / 20, 1) * 15
    variety_bonus = count_char_types(pwd) * 5
    raw_score = (passed_count / 7) * 80 + length_bonus + variety_bonus
    score = min(round(raw_score), 100)

    if score < 25:
        level, label = 'weak', 'Muy Debil'
    elif score < 50:
        level, label = 'fair', 'Regular'
    elif score < 75:
        level, label = 'good', 'Buena'
    elif score < 90:
        level, label = 'good', 'Fuerte'
    else:
        level, label = 'excellent', 'Excelente'

    missing_tips = []
    if not checks['length']: missing_tips.append('mas caracteres (min. 12)')
    if not checks['upper']: missing_tips.append('letras mayusculas')
    if not checks['lower']: missing_tips.append('letras minusculas')
    if not checks['number']: missing_tips.append('numeros')
    if not checks['symbol']: missing_tips.append('simbolos (!@#$%)')
    if not checks['common']: missing_tips.append('evitar palabras comunes')
    if not checks['sequence']: missing_tips.append('evitar secuencias obvias')

    if passed_count == 7:
        verdict_icon, verdict_text = 'trophy', 'Contrasena Perfecta!'
        verdict_tip = 'Tu contrasena cumple con todos los requisitos de seguridad. Excelente trabajo!'
    elif passed_count >= 5:
        verdict_icon, verdict_text = 'strong', 'Casi Perfecta'
        verdict_tip = f"Te falta: {', '.join(missing_tips)}."
    elif passed_count >= 3:
        verdict_icon, verdict_text = 'warning', 'Necesita Mejoras'
        verdict_tip = f"Agrega: {', '.join(missing_tips)}."
    else:
        verdict_icon, verdict_text = 'danger', 'Contrasena Muy Debil'
        verdict_tip = 'Esta contrasena es facil de adivinar. Sigue las recomendaciones para fortalecerla.'

    result = {
        'checks': checks,
        'score': score,
        'level': level,
        'label': label,
        'crack_time': estimate_crack_time(pwd),
        'length_current': min(len(pwd), 12),
        'verdict': {
            'icon': verdict_icon,
            'text': verdict_text,
            'tip': verdict_tip,
        }
    }
    return json.dumps(result)
`;

// =========== PYODIDE INITIALIZATION ===========
let pyodide = null;
let pythonReady = false;

async function initPyodide() {
    const statusEl = document.getElementById('loadingStatus');
    const barFill = document.getElementById('loadingBarFill');

    try {
        statusEl.textContent = 'Descargando Python (Pyodide)...';
        barFill.style.width = '20%';

        pyodide = await loadPyodide();

        statusEl.textContent = 'Cargando lógica de contraseñas...';
        barFill.style.width = '70%';

        // Ejecutar el código Python
        pyodide.runPython(PYTHON_CODE);

        statusEl.textContent = '¡Listo!';
        barFill.style.width = '100%';
        pythonReady = true;

        // Ocultar overlay con animación
        setTimeout(() => {
            const overlay = document.getElementById('loadingOverlay');
            overlay.style.opacity = '0';
            overlay.style.pointerEvents = 'none';
            setTimeout(() => overlay.style.display = 'none', 500);
        }, 400);

    } catch (err) {
        statusEl.textContent = 'Error al cargar Python. Recarga la página.';
        barFill.style.background = '#ef4444';
        console.error('Pyodide error:', err);
    }
}

// Llamar funciones Python desde JS
function callPython(funcName, ...args) {
    if (!pythonReady) return null;
    const argsStr = args.map(a => JSON.stringify(a)).join(', ');
    const result = pyodide.runPython(`${funcName}(${argsStr})`);
    return JSON.parse(result);
}

// =========== DOM ELEMENTS ===========
const navTabs = document.querySelectorAll('.nav-tab');
const sectionGenerator = document.getElementById('sectionGenerator');
const sectionChecker = document.getElementById('sectionChecker');
const keywordInput = document.getElementById('keywordInput');
const charCounter = document.getElementById('charCounter');
const btnGenerate = document.getElementById('btnGenerate');
const btnRegenerate = document.getElementById('btnRegenerate');
const resultsContainer = document.getElementById('resultsContainer');
const passwordCards = document.getElementById('passwordCards');
const passwordCheck = document.getElementById('passwordCheck');
const toggleVisibility = document.getElementById('toggleVisibility');
const strengthBar = document.getElementById('strengthBar');
const strengthLabel = document.getElementById('strengthLabel');
const crackTime = document.getElementById('crackTime');
const verdictBanner = document.getElementById('verdictBanner');
const verdictIcon = document.getElementById('verdictIcon');
const verdictText = document.getElementById('verdictText');
const verdictTip = document.getElementById('verdictTip');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');

// =========== NAVIGATION ===========
navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        navTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const target = tab.dataset.section;
        sectionGenerator.classList.toggle('active', target === 'generator');
        sectionChecker.classList.toggle('active', target === 'checker');
    });
});

// =========== PARTICLES ===========
function createParticles() {
    const container = document.getElementById('bgParticles');
    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDuration = (8 + Math.random() * 15) + 's';
        particle.style.animationDelay = (Math.random() * 10) + 's';
        particle.style.width = (2 + Math.random() * 3) + 'px';
        particle.style.height = particle.style.width;
        particle.style.opacity = 0.2 + Math.random() * 0.4;
        container.appendChild(particle);
    }
}
createParticles();

// =========== GENERATE BUTTON HOVER ===========
btnGenerate.addEventListener('mousemove', (e) => {
    const rect = btnGenerate.getBoundingClientRect();
    btnGenerate.style.setProperty('--x', ((e.clientX - rect.left) / rect.width * 100) + '%');
    btnGenerate.style.setProperty('--y', ((e.clientY - rect.top) / rect.height * 100) + '%');
});

// =========== KEYWORD INPUT ===========
keywordInput.addEventListener('input', () => {
    const val = keywordInput.value;
    charCounter.textContent = `${val.length}/30`;
    btnGenerate.disabled = val.trim().length === 0;
});

// =========== HELPERS ===========
function escapeHtml(text) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, m => map[m]);
}

function colorizePassword(pwd) {
    return pwd.split('').map(c => {
        if (/[A-Z]/.test(c)) return `<span class="char-upper">${escapeHtml(c)}</span>`;
        if (/[a-z]/.test(c)) return `<span class="char-lower">${escapeHtml(c)}</span>`;
        if (/[0-9]/.test(c)) return `<span class="char-num">${escapeHtml(c)}</span>`;
        return `<span class="char-sym">${escapeHtml(c)}</span>`;
    }).join('');
}

function showToast(msg) {
    toastMessage.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

// =========== RENDER PASSWORDS ===========
function renderPasswords(passwords) {
    passwordCards.innerHTML = passwords.map((pwd, i) => `
        <div class="pwd-card" id="pwdCard${i}">
            <div class="pwd-number">${i + 1}</div>
            <div class="pwd-text">${colorizePassword(pwd)}</div>
            <button class="btn-copy" data-password="${escapeHtml(pwd)}" id="btnCopy${i}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                Copiar
            </button>
        </div>
    `).join('');

    document.querySelectorAll('.btn-copy').forEach(btn => {
        btn.addEventListener('click', () => copyPassword(btn.dataset.password, btn));
    });
}

async function copyPassword(pwd, btn) {
    try {
        await navigator.clipboard.writeText(pwd);
        btn.classList.add('copied');
        btn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <polyline points="20 6 9 17 4 12"/>
            </svg>
            ¡Copiado!
        `;
        showToast('¡Contraseña copiada al portapapeles!');
        setTimeout(() => {
            btn.classList.remove('copied');
            btn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                Copiar
            `;
        }, 2000);
    } catch {
        showToast('Error al copiar. Intenta manualmente.');
    }
}

// =========== GENERATE (llama a Python) ===========
let currentKeyword = '';

btnGenerate.addEventListener('click', () => {
    currentKeyword = keywordInput.value.trim();
    if (!currentKeyword || !pythonReady) return;

    const words = currentKeyword.split(/\s+/);
    if (words.length > 3) {
        showToast('Solo se permiten hasta 3 palabras clave.');
        return;
    }

    btnGenerate.classList.add('loading');

    setTimeout(() => {
        const passwords = callPython('generate_passwords', currentKeyword);
        if (passwords) {
            renderPasswords(passwords);
            resultsContainer.classList.add('visible');
            resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        btnGenerate.classList.remove('loading');
    }, 300);
});

btnRegenerate.addEventListener('click', () => {
    if (!currentKeyword || !pythonReady) return;

    const words = currentKeyword.split(/\s+/);
    if (words.length > 3) {
        showToast('Solo se permiten hasta 3 palabras clave.');
        return;
    }

    passwordCards.style.opacity = '0';
    passwordCards.style.transform = 'translateY(10px)';

    setTimeout(() => {
        const passwords = callPython('generate_passwords', currentKeyword);
        if (passwords) {
            renderPasswords(passwords);
        }
        passwordCards.style.opacity = '1';
        passwordCards.style.transform = 'translateY(0)';
    }, 200);
});

keywordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !btnGenerate.disabled) btnGenerate.click();
});

// =========== CHECK PASSWORD (llama a Python) ===========
toggleVisibility.addEventListener('click', () => {
    const isPassword = passwordCheck.type === 'password';
    passwordCheck.type = isPassword ? 'text' : 'password';
    toggleVisibility.querySelector('.eye-open').style.display = isPassword ? 'none' : 'block';
    toggleVisibility.querySelector('.eye-closed').style.display = isPassword ? 'block' : 'none';
});

let checkDebounce = null;

passwordCheck.addEventListener('input', () => {
    if (passwordCheck.value.includes(' ')) {
        passwordCheck.value = passwordCheck.value.replace(/\s+/g, '');
        showToast('Las contraseñas no pueden contener espacios.');
    }
    
    const pwd = passwordCheck.value;
    if (!pwd) { resetChecker(); return; }
    clearTimeout(checkDebounce);
    checkDebounce = setTimeout(() => {
        if (!pythonReady) return;
        const data = callPython('check_password', pwd);
        if (data) renderCheckResults(data);
    }, 100);
});

// Emoji maps (Python returns plain text keys to avoid encoding issues)
const LABEL_EMOJI = {
    'Muy Debil': '🔴 Muy Débil',
    'Regular': '🟡 Regular',
    'Buena': '🟢 Buena',
    'Fuerte': '🟢 Fuerte',
    'Excelente': '🔵 Excelente'
};

const VERDICT_EMOJI = {
    'trophy': '🏆',
    'strong': '💪',
    'warning': '⚠️',
    'danger': '🚨'
};

const CRACK_EMOJI = {
    'Se podria descifrar instantaneamente': '⚡ Se podría descifrar instantáneamente',
    'Tiempo estimado:': '⏱️ Tiempo estimado:'
};

function addCrackEmoji(text) {
    if (text.includes('instantaneamente')) return '⚡ ' + text.replace('instantaneamente', 'instantáneamente').replace('podria', 'podría');
    if (text.includes('millones')) return '🛡️ ' + text.replace('anos', 'años').replace('Practicamente', '¡Prácticamente') + '!';
    if (text.includes('anos')) {
        const fixed = text.replace('anos', 'años').replace('dias', 'días');
        if (fixed.includes('años')) return '📅 ' + fixed;
        return '📅 ' + fixed;
    }
    if (text.includes('dias')) return '📅 ' + text.replace('dias', 'días');
    if (text.includes('horas') || text.includes('minutos')) return '⏱️ ' + text;
    if (text.includes('segundos')) return '⚡ ' + text;
    return text;
}

function renderCheckResults(data) {
    const { checks, score, level, label, crack_time, length_current, verdict } = data;

    // Update checklist
    toggleCheck('checkLength', checks.length);
    toggleCheck('checkUpper', checks.upper);
    toggleCheck('checkLower', checks.lower);
    toggleCheck('checkNumber', checks.number);
    toggleCheck('checkSymbol', checks.symbol);
    toggleCheck('checkCommon', checks.common);
    toggleCheck('checkSequence', checks.sequence);

    document.getElementById('lengthCount').textContent = `(${length_current}/12)`;

    const colorMap = {
        weak: 'var(--strength-weak)',
        fair: 'var(--strength-fair)',
        good: 'var(--strength-good)',
        excellent: 'var(--strength-excellent)'
    };

    strengthBar.style.width = score + '%';
    strengthBar.style.background = colorMap[level] || 'var(--strength-weak)';
    strengthLabel.textContent = LABEL_EMOJI[label] || label;
    strengthLabel.style.color = colorMap[level] || 'var(--text-muted)';

    crackTime.textContent = addCrackEmoji(crack_time);

    verdictBanner.className = 'verdict-banner visible ' + level;
    verdictIcon.textContent = VERDICT_EMOJI[verdict.icon] || verdict.icon;

    // Fix accented characters from Python
    let vText = verdict.text
        .replace('Contrasena', 'Contraseña');
    let vTip = verdict.tip
        .replace('contrasena', 'contraseña')
        .replace('Contrasena', 'Contraseña')
        .replace('mas caracteres', 'más caracteres')
        .replace('min.', 'mín.')
        .replace('mayusculas', 'mayúsculas')
        .replace('minusculas', 'minúsculas')
        .replace('numeros', 'números')
        .replace('simbolos', 'símbolos')
        .replace('facil', 'fácil');

    verdictText.textContent = vText;
    verdictTip.textContent = vTip;
}

function toggleCheck(id, passed) {
    document.getElementById(id).classList.toggle('passed', passed);
}

function resetChecker() {
    strengthBar.style.width = '0%';
    strengthLabel.textContent = '—';
    strengthLabel.style.color = 'var(--text-muted)';
    crackTime.textContent = '';
    verdictBanner.className = 'verdict-banner';
    document.getElementById('lengthCount').textContent = '(0/12)';
    ['checkLength', 'checkUpper', 'checkLower', 'checkNumber', 'checkSymbol', 'checkCommon', 'checkSequence']
        .forEach(id => document.getElementById(id).classList.remove('passed'));
}

// =========== INIT ===========
initPyodide();
