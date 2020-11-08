var pullMsgObj = {
    ing: false,
    pullmsg: function () {
        if (pullMsgObj.ing) {
            return;
        }
        pullMsgObj.ing = true;
        pullMsgObj.pull();
    },
    msgcallback: function (msg) {
        console.log(msg);
        statusObj.switchFaceUI();
        switch (msg.event) {
            case "ADD_NE_INVITE":
                mainObj.authkeyAck(msg.body);
                break;
            case 'SHUTDOWN':
                window.appruntime.showWindowShutdown(msg.body.seconds);
                break;
            case 'START_REMOTE_CONTROL':
                remoteObj.start(msg.body);
                break;
            case 'CLOSE_REMOTE_CONTROL':
                remoteObj.close();
                break;
            case 'TUNNEL_REFRESH_LIST':
                tunnelObj.loadProxy(true);
                break;
            case 'DOWNLOAD_FILE':
                filesObj.nowDownload(msg.body);
                break;
        }
    },
    pull: function () {
        statusObj.switchFaceUI();
        $.httpSend({
            url: window.appinfo.rooturl + 'capi/client/message/get',
            type: 'post',
            timeout: 10000,
            data: JSON.stringify({ token: window.appinfo.token }),
            success: function (resp) {
                if (resp.success) {
                    pullMsgObj.msgcallback(resp.content);
                } else if (resp.code === "1" || resp.code === "2") {
                    pullMsgObj.ing = false;
                    authObj.relogin();
                    return;
                }
                setTimeout(function () {
                    pullMsgObj.pull();
                }, 100);
            },
            error: function () {
                pullMsgObj.ing = false;
                authObj.relogin();
            }
        });
    }
}