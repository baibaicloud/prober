var authObj = {
    init: function () {
        $("#login-panel").removeClass("hide");
        authObj.login(function (resp) {
            $("#login-panel").addClass("hide");
            $("#active-panel").removeClass("hide");
            $("#active-status-offline").addClass("hide");
            $("#active-status-online").removeClass("hide");
            pullMsgObj.pullmsg();
            authObj.authSuccess();
        });
    },
    authSuccess: function () {
        settingsObj.updateDeviceInfo();
        tunnelObj.loadProxy();
    },
    /**
     * 重新登录
     */
    relogin: function () {

        $("#active-status-offline").removeClass("hide");
        $("#active-status-online").addClass("hide");
        $("#active-face-type").html("sentiment_very_dissatisfied");
        $("#active-face-type").css("color", "red");

        var url = window.appinfo.rooturl + 'capi/client/login';
        console.log('reload url:' + url);
        $.httpSend({
            url,
            type: 'post',
            data: JSON.stringify({
                sn: window.appinfo.sn
            }),
            success: function (resp) {
                if (!resp.success) {
                    setTimeout(function () {
                        authObj.relogin();
                    }, 1000);
                    return;
                }
                window.appinfo.token = resp.content.token;
                window.appinfo.server_info = resp.content.server_info;

                pullMsgObj.pullmsg();
                $("#active-status-offline").addClass("hide");
                $("#active-status-online").removeClass("hide");
                authObj.authSuccess();
            },
            error: function () {
                setTimeout(function () {
                    authObj.relogin();
                }, 1000);
            }
        });
    },
    /**
     * 正常登录
     * @param {*} callback 
     */
    login: function (callback) {
        var url = window.appinfo.rooturl + 'capi/client/login';
        console.log('login url:' + url);
        $.httpSend({
            url,
            type: 'post',
            data: JSON.stringify({
                sn: window.appinfo.sn
            }),
            success: function (resp) {
                if (!resp.success) {
                    M.toast({ html: resp.message });
                    return;
                }
                window.appinfo.token = resp.content.token;
                window.appinfo.server_info = resp.content.server_info;
                callback();
            },
            error: function () {
                setTimeout(function () {
                    authObj.login(callback);
                }, 1000);
            }
        });
    }
}