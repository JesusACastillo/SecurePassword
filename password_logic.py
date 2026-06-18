"""
SecureKey — Lógica de Contraseñas en Python
Este archivo corre en el navegador via Pyodide (WebAssembly).
No necesita servidor.
"""

import random
import json

# =========== CONSTANTES ===========

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
    '1234', '123456789', '1234567890', '0987654321', 'contraseña'
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


# =========== FUNCIONES DE GENERACIÓN ===========

def leet_speak(word: str) -> str:
    """Convierte una palabra a leet speak con variaciones aleatorias."""
    result = []
    for char in word:
        lower = char.lower()
        if lower in LEET_MAP and random.random() > 0.4:
            options = LEET_MAP[lower]
            result.append(random.choice(options))
        else:
            result.append(char.upper() if random.random() > 0.5 else char.lower())
    return ''.join(result)


def random_symbols(count: int) -> str:
    """Genera símbolos aleatorios."""
    return ''.join(random.choice(SYMBOLS) for _ in range(count))


def random_digits(count: int) -> str:
    """Genera dígitos aleatorios."""
    return ''.join(str(random.randint(0, 9)) for _ in range(count))


def random_fragment() -> str:
    """Selecciona un fragmento de palabra aleatorio."""
    return random.choice(WORD_FRAGMENTS)


def shuffle_middle(text: str) -> str:
    """Mezcla los caracteres del medio de un string, manteniendo inicio y final."""
    if len(text) <= 4:
        return text
    chars = list(text)
    middle = chars[1:-1]
    random.shuffle(middle)
    return chars[0] + ''.join(middle) + chars[-1]


def ensure_requirements(password: str, target_length: int = 12) -> str:
    """Asegura que la contraseña cumpla con todos los requisitos mínimos y longitud."""
    target_length = max(12, target_length)
    
    pwd = password
    if len(pwd) > target_length:
        pwd = pwd[:target_length]
        
    while len(pwd) < target_length:
        pwd += random.choice(SYMBOLS + '0123456789')
        
    pwd_chars = list(pwd)
    
    missing = []
    if not any(c.isupper() for c in pwd_chars):
        missing.append('X')
    if not any(c.islower() for c in pwd_chars):
        missing.append('k')
    if not any(c.isdigit() for c in pwd_chars):
        missing.append(str(random.randint(0, 9)))
    if not any(c in SYMBOLS for c in pwd_chars):
        missing.append(random.choice(SYMBOLS))
        
    for m in missing:
        for _ in range(100):  # evitar bucle infinito
            idx = random.randint(0, len(pwd_chars) - 1)
            c = pwd_chars[idx]
            if c.isupper() and sum(1 for x in pwd_chars if x.isupper()) <= 1: continue
            if c.islower() and sum(1 for x in pwd_chars if x.islower()) <= 1: continue
            if c.isdigit() and sum(1 for x in pwd_chars if x.isdigit()) <= 1: continue
            if c in SYMBOLS and sum(1 for x in pwd_chars if x in SYMBOLS) <= 1: continue
            pwd_chars[idx] = m
            break

    return ''.join(pwd_chars)


def generate_passwords(keyword: str, target_length: int = 12) -> str:
    """
    Genera 3 contraseñas seguras basadas en una palabra clave y longitud objetivo.
    Retorna JSON string con la lista de contraseñas.
    """
    words = keyword.split()
    if len(words) > 3:
        words = words[:3]
    keyword = "".join(words)
    
    passwords = []

    # --- Estrategia 1: Leet speak + año + fragmento ---
    leet = leet_speak(keyword)
    year = random.randint(2020, 2026)
    sym = random_symbols(2)
    frag = random_fragment()
    pwd1 = f"{sym[0]}{leet}{sym[1]}{year}{frag}"
    passwords.append(ensure_requirements(pwd1, target_length))

    # --- Estrategia 2: Palabra invertida + fragmento + dígitos ---
    reversed_word = keyword[::-1]
    leet_rev = leet_speak(reversed_word)
    digits = random_digits(3)
    sym2 = random_symbols(2)
    frag2 = random_fragment()
    pwd2 = f"{frag2}{sym2[0]}{leet_rev}{digits}{sym2[1]}"
    passwords.append(ensure_requirements(pwd2, target_length))

    # --- Estrategia 3: Intercalado mayúsculas/minúsculas + símbolos ---
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
    passwords.append(ensure_requirements(pwd3, target_length))

    return json.dumps(passwords)


# =========== FUNCIONES DE VERIFICACIÓN ===========

def is_common_password(pwd: str) -> bool:
    """Verifica si la contraseña contiene palabras comunes."""
    lower = pwd.lower()
    return any(common in lower for common in COMMON_PASSWORDS)


def has_obvious_sequence(pwd: str) -> bool:
    """Verifica si la contraseña contiene secuencias obvias."""
    lower = pwd.lower()
    return any(seq in lower for seq in SEQUENCES)


def count_char_types(pwd: str) -> int:
    """Cuenta cuántos tipos de caracteres tiene la contraseña."""
    count = 0
    if any(c.isupper() for c in pwd):
        count += 1
    if any(c.islower() for c in pwd):
        count += 1
    if any(c.isdigit() for c in pwd):
        count += 1
    if any(not c.isalnum() for c in pwd):
        count += 1
    return count


def estimate_crack_time(pwd: str) -> str:
    """Estima el tiempo para descifrar la contraseña por fuerza bruta."""
    length = len(pwd)
    pool_size = 0

    if any(c.islower() for c in pwd):
        pool_size += 26
    if any(c.isupper() for c in pwd):
        pool_size += 26
    if any(c.isdigit() for c in pwd):
        pool_size += 10
    if any(not c.isalnum() for c in pwd):
        pool_size += 33

    if pool_size == 0:
        return ''

    # 10 mil millones de intentos por segundo (atacante poderoso)
    combinations = pool_size ** length
    seconds = combinations / 1e10

    if seconds < 1:
        return '⚡ Se podría descifrar instantáneamente'
    elif seconds < 60:
        return f'⚡ Tiempo estimado: {round(seconds)} segundos'
    elif seconds < 3600:
        return f'⏱ Tiempo estimado: {round(seconds / 60)} minutos'
    elif seconds < 86400:
        return f'⏱ Tiempo estimado: {round(seconds / 3600)} horas'
    elif seconds < 31536000:
        return f'📅 Tiempo estimado: {round(seconds / 86400)} días'
    elif seconds < 31536000 * 100:
        return f'📅 Tiempo estimado: {round(seconds / 31536000)} años'
    elif seconds < 31536000 * 1e6:
        return f'🔒 Tiempo estimado: {round(seconds / 31536000):,} años'
    else:
        return '🛡️ Tiempo estimado: millones de años — ¡Prácticamente imposible!'


def check_password(pwd: str) -> str:
    """
    Evalúa la seguridad de una contraseña.
    Retorna JSON string con todos los resultados.
    """
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

    # Determinar nivel
    if score < 25:
        level = 'weak'
        label = '🔴 Muy Débil'
    elif score < 50:
        level = 'fair'
        label = '🟡 Regular'
    elif score < 75:
        level = 'good'
        label = '🟢 Buena'
    elif score < 90:
        level = 'good'
        label = '🟢 Fuerte'
    else:
        level = 'excellent'
        label = '🔵 Excelente'

    # Generar tips de lo que falta
    missing_tips = []
    if not checks['length']:
        missing_tips.append('más caracteres (mín. 12)')
    if not checks['upper']:
        missing_tips.append('letras mayúsculas')
    if not checks['lower']:
        missing_tips.append('letras minúsculas')
    if not checks['number']:
        missing_tips.append('números')
    if not checks['symbol']:
        missing_tips.append('símbolos (!@#$%)')
    if not checks['common']:
        missing_tips.append('evitar palabras comunes')
    if not checks['sequence']:
        missing_tips.append('evitar secuencias obvias')

    # Veredicto
    if passed_count == 7:
        verdict_icon = '🏆'
        verdict_text = '¡Contraseña Perfecta!'
        verdict_tip = 'Tu contraseña cumple con todos los requisitos de seguridad. ¡Excelente trabajo!'
    elif passed_count >= 5:
        verdict_icon = '💪'
        verdict_text = 'Casi Perfecta'
        verdict_tip = f"Te falta: {', '.join(missing_tips)}."
    elif passed_count >= 3:
        verdict_icon = '⚠️'
        verdict_text = 'Necesita Mejoras'
        verdict_tip = f"Agrega: {', '.join(missing_tips)}."
    else:
        verdict_icon = '🚨'
        verdict_text = 'Contraseña Muy Débil'
        verdict_tip = 'Esta contraseña es fácil de adivinar. Sigue las recomendaciones para fortalecerla.'

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
