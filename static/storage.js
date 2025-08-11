const fs = require('fs');
const path = require('path');

const SETTINGS_FILE = path.join(__dirname, '..', 'settings.json');

function loadSettings() {
    try {
        if (fs.existsSync(SETTINGS_FILE)) {
            const raw = fs.readFileSync(SETTINGS_FILE, 'utf8');
            return JSON.parse(raw);
        } else {
            return {};
        }
    } catch (err) {
        console.error('[STORAGE] Errore caricamento settings:', err);
        return {};
    }
}

function saveSettings(data) {
    try {
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
        console.error('[STORAGE] Errore salvataggio settings:', err);
    }
}

function get(key, fallback = null) {
    const data = loadSettings();
    return key in data ? data[key] : fallback;
}

function set(key, value) {
    const data = loadSettings();
    data[key] = value;
    saveSettings(data);
}

function remove(key) {
    const data = loadSettings();
    delete data[key];
    saveSettings(data);
}

/**
 * Unisce nuove impostazioni con quelle vecchie,
 * proteggendo usableBoards, active e selectedSound
 * da sovrascritture con valori vuoti/null.
 */
function mergeSettings(newData) {
    const oldData = loadSettings();
    const merged = { ...oldData, ...newData };

    // Protezione usableBoards
    if (
        Array.isArray(newData.usableBoards) &&
        newData.usableBoards.length === 0 &&
        Array.isArray(oldData.usableBoards) &&
        oldData.usableBoards.length > 0
    ) {
        merged.usableBoards = oldData.usableBoards;
    }

    // Protezione active
    if (
        (!newData.active || String(newData.active).trim() === '') &&
        oldData.active &&
        String(oldData.active).trim() !== ''
    ) {
        merged.active = oldData.active;
    }

    // Protezione selectedSound
    if (
        (!newData.selectedSound || String(newData.selectedSound).trim() === '') &&
        oldData.selectedSound &&
        String(oldData.selectedSound).trim() !== ''
    ) {
        merged.selectedSound = oldData.selectedSound;
    }

    saveSettings(merged);
}

module.exports = {
    loadSettings,
    saveSettings,
    get,
    set,
    remove,
    mergeSettings,
};
