
var mainObj = {
    authkeydownsec: 0,
    authkeyinfo: null,
    authackInfo: null,
    lastAuthkeyStartTimeoutId: 0,
    init: function () {
        M.AutoInit();
        $('#newaddauth-modal').modal({ dismissible: false });
        $("#tool-close-btn").click(mainObj.hideapp);
        $("#newaddauth-modal-btn").click(mainObj.newaddauth);
    },
    authackok: function () {
        $.httpSend({
            url: window.appinfo.rooturl + 'capi/client/commons',
            type: 'post',
            data: JSON.stringify({
                token: window.appinfo.token,
                sn: window.appinfo.sn,
                event: 'bind_ack_key',
                uuid: mainObj.authackInfo.uuid,
                priuuid: mainObj.authackInfo.priuuid,
                targetId: mainObj.authackInfo.targetId
            }),
            success: function (resp) {
                $('#newaddauth-ack-modal').modal('close');
                $('#newaddauth-modal').modal('close');
                mainObj.authackInfo = null;
                if (!resp.success) {
                    M.toast({ html: resp.message });
                    return;
                }
                M.toast({ html: '授权成功' });
            }
        });
    },
    /**
     * 添加网元二次确认
     * 
     * @param {*} autinfo 
     */
    authkeyAck: function (authInfo) {
        if (mainObj.authkeyinfo.uuid !== authInfo.uuid) {
            return;
        }

        if (mainObj.authkeyinfo.code !== authInfo.code) {
            return;
        }

        if (window.appinfo.sn !== authInfo.sn) {
            return;
        }

        mainObj.authackInfo = authInfo;
        $("#newaddauth-ack-modal-selfname").html(authInfo.targetName);
        $('#newaddauth-ack-modal').modal('open');
    },
    /**
     * 复制授权码
     */
    copyauthstr: function () {
        window.appruntime.copystr(mainObj.authkeyinfo.uuid);
    },
    /**
     * 授权码超时处理
     */
    authkeyStartTimeout: function () {

        $("#newaddauth-modal-timeout").html("(" + mainObj.authkeydownsec + ")");
        if (mainObj.authkeydownsec <= 0) {
            $('#newaddauth-modal').modal('close');
            return;
        }

        mainObj.lastAuthkeyStartTimeoutId = setTimeout(function () {
            mainObj.authkeydownsec--;
            mainObj.authkeyStartTimeout();
        }, 1000);
    },
    /**
     * 获取授权码
     */
    newaddauth: function () {
        clearTimeout(mainObj.lastAuthkeyStartTimeoutId);
        $("#newaddauth-modal-timeout").html("");
        $("#newaddauth-modal-key").html("授权码获取中，请稍等");
        $.httpSend({
            url: window.appinfo.rooturl + 'capi/client/commons',
            type: 'post',
            data: JSON.stringify({
                token: window.appinfo.token,
                sn: window.appinfo.sn,
                event: 'bind_get_key'
            }),
            success: function (resp) {
                if (!resp.success) {
                    M.toast({ html: resp.message });
                    return;
                }
                mainObj.authkeyinfo = resp.content;
                mainObj.authkeyinfo.code = $.makeuuid();
                $("#newaddauth-modal-key").html(resp.content.uuid);
                $("#newaddauth-modal-code").html(mainObj.authkeyinfo.code);
                mainObj.authkeydownsec = parseInt(resp.content.timeout);
                mainObj.authkeyStartTimeout();
            }
        });
    },
    hideapp: function () {
        window.appruntime.hideapp();
    }
}

$(function () {
    mainObj.init();
});