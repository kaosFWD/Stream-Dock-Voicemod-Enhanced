/* 变声软件socket相关代码 */
let voiceSocket, socketId = "100", voiceStatus, voiceKey = true;

// *** NUOVO: Sistema di Cache Persistente ***
const CacheManager = {
    // Salva le soundboard nella cache persistente
    saveSoundboards(soundboards) {
        const cacheData = {
            soundboards: soundboards,
            timestamp: Date.now(),
            version: "1.0.2"
        };
        
        // Salva per tutte le istanze dell'action9
        for (let context in $data[actionArr[8]].context_pool) {
            const currentSettings = $data[actionArr[8]].context_pool[context];
            $SD.setSettings(context, {
                ...currentSettings,
                cachedSoundboards: cacheData,
                voiceStatus: voiceStatus
            });
        }
    },
    
    // Carica le soundboard dalla cache
    loadCachedSoundboards(context) {
        const settings = $data[actionArr[8]].context_pool[context];
        if (settings && settings.cachedSoundboards && settings.cachedSoundboards.soundboards) {
            return settings.cachedSoundboards.soundboards;
        }
        return [];
    },
    
    // Verifica se la cache è valida (meno di 24 ore)
    isCacheValid(context) {
        const settings = $data[actionArr[8]].context_pool[context];
        if (settings && settings.cachedSoundboards && settings.cachedSoundboards.timestamp) {
            const cacheAge = Date.now() - settings.cachedSoundboards.timestamp;
            return cacheAge < (24 * 60 * 60 * 1000); // 24 ore
        }
        return false;
    }
};

const voiceSend = (action, payload, id = socketId) => {
    voiceSocket.send(JSON.stringify({
        action, payload, id
    }))
}, connect = (isReset = false) => {
    voiceSocket = new WebSocket("ws://localhost:59129/v1/")
    voiceSocket.onmessage = v => {
        let data = JSON.parse(v.data)
        console.log(data);
        /* 注册客户端 */
        if (data.actionID) {
            socketId = data.actionID
        } else {
            voiceSend("registerClient", { "clientKey": "streamer-l6hy23914" })
        }
        if (data.actionID === "100") voiceStatus = true;
        for (const key in $data) $data[key].onmessage?.(data);
    }
    /* 错误/断开通知该插件所有属性选择器 */
    if (isReset) {
        voiceStatus = false
        let errImg = [
            '../static/img/key-select-voice.png',
            '../static/img/key-random-voice-idle.png',
            '../static/img/key-voice-changer-off.png',
            '../static/img/key-hear-my-voice-off.png',
            '../static/img/key-ambient-sound-off.png',
            '../static/img/key-mute-sounds-off.png',
            '../static/img/key-push-bad-language-on-2.png',
            '../static/img/key-voice-changer-on-1.png',
            '../static/img/key-new-sound.png',
            '../static/img/key-stop-all-sounds.png',
            '../static/img/key-mute-for-me-idle.png'
        ]
        /* 统一返回连接状态并恢复默认背景图片 */
        actionArr.forEach(item => {
            for (const key in $data[item].context_pool) {
                $SD.setSettings(key, { voiceStatus })
                errImg.forEach((img, i) => { if (item === actionArr[i]) $SD.setImage(key, img) })
            }
        })
        
        // *** NUOVO: Notifica alle soundboard di usare la cache ***
        $data[actionArr[8]].loadFromCache();
    }
    voiceSocket.onerror = () => reconnect();
    voiceSocket.onclose = () => reconnect();
}, reconnect = () => {
    if (!voiceKey) return; // 节流处理
    voiceKey = false
    setTimeout(() => {
        voiceKey = true
        connect(true)
    }, 1000);
}

/* 行动数据汇总 */
let actionArr = [
    'com.hotspot.streamdock.voicemod.action1',
    'com.hotspot.streamdock.voicemod.action2',
    'com.hotspot.streamdock.voicemod.action3',
    'com.hotspot.streamdock.voicemod.action4',
    'com.hotspot.streamdock.voicemod.action5',
    'com.hotspot.streamdock.voicemod.action6',
    'com.hotspot.streamdock.voicemod.action7',
    'com.hotspot.streamdock.voicemod.action8',
    'com.hotspot.streamdock.voicemod.action9',
    'com.hotspot.streamdock.voicemod.action10',
    'com.hotspot.streamdock.voicemod.action11'
], $data = {
    /* 变声器选项 */
    [actionArr[0]]: {
        voicesArr: [],
        currentVoice: '',
        context_pool: {},
        onmessage(data) {
            console.log(data);

            /* 注册完成后获取所有声音列表 根据isEnabled过滤出可用的 */
            if (data.action === "registerClient") voiceSend("getVoices");
            if (data.actionType === "getVoices") {
                this.currentVoice = data.payload.currentVoice
                this.voicesArr = data.payload.voices.filter(item => item.isEnabled || item.enabled)
                for (let key in this.context_pool) {
                    $SD.setSettings(key, {
                        voiceStatus,
                        voicesArr: this.voicesArr,
                        active: this.context_pool[key].active || '' // 如果没有则为空
                    })
                    voiceSend("getBitmap", { "voiceID": this.context_pool[key].active }, key)
                }
            }
            /* 获取图标并更改持久化数据 防止与模因冲突 需要有语音ID才切换 */
            if (data.actionType === "getBitmap" && data.actionObject.voiceID) {
                console.log("进来了");

                /* 如果对应软件的音频则亮起否则默认 */
                let base64 = data.actionObject.voiceID === this.currentVoice ?
                    data.actionObject.result.selected :
                    data.actionObject.result.transparent;
                /* 如果在当前可用里未找到选择项则代表已经过期 则恢复默认图片 */
                if (this.voicesArr.some(item => item.id === this.context_pool[data.actionID].active)) {
                    console.log("设置图片");

                    $SD.setImage(data.actionID, "data:image/png;base64," + base64)
                } else {
                    $SD.setImage(data.actionID, "../static/img/key-select-voice.png,")
                }
            }
            /* 声音加载完成事件 */
            if (data.actionType === "voiceLoadedEvent") {
                if (data.actionObject) {
                    this.currentVoice = data.actionObject.voiceID
                    for (let key in this.context_pool) {
                        /* 如果插件数据内有图标则都调整为亮起状态 */
                        if (this.context_pool[key].active === this.currentVoice) {
                            voiceSend("getBitmap", { "voiceID": this.currentVoice }, key)
                        }
                        /* 否则查询当前图标 */
                        else {
                            voiceSend("getBitmap", { "voiceID": this.context_pool[key].active }, key)
                        }
                    }
                }
            }
        },
        /* 用户更改选中 没选择则恢复默认背景图 */
        didReceiveSettings(data) {
            let active = data.payload.settings.active
            console.log(data);

            if (active) {
                this.context_pool[data.context].active = active
                voiceSend("getBitmap", { voiceID: active }, data.context)
            } else {
                $SD.setImage(data.context, "../static/img/key-select-voice.png")
            }
        },
        keyUp(data) {
            voiceSend("loadVoice", { "voiceID": data.payload.settings.active });
        },
        willAppear(data) {
            /* 没有数据才创建 将保存的数据还原*/
            if (!this.context_pool[data.context]) this.context_pool[data.context] = {}
            if (data.payload.settings.active) this.context_pool[data.context] = data.payload.settings;
            /* 如果状态为失败则重新连接否则回显数据 */
            if (!voiceSocket || voiceSocket.readyState === 3) connect();
            if (voiceSocket.readyState === 1) voiceSend("getVoices");
        }
    },
    /* 随机语音 */
    [actionArr[1]]: {
        context_pool: {},
        voicesArr: [],
        /* 切换背景顺便通知当前连接状态 */
        checkoutBg() {
            let src = "../static/img/key-random-voice-idle.png"
            if (voiceStatus) src = "../static/img/key-random-voice-idle-1.png"
            for (let key in this.context_pool) {
                $SD.setImage(key, src);
                $SD.setSettings(key, { voiceStatus });
            }
        },
        onmessage(data) {
            if (data.action === "registerClient") this.checkoutBg();
            if (data.actionType === "getVoices") {
                this.currentVoice = data.payload.currentVoice
                this.voicesArr = data.payload.voices.filter(item => item.isEnabled || item.enabled)
            }
        },
        willAppear(data) {
            if (!this.context_pool[data.context]) this.context_pool[data.context] = {}
            if (!voiceSocket || voiceSocket.readyState === 3) connect()
            if (voiceSocket.readyState === 1) this.checkoutBg();
            voiceSend("getVoices");
        },
        keyUp() {
            // voiceSend("selectRandomVoice")
            let id = this.voicesArr[Math.floor(Math.random() * this.voicesArr.length)].id
            voiceSend("loadVoice", { "voiceID": id });
        },
        sendToPlugin(data) {
            if (data.payload.type === "change") {
                let id = this.voicesArr[Math.floor(Math.random() * this.voicesArr.length)].id
                voiceSend("loadVoice", { "voiceID": id });
            }
        }
    },
    /* 语音转换器开/关 */
    [actionArr[2]]: {
        context_pool: {},
        checkoutBg(status) {
            let src = "../static/img/key-voice-changer-off.png"
            if (status) src = "../static/img/key-voice-changer-on.png"
            for (let key in this.context_pool) {
                $SD.setImage(key, src);
                $SD.setSettings(key, { voiceStatus })
            }
        },
        onmessage(data) {
            if (data.action === "registerClient") voiceSend("getVoiceChangerStatus");
            if (data.actionType === "toggleVoiceChanger") this.checkoutBg(data.actionObject.value);
            if (data.actionType === "voiceChangerDisabledEvent") this.checkoutBg(false);
            if (data.actionType === "voiceChangerEnabledEvent") this.checkoutBg(true);
        },
        willAppear(data) {
            if (!this.context_pool[data.context]) this.context_pool[data.context] = {}
            if (!voiceSocket || voiceSocket.readyState === 3) connect()
            if (voiceSocket.readyState === 1) voiceSend("getVoiceChangerStatus");
        },
        keyUp() {
            voiceSend("toggleVoiceChanger")
        },
        sendToPlugin(data) {
            if (data.payload.type === "change") voiceSend("toggleVoiceChanger");
        }
    },
    /* 听见自己的声音开/关 */
    [actionArr[3]]: {
        context_pool: {},
        checkoutBg(status) {
            let src = "../static/img/key-hear-my-voice-off.png"
            if (status) src = "../static/img/key-hear-my-voice-on.png"
            for (let key in this.context_pool) {
                $SD.setImage(key, src);
                $SD.setSettings(key, { voiceStatus });
            }
        },
        onmessage(data) {
            if (data.action === "registerClient") voiceSend("getHearMyselfStatus");
            /* 监听语音转换器当前状态 */
            if (data.actionType === "toggleHearMyVoice") this.checkoutBg(data.actionObject.value);
            if (data.actionType === "hearMySelfDisabledEvent") this.checkoutBg(false);
            if (data.actionType === "hearMySelfEnabledEvent") this.checkoutBg(true);
        },
        willAppear(data) {
            if (!this.context_pool[data.context]) this.context_pool[data.context] = {}
            if (!voiceSocket || voiceSocket.readyState === 3) connect()
            if (voiceSocket.readyState === 1) voiceSend("getHearMyselfStatus");
        },
        keyUp() {
            voiceSend("toggleHearMyVoice")
        },
        sendToPlugin(data) {
            if (data.payload.type === "change") voiceSend("toggleHearMyVoice");
        }
    },
    /* 背景效果/关 */
    [actionArr[4]]: {
        context_pool: {},
        checkoutBg(status) {
            let src = "../static/img/key-ambient-sound-off.png"
            if (status) src = "../static/img/key-ambient-sound-on.png"
            for (let key in this.context_pool) {
                $SD.setImage(key, src);
                $SD.setSettings(key, { voiceStatus });
            }
        },
        onmessage(data) {
            if (data.action === "registerClient") voiceSend("getBackgroundEffectStatus");
            /* 监听声源加载完毕事件 再次查询是否开启背景音效 防止禁用后状态未更改 */
            if (data.actionType === "voiceLoadedEvent") {
                data.actionObject && voiceSend("getBackgroundEffectStatus");
            }
            if (data.actionType === "toggleBackground") this.checkoutBg(data.actionObject.value);
            if (data.actionType === "backgroundEffectsDisabledEvent") this.checkoutBg(false);
            if (data.actionType === "backgroundEffectsEnabledEvent") this.checkoutBg(true);
        },
        willAppear(data) {
            if (!this.context_pool[data.context]) this.context_pool[data.context] = {}
            if (!voiceSocket || voiceSocket.readyState === 3) connect()
            if (voiceSocket.readyState === 1) voiceSend("getBackgroundEffectStatus");
        },
        keyUp() {
            voiceSend("toggleBackground")
        },
        sendToPlugin(data) {
            if (data.payload.type === "change") voiceSend("toggleBackground");
        }
    },
    /* 静音开/关 */
    [actionArr[5]]: {
        context_pool: {},
        checkoutBg(status) {
            let src = "../static/img/key-mute-sounds-off.png"
            if (status) src = "../static/img/key-mute-sounds-on.png"
            for (let key in this.context_pool) {
                $SD.setImage(key, src);
                $SD.setSettings(key, { voiceStatus });
            }
        },
        onmessage(data) {
            if (data.action === "registerClient") voiceSend("getMuteMicStatus");
            if (data.actionType === "toggleMuteMic") this.checkoutBg(data.actionObject.value);
            if (data.actionType === "muteMicrophoneDisabledEvent") this.checkoutBg(false);
            if (data.actionType === "muteMicrophoneEnabledEvent") this.checkoutBg(true);
        },
        willAppear(data) {
            if (!this.context_pool[data.context]) this.context_pool[data.context] = {}
            if (!voiceSocket || voiceSocket.readyState === 3) connect()
            if (voiceSocket.readyState === 1) voiceSend("getMuteMicStatus");
        },
        keyUp() {
            voiceSend("toggleMuteMic")
        },
        sendToPlugin(data) {
            if (data.payload.type === "change") voiceSend("toggleMuteMic");
        }
    },
    /* 即时检查哔哔声 */
    [actionArr[6]]: {
        status: 0,
        context_pool: {},
        willAppear(data) {
            if (!this.context_pool[data.context]) this.context_pool[data.context] = {}
            if (!voiceSocket || voiceSocket.readyState === 3) connect()
            if (voiceSocket.readyState === 1) {
                for (let key in this.context_pool) {
                    $SD.setSettings(key, { voiceStatus });
                }
            }
        },
        onmessage(data) {
            if (data.action === "registerClient") {
                for (let key in this.context_pool) $SD.setSettings(key, { voiceStatus });
            }
        },
        keyUp() {
            this.status = !this.status
            voiceSend("setBeepSound", { badLanguage: this.status })
        }
    },
    /* 推送到语音转换器 */
    [actionArr[7]]: {
        isKeyDown: null,
        context_pool: {},
        willAppear(data) {
            if (!this.context_pool[data.context]) this.context_pool[data.context] = {}
            if (!voiceSocket || voiceSocket.readyState === 3) connect()
            if (voiceSocket.readyState === 1) {
                for (let key in this.context_pool) {
                    $SD.setSettings(key, { voiceStatus, longpress: true })
                }
            }
        },
        onmessage(data) {
            if (data.action === "registerClient") {
                for (let key in this.context_pool) {
                    $SD.setSettings(key, { voiceStatus, longpress: true })
                }
            }
            if (data.actionType === "toggleVoiceChanger") {
                /* 是按下并且当前的开关是关闭的才切换，后续同理 */
                if ((this.isKeyDown && !data.actionObject.value) ||
                    (this.isKeyDown === false && data.actionObject.value)) {
                    voiceSend("toggleVoiceChanger")
                }
            }
        },
        keyDown() {
            this.isKeyDown = true
            voiceSend("getVoiceChangerStatus")
        },
        keyUp() {
            this.isKeyDown = false
            voiceSend("getVoiceChangerStatus")
        }
    },
    /* *** MIGLIORATO: 音板播放 con Cache Persistente *** */
 /* *** AGGIORNATO: 音板播放 con Cache Persistente e gestione messaggi *** */
    [actionArr[8]]: {
        usableBoards: [],
        context_pool: {},
        
        // *** NUOVO: Carica soundboard dalla cache quando offline ***
        loadFromCache() {
            console.log("Voicemod offline - Caricando soundboard dalla cache...");
            
            for (let context in this.context_pool) {
                const cachedBoards = CacheManager.loadCachedSoundboards(context);
                if (cachedBoards.length > 0) {
                    console.log(`Cache trovata per ${context}: ${cachedBoards.length} soundboard`);
                    
                    $SD.setSettings(context, {
                        voiceStatus: false, // Offline
                        usableBoards: cachedBoards,
                        active: this.context_pool[context].active || '',
                        usingCache: true // Flag per indicare uso cache
                    });
                    
                    // Mostra immagine predefinita se non abbiamo le bitmap
                    if (this.context_pool[context].active) {
                        $SD.setImage(context, "../static/img/key-new-sound.png");
                    }
                } else {
                    console.log(`Nessuna cache trovata per ${context}`);
                    $SD.setSettings(context, {
                        voiceStatus: false,
                        usableBoards: [],
                        active: this.context_pool[context].active || '',
                        usingCache: false
                    });
                }
            }
        },
        
        // *** NUOVO: Gestione messaggi dal Property Inspector ***
        sendToPlugin(data) {
            console.log('Messaggio ricevuto dal Property Inspector:', data.payload);
            
            switch(data.payload.type) {
                case 'getSoundboards':
                    // Richiedi soundboard se online, altrimenti carica dalla cache
                    if (voiceSocket && voiceSocket.readyState === 1 && voiceStatus) {
                        console.log('Richiedendo soundboard live...');
                        voiceSend("getAllSoundboard");
                    } else {
                        console.log('Voicemod offline, caricando dalla cache...');
                        const cachedBoards = CacheManager.loadCachedSoundboards(data.context);
                        if (cachedBoards.length > 0) {
                            $SD.setSettings(data.context, {
                                voiceStatus: false,
                                usableBoards: cachedBoards,
                                active: this.context_pool[data.context]?.active || '',
                                usingCache: true
                            });
                        } else {
                            // Tenta di riconnettersi
                            connect();
                        }
                    }
                    break;
                    
                case 'refreshSoundboards':
                    console.log('Ricaricamento soundboard richiesto...');
                    if (voiceSocket && voiceSocket.readyState === 1) {
                        voiceSend("getAllSoundboard");
                    } else {
                        console.log('Tentativo di riconnessione...');
                        connect();
                        // Dopo la connessione, le soundboard verranno ricaricate automaticamente
                    }
                    
                    // Notifica al Property Inspector che il refresh è completato
                    setTimeout(() => {
                        $SD.sendToPropertyInspector(data.action, data.context, {
                            event: 'refreshComplete'
                        });
                    }, 2000);
                    break;
                    
                case 'clearCache':
                    console.log('Pulizia cache richiesta...');
                    // Rimuovi la cache da tutte le istanze
                    for (let ctx in this.context_pool) {
                        $SD.setSettings(ctx, {
                            ...this.context_pool[ctx],
                            cachedSoundboards: null,
                            usableBoards: [],
                            usingCache: false
                        });
                    }
                    
                    // Reset dei dati locali
                    this.usableBoards = [];
                    break;
            }
        },
        
        willAppear(data) {
            console.log('willAppear chiamato per soundboard');
            /* 恢复默认数据 */
            if (!this.context_pool[data.context]) this.context_pool[data.context] = {}
            
            // Carica tutte le impostazioni, inclusa la cache
            if (data.payload.settings) {
                this.context_pool[data.context] = { ...data.payload.settings };
            }
            
            /* 判断连接状态 */
            if (!voiceSocket || voiceSocket.readyState === 3) {
                console.log('WebSocket non connesso, tentativo di connessione...');
                // Se offline, carica dalla cache
                const cachedBoards = CacheManager.loadCachedSoundboards(data.context);
                if (cachedBoards.length > 0) {
                    console.log("Caricando dalla cache durante willAppear...");
                    $SD.setSettings(data.context, {
                        voiceStatus: false,
                        usableBoards: cachedBoards,
                        active: this.context_pool[data.context].active || '',
                        usingCache: true
                    });
                } else {
                    console.log('Nessuna cache disponibile, impostazioni vuote');
                    $SD.setSettings(data.context, {
                        voiceStatus: false,
                        usableBoards: [],
                        active: '',
                        usingCache: false
                    });
                }
                connect();
            } else if (voiceSocket.readyState === 1) {
                console.log('WebSocket connesso, richiedendo soundboard...');
                voiceSend("getAllSoundboard");
            }
        },
        
        didReceiveSettings(data) {
            console.log('didReceiveSettings per soundboard:', data.payload.settings);
            // Aggiorna il context_pool con tutte le impostazioni
            this.context_pool[data.context] = { ...data.payload.settings };
            
            if (data.payload.settings.active) {
                // Se online, richiedi bitmap
                if (voiceStatus && voiceSocket && voiceSocket.readyState === 1) {
                    console.log('Richiedendo bitmap per:', data.payload.settings.active);
                    voiceSend("getBitmap", {
                        "memeId": data.payload.settings.active
                    }, data.context);
                } else {
                    // Se offline, usa immagine predefinita
                    console.log('Offline, usando immagine predefinita');
                    $SD.setImage(data.context, "../static/img/key-new-sound.png");
                }
            } else {
                $SD.setImage(data.context, "../static/img/key-new-sound.png");
            }
        },
        
        onmessage(data) {
            /* 获取并过滤好可用的音板发送给检查器 */
            if (data.action === "registerClient") {
                console.log('Client registrato, richiedendo soundboard...');
                voiceSend("getAllSoundboard");
            }
            
            if (data.actionType === "getAllSoundboard") {
                console.log('Soundboard ricevute:', data.actionObject.soundboards.length);
                this.usableBoards = data.actionObject.soundboards.filter(item => item.enabled);
                
                // *** NUOVO: Salva nella cache ***
                console.log(`Salvando ${this.usableBoards.length} soundboard nella cache...`);
                CacheManager.saveSoundboards(this.usableBoards);
                
                for (let key in this.context_pool) {
                    console.log(`Aggiornando impostazioni per context: ${key}`);
                    $SD.setSettings(key, {
                        voiceStatus,
                        usableBoards: this.usableBoards,
                        active: this.context_pool[key].active || '',
                        usingCache: false // Non stiamo usando la cache
                    });
                    
                    // Richiedi bitmap se c'è una selezione attiva
                    if (this.context_pool[key].active) {
                        console.log('Richiedendo bitmap per selezione attiva:', this.context_pool[key].active);
                        voiceSend("getBitmap", {
                            "memeId": this.context_pool[key].active
                        }, key);
                    }
                }
            }
            
            /* 获取图标 需要有模因id才切换 */
            if (data.actionType === "getBitmap" && data.actionObject.memeId) {
                console.log('Bitmap ricevuta per:', data.actionObject.memeId);
                let img = data.actionObject.result.default
                if (img) {
                    $SD.setImage(data.actionID, "data:image/png;base64," + img)
                } else {
                    console.log('Nessuna immagine disponibile, usando placeholder');
                    $SD.setImage(data.actionID, "../static/img/noting.png")
                }
            }
        },
        
        keyUp(data) {
            // Funziona solo se online o se abbiamo una selezione valida
            if (voiceStatus && this.context_pool[data.context].active) {
                console.log('Riproducendo soundboard:', this.context_pool[data.context].active);
                voiceSend("playMeme", {
                    "FileName": this.context_pool[data.context].active,
                    "IsKeyDown": true
                });
            } else if (!voiceStatus) {
                console.log("Voicemod offline - impossibile riprodurre soundboard");
            } else {
                console.log("Nessuna soundboard selezionata");
            }
        }
    },
    
    /* 停止所有模因 */
    [actionArr[9]]: {
        context_pool: {},
        willAppear(data) {
            if (!this.context_pool[data.context]) this.context_pool[data.context] = {}
            if (!voiceSocket || voiceSocket.readyState === 3) connect()
            if (voiceSocket.readyState === 1) {
                for (let key in this.context_pool) {
                    $SD.setSettings(key, { voiceStatus });
                }
            }
        },
        onmessage(data) {
            if (data.action === "registerClient") {
                for (let key in this.context_pool) {
                    $SD.setSettings(key, { voiceStatus })
                }
            }
        },
        keyUp() {
            voiceSend("stopAllMemeSounds")
        }
    },
    /* 为我静音开/关 */
    [actionArr[10]]: {
        context_pool: {},
        checkoutBg(status) {
            let src = "../static/img/key-mute-for-me-idle.png"
            if (status) src = "../static/img/key-mute-for-me-on.png"
            for (let key in this.context_pool) {
                $SD.setImage(key, src);
                $SD.setSettings(key, { voiceStatus });
            }
        },
        onmessage(data) {
            if (data.action === "registerClient") voiceSend("getMuteMemeForMeStatus");
            if (data.actionType === "toggleMuteForMeMeme") this.checkoutBg(data.actionObject.value);
            if (data.actionType === "muteMemeForMeDisabledEvent") this.checkoutBg(false);
            if (data.actionType === "muteMemeForMeEnabledEvent") this.checkoutBg(true);
        },
        willAppear(data) {
            if (!this.context_pool[data.context]) this.context_pool[data.context] = {}
            if (!voiceSocket || voiceSocket.readyState === 3) connect()
            if (voiceSocket.readyState === 1) voiceSend("getMuteMemeForMeStatus");
        },
        keyUp() {
            voiceSend("toggleMuteMemeForMe")
        },
        sendToPlugin(data) {
            if (data.payload.type === "change") voiceSend("toggleMuteMemeForMe");
        }
    }
}

/* 注册插件 */
async function connectElgatoStreamDeckSocket(inPort, inPluginUUID, inRegisterEvent, inInfo) {

    /* 获取国际化字符串 */
    // let localizedStrings = await $.localizedStrings(JSON.parse(inInfo).application.language)
    websocket = new WebSocket("ws://127.0.0.1:" + inPort);
    websocket.onopen = function () {
        websocket.send(JSON.stringify({
            "event": inRegisterEvent,
            "uuid": inPluginUUID
        }))
    }
    /* 模块化监听 */
    websocket.onmessage = function (e) {
        let data = JSON.parse(e.data), { event, action } = data;
        $data[action]?.[event]?.(data)
    }
}