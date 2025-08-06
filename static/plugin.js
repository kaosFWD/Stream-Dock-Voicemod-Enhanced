let websocket = null;
let DestinationEnum = Object.freeze({
    "HARDWARE_AND_SOFTWARE": 0, // 软硬件
    "HARDWARE_ONLY": 1, // 仅硬件
    "SOFTWARE_ONLY": 2 // 仅软件
})

/* 插件通信 */
const $SD = {
    /* 设置标题 */
    setTitle(context, title) {
        websocket.send(JSON.stringify({
            "event": "setTitle",
            "context": context,
            "payload": {
                "title": "" + title,
                "target": DestinationEnum.HARDWARE_AND_SOFTWARE
            }
        }))
    },
    /* 设置存储 */
    setSettings(context, payload) {
        websocket.send(JSON.stringify({
            "event": "setSettings",
            "context": context,
            "payload": payload
        }))
    },
    /* 打开网址 */
    openUrl(url) {
        websocket.send(JSON.stringify({
            "event": "openUrl",
            "payload": { url }
        }))
    },
    /* 发送给属性选择器 */
    sendToPropertyInspector(action, context, payload) {
        websocket.send(JSON.stringify({
            "event": "sendToPropertyInspector",
            "action": action,
            "context": context,
            "payload": payload
        }))
    },
    /* 设置背景图 */
    setImage(context, url) {
        let image = new Image();
        image.src = url;
        image.onload = function () {
            let canvas = document.createElement("canvas");
            canvas.width = this.naturalWidth;
            canvas.height = this.naturalHeight;
            let ctx = canvas.getContext("2d");
            ctx.drawImage(this, 0, 0);

            /* 发送请求 */
            websocket.send(JSON.stringify({
                "event": "setImage",
                "context": context,
                "payload": {
                    image: canvas.toDataURL("image/png") || "",
                    target: DestinationEnum.HARDWARE_AND_SOFTWARE
                }
            }))
        }
    }
}

/* 工具库 */
const $ = (num) => num < 10 ? '0' + num : num;
$.GET = (url, callback, type = 'json') => {
    /* 请求函数 最后可以指定html类型 */
    let xhr = new XMLHttpRequest()
    xhr.open("GET", url);
    xhr.send();
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            type === 'json' ?
                callback(JSON.parse(xhr.responseText)) : callback(xhr.responseText)
        }
    }
}
$.localizedStrings = (lang) => {
    /* 获取国际化字符串 */
    return new Promise((resolve) => {
        $.GET(`../${lang}.json`, (e) => {
            resolve(e.Localization)
        })
    })
}
$.split = (str, row) => {
    /* 限制字符长度显示 */
    let nowRow = 1, newStr = '', strArr = str.split('')
    strArr.forEach((item, index) => {
        if (nowRow < row && index > nowRow * 6) {
            nowRow++
            newStr += '\n'
        }
        if (nowRow <= row && index < nowRow * 6) {
            newStr += item
        }
    })
    newStr += '..'
    return newStr;
}