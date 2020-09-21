var tunnelObj = {
    isfast: true,
    isLoadProxy: false,
    admininfo: {
        admin_user: null,
        admin_pwd: null,
    },
    init: function () {
        tunnelObj.initfrp();
        tunnelObj.checkfrp();
    },
    loadProxy: function (isnow) {
        console.log('loadProxy1');
        if (isnow) {
            tunnelObj.loadProxyHandler();
            return;
        }
        console.log('loadProxy2');
        tunnelObj.isLoadProxy = true;
    },
    loadProxyHandler: function () {
        console.log('loadProxyHandler');
        $.httpSend({
            url: window.appinfo.rooturl + 'capi/client/commons',
            type: 'post',
            data: JSON.stringify({
                token: window.appinfo.token,
                sn: window.appinfo.sn,
                event: 'get_tunnel_list',
            }),
            success: function (resp) {
                tunnelObj.handlerTunnel(resp.content);
            }
        });
    },

    handlerTunnel: function (list) {
        const nowlist = new Array(0);
        nowlist.push('[common]');
        nowlist.push('server_addr = ' + window.appinfo.server_info.frp_tunnel_server_address);
        nowlist.push('server_port = ' + window.appinfo.server_info.frp_tunnel_server_port);
        nowlist.push('pritoken = ' + window.appinfo.token);
        nowlist.push('admin_addr = ' + window.appinfo.frp_admin_addr);
        nowlist.push('admin_port = ' + window.appinfo.frp_admin_port);
        nowlist.push('admin_user = ' + tunnelObj.admininfo.admin_user);
        nowlist.push('admin_pwd = ' + tunnelObj.admininfo.admin_pwd);
        console.log('admin_pwd', tunnelObj.admininfo.admin_user, tunnelObj.admininfo.admin_pwd);
        for (const index in list) {
            const item = list[index];
            nowlist.push('');
            nowlist.push('[' + item.id + ']');
            nowlist.push('type = ' + item.tunnetType.toLowerCase());
            nowlist.push('local_ip = ' + item.localIp);
            nowlist.push('local_port = ' + item.localPort);
            nowlist.push('remote_port = ' + item.remotePort);
            nowlist.push('');
        }

        let frpcname = 'loontunnelfrpc';
        if (process.platform == "linux") {
            frpcname = 'linux-loontunnelfrpc';
        }

        window.appruntime.proxy(frpcname, nowlist, true);
        console.log('proxy success');
    },
    checkfrp: function () {
        setTimeout(() => {
            tunnelObj.checkfrp();
            tunnelObj.portuse().then((flag) => {
                if (flag) {
                    if (tunnelObj.isfast) {
                        tunnelObj.isfast = false;
                        tunnelObj.loadProxyHandler();
                        return;
                    }

                    if (tunnelObj.isLoadProxy) {
                        console.log('tunnelObj.isLoadProxy');
                        tunnelObj.isLoadProxy = false;
                        tunnelObj.loadProxyHandler();
                    }
                    return;
                }

                tunnelObj.initfrp();
            });
        }, 5000);
    },
    initfrp: function () {
        console.log('init frp');
        tunnelObj.isfast = true;
        if (!window.appinfo.server_info) {
            console.log('server_info is null so skip initfrp');
            return;
        }

        console.log('tunnel url:', window.appinfo.server_info);

        let frpcname = 'loontunnelfrpc';
        if (process.platform == "linux") {
            frpcname = 'linux-loontunnelfrpc';
        }

        window.appruntime.stopLib(frpcname, () => {
            const nowlist = new Array(8);
            nowlist.push('[common]');
            nowlist.push('server_addr = ' + window.appinfo.server_info.frp_tunnel_server_address);
            nowlist.push('server_port = ' + window.appinfo.server_info.frp_tunnel_server_port);
            nowlist.push('pritoken = ' + window.appinfo.token);
            nowlist.push('admin_addr = ' + window.appinfo.frp_admin_addr);
            nowlist.push('admin_port = ' + window.appinfo.frp_admin_port);
            tunnelObj.admininfo.admin_user = $.makeuuid() + $.makeuuid();
            tunnelObj.admininfo.admin_pwd = $.makeuuid() + $.makeuuid();
            nowlist.push('admin_user = ' + tunnelObj.admininfo.admin_user);
            nowlist.push('admin_pwd = ' + tunnelObj.admininfo.admin_pwd);

            window.appruntime.proxy(frpcname, nowlist, false);
        });
    },
    portuse: function (port) {
        var promise = new Promise((resolve, reject) => {
            try {
                const address = window.appinfo.frp_check_admin_address + window.appinfo.frp_admin_port;
                $.httpSend({
                    url: address,
                    type: 'get',
                    timeout: 2000,
                    skiperror: true,
                    success: function (resp) {
                        resolve(resp.status != 0);
                    },
                    error: function (resp) {
                        resolve(resp.status != 0);
                    }
                });
            } catch (error) {
                resolve(false);
            }
        });

        return promise;
    },
}