
var settingsObj = {
    init: function () {
        $("#setting-github-url").click(function () {
            window.appruntime.openurl("https://github.com/baibaicloud/prober");
        });
    },
    closePanel: function () {
        $('.sidenav').sidenav('close');
    },
    showPanel: function () {
        $('#slide-out-tabs').tabs('select', 'sidenav-setting');
        $.httpSend({
            url: window.appinfo.rooturl + 'capi/client/commons',
            type: 'post',
            data: JSON.stringify({ token: window.appinfo.token, sn: window.appinfo.sn, event: 'get_settings' }),
            success: function (resp) {
                $("#setting-checkbox-autoremote").prop("checked", resp.content.autoRemote === 'YES');
                $("#setting-checkbox-autorun").prop("checked", resp.content.autoRun === 'YES');
            }
        });

        $("#setting-auth-server-list").html("加载中...");
        $.httpSend({
            url: window.appinfo.rooturl + 'capi/client/commons',
            type: 'post',
            data: JSON.stringify({ token: window.appinfo.token, sn: window.appinfo.sn, event: 'get_auth_bind_list' }),
            success: function (resp) {
                settingsObj.makeAuthServerList(resp.content);
            }
        });
    },
    makeAuthServerList: function (list) {
        if (list.length == 0) {
            $("#setting-auth-server-list").html("<h6>暂无</h6>");
            return;
        }

        $("#setting-auth-server-list").html("");
        $.each(list, function (index, item) {
            var html = $("#setting-auth-server-item-template").html();
            var fasttype = (item.type == "ENTERPRISE") ? "企业:" : "个人:";
            html = html.replace(new RegExp("{title}", "g"), fasttype + item.name);
            html = html.replace(new RegExp("{id}", "g"), item.id);
            html = html.replace(new RegExp("{type}", "g"), item.type);
            $("#setting-auth-server-list").append(html);
        });
    },
    unAuthBtn: function (cur) {
        var id = $(cur).attr("tid");
        $.httpSend({
            url: window.appinfo.rooturl + 'capi/client/commons',
            type: 'post',
            data: JSON.stringify({ targetId: id, token: window.appinfo.token, sn: window.appinfo.sn, event: 'unauth_bind' })
        });
    },
    onAutoRemote: function (cur) {
        settingsObj.update();
    },
    onAutoRun: function (cur) {
        settingsObj.update();
        window.appruntime.setAutorun($("#setting-checkbox-autorun").is(':checked'));
    },
    update: function () {
        $.httpSend({
            url: window.appinfo.rooturl + 'capi/client/commons',
            type: 'post',
            data: JSON.stringify({
                token: window.appinfo.token,
                sn: window.appinfo.sn,
                event: 'update_settings',
                autoRemote: $("#setting-checkbox-autoremote").is(':checked') ? 'YES' : 'NO',
                autoRun: $("#setting-checkbox-autorun").is(':checked') ? 'YES' : 'NO',
            })
        });
    },
    updateDeviceInfo: function (data) {
        $.httpSend({
            url: window.appinfo.rooturl + 'capi/client/info/update',
            type: 'post',
            data: JSON.stringify({
                token: window.appinfo.token,
                sn: window.appinfo.sn,
                name: window.appinfo.hostname
            })
        });
    }
}

$(function () {
    settingsObj.init();
});