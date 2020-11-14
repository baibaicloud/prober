
var remoteObj = {
    getremoteing: false,
    curData: null,
    /**
     * 开始远程
     * @param {*} data 
     */
    start: function (data) {

        if (process.platform === 'win32') {
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
                                remoteObj.curData = data;
                                remoteObj.showRemoteUI(data.selfname);
                                remoteObj.remoteAckReady(data.ackuuid);
                            });
                        });
                    });
                });
            });
        }

        if (process.platform == "linux") {
            window.appruntime.stopLib("linux-loonfrpc", () => {
                window.appruntime.stopLib("x0vncserver", () => {
                    const nowlist = new Array(0);
                    nowlist.push('rm -rf ~/.vnc/');
                    nowlist.push(window.appinfo.apppath + '/lib/usr/bin/vncpasswd << EOF');
                    nowlist.push(data.password);
                    nowlist.push(data.password);
                    nowlist.push('y');
                    nowlist.push(data.password);
                    nowlist.push(data.password);
                    nowlist.push('EOF');
                    nowlist.push('echo "success"');
                    window.appruntime.resettigervncpw(nowlist, () => {

                        const env = {
                            FRP_PROXY_NAME: data.proxyName,
                            FRP_SERVER_ADDR: data.serverAddress,
                            FRP_SERVER_PORT: data.serverPort,
                            FRP_LOCALHOST_IP: window.appinfo.ip,
                            FRP_REMOTE_PORT: data.remotePort,
                            FRP_LOCAL_PORT: data.localPort,
                            FRP_PRITOKEN: window.appinfo.token,
                        };
                        // 这里启动要分win和linux
                        window.appruntime.startfrp(env, () => {
                            window.appruntime.startlinuxvnc(() => {
                                remoteObj.curData = data;
                                remoteObj.showRemoteUI(data.selfname);
                                remoteObj.remoteAckReady(data.ackuuid);
                            });
                        });
                    });
                });
            });
        }
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
        remoteObj.curData = null;
        $("#active-remote-panel").addClass("hide");

        if (process.platform === 'win32') {
            window.appruntime.stopLib("loonfrpc", () => { });
            window.appruntime.stopLib("loonvnc", () => { });
        }

        if (process.platform === 'linux') {
            window.appruntime.stopLib("linux-loonfrpc", () => { });
            window.appruntime.stopLib("x0vncserver", () => { });
        }
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
                    remoteObj.close();
                    return;
                }

                setTimeout(function () {
                    remoteObj.getDeviceStatus();
                }, 3000);
            }
        });
    }
}