let uuid = '', action = '', context = '', isload = true;
/* 连接websoket $localizedStrings 国际化字符对象 */
$SD.on('connected', e => {
    uuid = e.uuid;
    action = e.actionInfo.action;
    context = e.actionInfo.context;
    localAll() // 国际化
})

/* 插件触发的事件 */
$SD.on('sendToPropertyInspector', e => {
    let { event } = e
    /* 插件设置数据后触发 */
    if (event === 'didReceiveSettings') {
        let { voiceStatus } = e.payload.settings
        /* 初始化属性检查器 */
        if (isload) {
            isload = false
            $SD.api.sendToPlugin(uuid, action, { type: "getStatus" })
        }
        $('.lineCenter').innerHTML = voiceStatus ?
            $localizedStrings['连接成功 - 正在运行'] :
            $localizedStrings['连接失败，正在尝试重连...']
    }
})

/* 触发事件 */
$('#mybutton').addEventListener('click', function () {
    $SD.api.sendToPlugin(uuid, action, { type: "change" })
})

// $SD.api.setSettings(payload.context, payload) // 保存设置
// $SD.api.sendToPlugin(uuid, action, {})