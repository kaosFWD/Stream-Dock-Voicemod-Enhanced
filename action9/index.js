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
            $SD.api.sendToPlugin(uuid, action, {
                type: 'getSoundboards'
            })
        }
        settings = e.payload.settings
        let { voiceStatus, usableBoards, active, usingCache } = settings
        
        // *** NUOVO: Gestione della cache ***
        let statusMessage = '';
        if (voiceStatus) {
            statusMessage = $localizedStrings['连接成功 - 正在运行'];
        } else if (usingCache && usableBoards && usableBoards.length > 0) {
            statusMessage = $localizedStrings['使用缓存数据'] || 'Usando dati dalla cache - Voicemod offline';
        } else {
            statusMessage = $localizedStrings['连接失败，正在尝试重连...'];
        }
        
        // Costruisci l'HTML per le opzioni
        let html = `<option value="">${$localizedStrings['请选择音板']}</option>`
        
        if (usableBoards && usableBoards.length > 0) {
            usableBoards.forEach(item => {
                html += `<option value="${item.id}">${item.name}</option>`
            })
        }
        
        $('#myselect').innerHTML = html
        
        /* 寻找是否存在之前选择的选项 否则恢复默认选择 */
        if (usableBoards && usableBoards.length > 0) {
            $('#myselect').value = usableBoards.some(item => item.id === active) ? active : ''
        } else {
            $('#myselect').value = ''
        }
        
        // Aggiorna il messaggio di stato
        $('.lineCenter').innerHTML = statusMessage
        
        // *** NUOVO: Mostra indicatore cache se necessario ***
        updateCacheIndicator(usingCache, voiceStatus);
    }
})

// *** NUOVO: Funzione per mostrare/nascondere indicatore cache ***
function updateCacheIndicator(usingCache, voiceStatus) {
    let cacheIndicator = $('#cacheIndicator');
    
    if (!cacheIndicator) {
        // Crea l'indicatore se non esiste
        cacheIndicator = document.createElement('div');
        cacheIndicator.id = 'cacheIndicator';
        cacheIndicator.style.cssText = `
            margin-top: 10px;
            padding: 5px;
            border-radius: 3px;
            font-size: 12px;
            text-align: center;
        `;
        $('.lineCenter').parentNode.insertBefore(cacheIndicator, $('.lineCenter').nextSibling);
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
function addClearCacheButton() {
    let clearButton = $('#clearCacheBtn');
    
    if (!clearButton) {
        clearButton = document.createElement('button');
        clearButton.id = 'clearCacheBtn';
        clearButton.innerHTML = '🗑️ Pulisci Cache';
        clearButton.style.cssText = `
            margin-top: 10px;
            padding: 5px 10px;
            background-color: #dc3545;
            color: white;
            border: none;
            border-radius: 3px;
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
                $('#myselect').innerHTML = `<option value="">${$localizedStrings['请选择音板']}</option>`;
                $('#myselect').value = '';
                
                // Nasconde l'indicatore cache
                updateCacheIndicator(false, false);
            }
        });
        
        // Aggiungi dopo l'indicatore cache
        let cacheIndicator = $('#cacheIndicator');
        if (cacheIndicator) {
            cacheIndicator.parentNode.insertBefore(clearButton, cacheIndicator.nextSibling);
        }
    }
    
    // Mostra il pulsante solo se stiamo usando la cache
    clearButton.style.display = settings && settings.usingCache ? 'block' : 'none';
}

/* 切换音板选择 */
$('#myselect').addEventListener('change', function () {
    settings.active = this.value
    console.log(context, settings);
    
    $SD.api.setSettings(context, settings)
})

// *** NUOVO: Pulsante per ricaricare manualmente ***
function addRefreshButton() {
    let refreshButton = $('#refreshBtn');
    
    if (!refreshButton) {
        refreshButton = document.createElement('button');
        refreshButton.id = 'refreshBtn';
        refreshButton.innerHTML = '🔄 Ricarica Soundboard';
        refreshButton.style.cssText = `
            margin-top: 5px;
            padding: 5px 10px;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 3px;
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
            }, 2000);
        });
        
        // Aggiungi prima del selettore
        $('#myselect').parentNode.insertBefore(refreshButton, $('#myselect'));
    }
}

// Inizializza i nuovi elementi quando la pagina è caricata
document.addEventListener('DOMContentLoaded', function() {
    // Aggiungi i pulsanti dopo un breve delay per assicurarsi che gli elementi esistano
    setTimeout(() => {
        addClearCacheButton();
        addRefreshButton();
    }, 500);
});

// $SD.api.setSettings(payload.context, payload) // 保存设置
// $SD.api.sendToPlugin(uuid, action, {})