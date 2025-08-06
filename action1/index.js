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
                type: 'getVoices'
            })
        }
        settings = e.payload.settings
        let { voiceStatus, voicesArr, active } = settings
        let html = `<option value="">${$localizedStrings['请选择音频']}</option>`
        voiceStatus && voicesArr.forEach(item => {
            html += `<option value="${item.id}">${item.friendlyName}</option>`
        })
        $('#myselect').innerHTML = html
        /* 寻找是否存在之前选择的选项 否则恢复默认选择 */
        $('#myselect').value = voicesArr?.some(item => item.id === active) ? active : ''
        $('.lineCenter').innerHTML = voiceStatus ?
            $localizedStrings['连接成功 - 正在运行'] :
            $localizedStrings['连接失败，正在尝试重连...']
    }
})

/* 切换声源 */
$('#myselect').addEventListener('change', function () {
    settings.active = this.value
    console.log(context, settings);
    
    $SD.api.setSettings(context, settings)
})

// $SD.api.setSettings(payload.context, payload) // 保存设置
// $SD.api.sendToPlugin(uuid, action, {})