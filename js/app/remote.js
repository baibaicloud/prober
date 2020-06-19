
var remoteObj = {
    getremoteing: false,

    /**
     * 开始远程
     * @param {*} data 
     */
    start: function (data) {

        window.appruntime.stopLib("loonfrpc", () => {
            window.appruntime.stopLib("loonvnc", () => {
                window.appruntime.resetpw(data.password, () => {

                    const env = {
                        FRP_PROXY_NAME: data.proxyName,
                        FRP_SERVER_ADDR: data.serverAddress,
                        FRP_SERVER_PORT: data.serverPort,
                        FRP_LOCALHOST_IP: window.appinfo.ip,
                        FRP_REMOTE_PORT: data.remotePort,
                        FRP_LOCAL_PORT: data.localPort,
                        FRP_PRITOKEN: window.appinfo.token,
                    };

                    window.appruntime.startfrp(env, () => {
                        window.appruntime.startvnc(() => {
                            remoteObj.showRemoteUI(data.selfname);
                            remoteObj.remoteAckReady(data.ackuuid);
                        });
                    });
                });
            });
        });
    },

    /**
     * 本地远程准备好
     * 
     * @param {*} data 
     */
    remoteAckReady: function (ackuuid) {
        setTimeout(function () {
            $.httpSend({
                url: window.appinfo.rooturl + 'capi/client/commons',
                type: 'post',
                data: JSON.stringify({
                    token: window.appinfo.token,
                    sn: window.appinfo.sn,
                    event: 'remote_ready_ack',
                    ackuuid
                })
            });
        }, 1000);
    },

    /**
     * 关闭远程
     */
    close: function () {
        $("#active-remote-panel").addClass("hide");
        window.appruntime.stopLib("loonfrpc", () => { });
        window.appruntime.stopLib("loonvnc", () => { });
    },

    /**
     * 
     */
    showRemoteUI: function (selfname) {
        $("#active-remote-ing-name").html(selfname);
        $("#active-remote-panel").removeClass("hide");
        remoteObj.startGetDeviceStatus();
    },

    /**
     * 持续获取远程状态
     */
    startGetDeviceStatus: function () {
        if (remoteObj.getremoteing) {
            return;
        }
        remoteObj.getremoteing = true;
        remoteObj.getDeviceStatus();
    },
    getDeviceStatus: function () {
        $.httpSend({
            url: window.appinfo.rooturl + 'capi/client/commons',
            type: 'post',
            data: JSON.stringify({
                token: window.appinfo.token,
                sn: window.appinfo.sn,
                event: 'get_remote_status'
            }),
            success: function (resp) {
                if (resp.content == null) {
                    remoteObj.getremoteing = false;
                    $("#active-remote-panel").addClass("hide");
                    return;
                }

                setTimeout(function () {
                    remoteObj.getDeviceStatus();
                }, 3000);
            }
        });
    }
}