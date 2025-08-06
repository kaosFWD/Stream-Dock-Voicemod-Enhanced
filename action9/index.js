let uuid = '', action = '', context = '', isload = true;

/* 连接websoket $localizedStrings 国际化字符对象 */
$SD.on('connected', e => {
    uuid = e.uuid;
    action = e.actionInfo.action;
    context = e.actionInfo.context;
    localAll() // 国际化
})

/* 插件触发的事件 */
let settings;
$SD.on('sendToPropertyInspector', e => {
    let { event } = e
    /* 插件设置数据后触发 */
    if (event === 'didReceiveSettings') {
        if (isload) {
            isload = false
            // *** FIX: Richiedi soundboard dal plugin ***
            $SD.api.sendToPlugin(uuid, action, {
                type: 'getSoundboards'
            })
        }
        settings = e.payload.settings
        let { voiceStatus, usableBoards, active, usingCache } = settings
        
        console.log('Settings ricevute:', settings); // Debug
        
        // *** NUOVO: Gestione della cache ***
        let statusMessage = '';
        if (voiceStatus) {
            statusMessage = $localizedStrings['连接成功 - 正在运行'];
        } else if (usingCache && usableBoards && usableBoards.length > 0) {
            statusMessage = $localizedStrings['使用缓存数据'] || 'Usando dati dalla cache - Voicemod offline';
        } else {
            statusMessage = $localizedStrings['连接失败，正在尝试重连...'];
        }
        
        // *** FIX: Usa il selettore giusto ***
        const selectBoard = document.getElementById('selectBoard');
        if (selectBoard) {
            // Costruisci l'HTML per le opzioni
            let html = `<option value="">${$localizedStrings['请选择音板'] || 'Seleziona una soundboard'}</option>`
            
            if (usableBoards && usableBoards.length > 0) {
                console.log(`Caricando ${usableBoards.length} soundboard nel menu`); // Debug
                usableBoards.forEach(item => {
                    html += `<option value="${item.id}">${item.name}</option>`
                })
            } else {
                console.log('Nessuna soundboard disponibile'); // Debug
            }
            
            selectBoard.innerHTML = html;
            
            /* 寻找是否存在之前选择的选项 否则恢复默认选择 */
            if (usableBoards && usableBoards.length > 0) {
                selectBoard.value = usableBoards.some(item => item.id === active) ? active : ''
            } else {
                selectBoard.value = ''
            }
        }
        
        // *** FIX: Popola anche il menu audio (se necessario) ***
        const selectVoice = document.getElementById('selectVoice');
        if (selectVoice && active && usableBoards) {
            const selectedBoard = usableBoards.find(board => board.id === active);
            if (selectedBoard && selectedBoard.sounds) {
                let voiceHtml = `<option value="">${$localizedStrings['请选择音频'] || 'Seleziona un audio'}</option>`;
                selectedBoard.sounds.forEach(sound => {
                    voiceHtml += `<option value="${sound.id}">${sound.name}</option>`;
                });
                selectVoice.innerHTML = voiceHtml;
            } else {
                selectVoice.innerHTML = `<option value="">${$localizedStrings['请选择音频'] || 'Seleziona un audio'}</option>`;
            }
        }
        
        // Aggiorna il messaggio di stato
        const statusElement = document.querySelector('.lineCenter');
        if (statusElement) {
            statusElement.innerHTML = statusMessage;
        }
        
        // *** NUOVO: Mostra indicatore cache se necessario ***
        updateCacheIndicator(usingCache, voiceStatus);
        
        // *** NUOVO: Aggiorna visibilità pulsanti ***
        updateButtonVisibility(usingCache, voiceStatus);
    }
})

// *** NUOVO: Funzione per mostrare/nascondere indicatore cache ***
function updateCacheIndicator(usingCache, voiceStatus) {
    let cacheIndicator = document.getElementById('cacheIndicator');
    
    if (!cacheIndicator) {
        // Crea l'indicatore se non esiste
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

// *** NUOVO: Pulsante per pulire la cache ***
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
                // Invia comando per pulire la cache
                $SD.api.sendToPlugin(uuid, action, {
                    type: 'clearCache'
                });
                
                // Reset dell'interfaccia
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
                
                // Nasconde l'indicatore cache
                updateCacheIndicator(false, false);
            }
        });
        
        // Aggiungi al wrapper
        const wrapper = document.querySelector('.sdpi-wrapper');
        if (wrapper) {
            wrapper.appendChild(clearButton);
        }
    }
    
    return clearButton;
}

// *** NUOVO: Pulsante per ricaricare manualmente ***
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
            $SD.api.sendToPlugin(uuid, action, {
                type: 'refreshSoundboards'
            });
            
            this.innerHTML = '🔄 Ricaricando...';
            this.disabled = true;
            
            setTimeout(() => {
                this.innerHTML = '🔄 Ricarica Soundboard';
                this.disabled = false;
            }, 3000);
        });
        
        // Aggiungi al wrapper
        const wrapper = document.querySelector('.sdpi-wrapper');
        if (wrapper) {
            wrapper.appendChild(refreshButton);
        }
    }
    
    return refreshButton;
}

// *** NUOVO: Gestione visibilità pulsanti ***
function updateButtonVisibility(usingCache, voiceStatus) {
    const clearButton = document.getElementById('clearCacheBtn');
    const refreshButton = document.getElementById('refreshBtn');
    
    if (clearButton) {
        clearButton.style.display = usingCache ? 'block' : 'none';
    }
    
    if (refreshButton) {
        refreshButton.style.display = 'block'; // Sempre visibile
    }
}

/* *** FIX: Gestisci cambio soundboard *** */
document.addEventListener('DOMContentLoaded', function() {
    // Aggiungi listener per il cambio soundboard
    const selectBoard = document.getElementById('selectBoard');
    if (selectBoard) {
        selectBoard.addEventListener('change', function() {
            if (!settings) settings = {};
            settings.active = this.value;
            
            console.log('Soundboard selezionata:', this.value); // Debug
            
            // Aggiorna il menu degli audio se la soundboard ha dei suoni
            const selectVoice = document.getElementById('selectVoice');
            if (selectVoice && settings.usableBoards) {
                const selectedBoard = settings.usableBoards.find(board => board.id === this.value);
                if (selectedBoard && selectedBoard.sounds) {
                    let voiceHtml = `<option value="">${$localizedStrings['请选择音频'] || 'Seleziona un audio'}</option>`;
                    selectedBoard.sounds.forEach(sound => {
                        voiceHtml += `<option value="${sound.id}">${sound.name}</option>`;
                    });
                    selectVoice.innerHTML = voiceHtml;
                } else {
                    selectVoice.innerHTML = `<option value="">${$localizedStrings['请选择音频'] || 'Seleziona un audio'}</option>`;
                }
            }
            
            // Salva le impostazioni
            $SD.api.setSettings(context, settings);
        });
    }
    
    // Aggiungi listener per il cambio audio
    const selectVoice = document.getElementById('selectVoice');
    if (selectVoice) {
        selectVoice.addEventListener('change', function() {
            if (!settings) settings = {};
            settings.selectedSound = this.value;
            
            console.log('Audio selezionato:', this.value); // Debug
            
            // Salva le impostazioni
            $SD.api.setSettings(context, settings);
        });
    }
});

// Inizializza i nuovi elementi quando la pagina è caricata
document.addEventListener('DOMContentLoaded', function() {
    // Aggiungi i pulsanti dopo un breve delay per assicurarsi che gli elementi esistano
    setTimeout(() => {
        createClearCacheButton();
        createRefreshButton();
        updateButtonVisibility(settings?.usingCache, settings?.voiceStatus);
    }, 500);
});

// *** NUOVO: Gestisci messaggi dal plugin ***
$SD.on('sendToPropertyInspector', e => {
    if (e.event === 'refreshComplete') {
        const refreshButton = document.getElementById('refreshBtn');
        if (refreshButton) {
            refreshButton.innerHTML = '🔄 Ricarica Soundboard';
            refreshButton.disabled = false;
        }
    }
});