let uuid = '', action = '', context = '', isload = true;

// Connessione WebSocket + Localizzazione
$SD.on('connected', e => {
    uuid = e.uuid;
    action = e.actionInfo.action;
    context = e.actionInfo.context;
    localAll();
});

let settings;
$SD.on('sendToPropertyInspector', e => {
    let { event } = e;

    if (event === 'didReceiveSettings') {
        if (isload) {
            isload = false;
            // Richiesta iniziale soundboard al plugin
            $SD.api.sendToPlugin(uuid, action, { type: 'getSoundboards' });
        }
        settings = e.payload.settings;
        let { voiceStatus, usableBoards, active, usingCache, selectedSound } = settings;

        // === Gestione cache sicura ===
        try {
            const storage = require('../static/storage.js');
            const toSave = {};

            // Protezione usableBoards
            if (Array.isArray(usableBoards) && usableBoards.length > 0) {
                toSave.usableBoards = usableBoards;
            }

            // Protezione active
            if (active && typeof active === 'string' && active.trim() !== '') {
                toSave.active = active;
            }

            // Protezione selectedSound
            if (selectedSound && typeof selectedSound === 'string' && selectedSound.trim() !== '') {
                toSave.selectedSound = selectedSound;
            }

            if (Object.keys(toSave).length > 0) {
                storage.mergeSettings(toSave);
            }

        } catch (err) {
            console.error('[CACHE] Errore aggiornamento cache:', err);
        }

        console.log('Settings ricevute:', settings);

        let statusMessage = '';
        if (voiceStatus) {
            statusMessage = $localizedStrings['连接成功 - 正在运行'];
        } else if (usingCache && usableBoards && usableBoards.length > 0) {
            statusMessage = $localizedStrings['使用缓存数据'] || 'Usando dati dalla cache - Voicemod offline';
        } else {
            statusMessage = $localizedStrings['连接失败，正在尝试重连...'];
        }

        const selectBoard = document.getElementById('selectBoard');
        if (selectBoard) {
            let html = `<option value="">${$localizedStrings['请选择音板'] || 'Seleziona una soundboard'}</option>`;
            if (usableBoards && usableBoards.length > 0) {
                console.log(`Caricando ${usableBoards.length} soundboard nel menu`);
                usableBoards.forEach(item => {
                    html += `<option value="${item.id}">${item.name}</option>`;
                });
            } else {
                console.log('Nessuna soundboard disponibile');
            }
            selectBoard.innerHTML = html;
            if (usableBoards && usableBoards.length > 0) {
                selectBoard.value = usableBoards.some(item => item.id === active) ? active : '';
            } else {
                selectBoard.value = '';
            }
        }

        const selectVoice = document.getElementById('selectVoice');
        if (selectVoice && active && usableBoards) {
            const selectedBoard = usableBoards.find(board => board.id === active);
            if (selectedBoard && selectedBoard.sounds) {
                let voiceHtml = `<option value="">${$localizedStrings['请选择音频'] || 'Seleziona un audio'}</option>`;
                selectedBoard.sounds.forEach(sound => {
                    voiceHtml += `<option value="${sound.id}">${sound.name}</option>`;
                });
                selectVoice.innerHTML = voiceHtml;
                if (settings.selectedSound) {
                    selectVoice.value = settings.selectedSound;
                    console.log('Audio ripristinato:', settings.selectedSound);
                }
            } else {
                selectVoice.innerHTML = `<option value="">${$localizedStrings['请选择音频'] || 'Seleziona un audio'}</option>`;
            }
        }

        const statusElement = document.querySelector('.lineCenter');
        if (statusElement) {
            statusElement.innerHTML = statusMessage;
        }
        updateCacheIndicator(usingCache, voiceStatus);
        updateButtonVisibility(usingCache, voiceStatus);
    }
});

// === Indicatore cache ===
function updateCacheIndicator(usingCache, voiceStatus) {
    let cacheIndicator = document.getElementById('cacheIndicator');
    if (!cacheIndicator) {
        cacheIndicator = document.createElement('div');
        cacheIndicator.id = 'cacheIndicator';
        cacheIndicator.style.cssText = `
            margin-top: 10px;
            padding: 8px;
            border-radius: 4px;
            font-size: 11px;
            text-align: center;
        `;
        const statusElement = document.querySelector('.lineCenter');
        if (statusElement && statusElement.parentNode) {
            statusElement.parentNode.insertBefore(cacheIndicator, statusElement.nextSibling);
        }
    }
    if (usingCache && !voiceStatus) {
        cacheIndicator.innerHTML = '📦 Dati dalla cache - Riavvia Voicemod per aggiornare';
        cacheIndicator.style.backgroundColor = '#fff3cd';
        cacheIndicator.style.color = '#856404';
        cacheIndicator.style.border = '1px solid #ffeaa7';
        cacheIndicator.style.display = 'block';
    } else {
        cacheIndicator.style.display = 'none';
    }
}

// === Pulsante pulizia cache ===
function createClearCacheButton() {
    let clearButton = document.getElementById('clearCacheBtn');
    if (!clearButton) {
        clearButton = document.createElement('button');
        clearButton.id = 'clearCacheBtn';
        clearButton.innerHTML = '🗑️ Pulisci Cache';
        clearButton.className = 'sdpi-item-value';
        clearButton.style.cssText = `
            margin-top: 8px;
            padding: 6px 12px;
            background-color: #dc3545;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            width: 100%;
        `;
        clearButton.addEventListener('click', function() {
            if (confirm('Vuoi davvero pulire la cache delle soundboard?')) {
                $SD.api.sendToPlugin(uuid, action, { type: 'clearCache' });
                const selectBoard = document.getElementById('selectBoard');
                const selectVoice = document.getElementById('selectVoice');
                if (selectBoard) {
                    selectBoard.innerHTML = `<option value="">${$localizedStrings['请选择音板'] || 'Seleziona una soundboard'}</option>`;
                    selectBoard.value = '';
                }
                if (selectVoice) {
                    selectVoice.innerHTML = `<option value="">${$localizedStrings['请选择音频'] || 'Seleziona un audio'}</option>`;
                    selectVoice.value = '';
                }
                updateCacheIndicator(false, false);
            }
        });
        const wrapper = document.querySelector('.sdpi-wrapper');
        if (wrapper) wrapper.appendChild(clearButton);
    }
    return clearButton;
}

// === Pulsante ricarica ===
function createRefreshButton() {
    let refreshButton = document.getElementById('refreshBtn');
    if (!refreshButton) {
        refreshButton = document.createElement('button');
        refreshButton.id = 'refreshBtn';
        refreshButton.innerHTML = '🔄 Ricarica Soundboard';
        refreshButton.className = 'sdpi-item-value';
        refreshButton.style.cssText = `
            margin-top: 8px;
            padding: 6px 12px;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            width: 100%;
        `;
        refreshButton.addEventListener('click', function() {
            $SD.api.sendToPlugin(uuid, action, { type: 'refreshSoundboards' });
            this.innerHTML = '🔄 Ricaricando...';
            this.disabled = true;
            setTimeout(() => {
                this.innerHTML = '🔄 Ricarica Soundboard';
                this.disabled = false;
            }, 3000);
        });
        const wrapper = document.querySelector('.sdpi-wrapper');
        if (wrapper) wrapper.appendChild(refreshButton);
    }
    return refreshButton;
}

// === Visibilità pulsanti ===
function updateButtonVisibility(usingCache, voiceStatus) {
    const clearButton = document.getElementById('clearCacheBtn');
    const refreshButton = document.getElementById('refreshBtn');
    if (clearButton) clearButton.style.display = usingCache ? 'block' : 'none';
    if (refreshButton) refreshButton.style.display = 'block';
}

// === Eventi cambio selezione ===
document.addEventListener('DOMContentLoaded', function() {
    const selectBoard = document.getElementById('selectBoard');
    if (selectBoard) {
        selectBoard.addEventListener('change', function() {
            if (!settings) settings = {};
            settings.active = this.value;
            console.log('Soundboard selezionata:', this.value);
            const selectVoice = document.getElementById('selectVoice');
            if (selectVoice && settings.usableBoards) {
                const selectedBoard = settings.usableBoards.find(board => board.id === this.value);
                if (selectedBoard && selectedBoard.sounds) {
                    let voiceHtml = `<option value="">${$localizedStrings['请选择音频'] || 'Seleziona un audio'}</option>`;
                    selectedBoard.sounds.forEach(sound => {
                        voiceHtml += `<option value="${sound.id}">${sound.name}</option>`;
                    });
                    selectVoice.innerHTML = voiceHtml;
                    if (settings.selectedSound && selectedBoard.sounds.find(s => s.id === settings.selectedSound)) {
                        selectVoice.value = settings.selectedSound;
                    } else {
                        settings.selectedSound = '';
                    }
                } else {
                    selectVoice.innerHTML = `<option value="">${$localizedStrings['请选择音频'] || 'Seleziona un audio'}</option>`;
                    settings.selectedSound = '';
                }
            }
            $SD.api.setSettings(context, settings);
        });
    }
    const selectVoice = document.getElementById('selectVoice');
    if (selectVoice) {
        selectVoice.addEventListener('change', function() {
            if (!settings) settings = {};
            settings.selectedSound = this.value;
            console.log('Audio selezionato:', this.value);
            $SD.api.setSettings(context, settings);
        });
    }
});

// === Inizializzazione pulsanti ===
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        createClearCacheButton();
        createRefreshButton();
        updateButtonVisibility(settings?.usingCache, settings?.voiceStatus);
    }, 500);
});

// === Gestione refresh completato ===
$SD.on('sendToPropertyInspector', e => {
    if (e.event === 'refreshComplete') {
        const refreshButton = document.getElementById('refreshBtn');
        if (refreshButton) {
            refreshButton.innerHTML = '🔄 Ricarica Soundboard';
            refreshButton.disabled = false;
        }
    }
});
