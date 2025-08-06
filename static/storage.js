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

module.exports = {
    loadSettings,
    saveSettings,
    get,
    set,
    remove,
};
