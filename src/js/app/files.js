var filesObj = {
    init: function () {
        $('#file-manager-panel-list').niceScroll({
            cursorcolor: "#ccc",//#CC0071 光标颜色
            cursoropacitymax: 1, //改变不透明度非常光标处于活动状态（scrollabar“可见”状态），范围从1到0
            touchbehavior: false, //使光标拖动滚动像在台式电脑触摸设备
            cursorwidth: "5px", //像素光标的宽度
            cursorborder: "0", // 游标边框css定义
            cursorborderradius: "5px",//以像素为光标边界半径
            autohidemode: false //是否隐藏滚动条
        });

        var content = $("#html");
        content.on("dragenter dragover", function (event) {
            event.preventDefault();
        });

        content.on("dragleave", function (event) {
            event.preventDefault();
        });

        content.on("drop", function (event) {
            event.preventDefault();
            if (!remoteObj.curData) {
                console.log('remoteObj.curData is null');
                return;
            }

            var file = event.originalEvent.dataTransfer.files[0];
            filesObj.uploadFile(file);
            return false;
        });
    },
    cleanFileList: function () {
        $("#file-manager-panel-list-empty").removeClass("hide");
        $("#file-manager-panel-list").find(".file-manager-panel-list-item").remove();
    },
    showUploadPanel: function () {
        $("#file-upload-manager-panel").removeClass("hide");
    },
    delUploadItem: function (id) {
        $("#file-upload-manager-panel-list-item-" + id).remove();
        var html = $("#file-upload-manager-panel-list").html();
        if (html == "") {
            $("#file-upload-manager-panel").addClass("hide");
        }
    },
    uploadFile: function (file) {
        var fileid = new Date().getTime();
        var formdata = new FormData();
        formdata.append('file', file);
        var url = window.appinfo.rooturl + "capi/file/upload?token=" + window.appinfo.token + "&uuid=" + remoteObj.curData.uuid;
        var html = $("#file-upload-manager-panel-list-template").html();
        html = html.replace("{name}", file.name);
        html = html.replace("{id}", fileid + "");
        $("#file-upload-manager-panel-list").append(html);

        filesObj.showUploadPanel();
        $.ajax({
            url,
            type: 'post',
            dataType: 'json',
            data: formdata,
            timeout: 9999999,
            processData: false,
            contentType: false,
            xhr: function () {
                var xhr = new XMLHttpRequest();
                xhr.upload.addEventListener('progress', function (e) {
                    var progressRate = (e.loaded / e.total) * 100;
                    var tempitem = $("#file-upload-manager-panel-list-item-" + fileid);
                    tempitem.find(".determinate").css("width", progressRate + "%");
                });
                return xhr;
            },
            success: function () {
                filesObj.delUploadItem(fileid);
            },
            error: function () {
                filesObj.delUploadItem(fileid);
            }
        })
    },
    converSize: function (limit) {
        var size = "";
        if (limit < 0.1 * 1024) { //如果小于0.1KB转化成B  
            size = limit.toFixed(2) + "B";
        } else if (limit < 0.1 * 1024 * 1024) {//如果小于0.1MB转化成KB  
            size = (limit / 1024).toFixed(2) + "KB";
        } else if (limit < 0.1 * 1024 * 1024 * 1024) { //如果小于0.1GB转化成MB  
            size = (limit / (1024 * 1024)).toFixed(2) + "MB";
        } else { //其他转化成GB  
            size = (limit / (1024 * 1024 * 1024)).toFixed(2) + "GB";
        }

        var sizestr = size + "";
        var len = sizestr.indexOf("\.");
        var dec = sizestr.substr(len + 1, 2);
        if (dec == "00") {//当小数点后为00时 去掉小数部分  
            return sizestr.substring(0, len) + sizestr.substr(len + 3, 2);
        }
        return sizestr;
    },
    openFolder: function () {
        window.appruntime.openurl(window.appinfo.userpath + "/files");
    },
    hidePanel: function () {
        $("#file-manager-panel").addClass("hide");
    },
    showPanel: function () {
        $("#file-manager-panel").removeClass("hide");
    },
    tryDownload: function (cur, id) {
        event.stopPropagation();
        var item = $("#file-manager-panel-list-item-" + id)
        item.find(".determinate").css("width", "0%");
        item.find(".progress").removeClass("hide");
        item.find(".btn-try").addClass("hide");
        const fileName = item.attr("fileName");
        const fileSize = item.attr("fileSize");
        filesObj.downloadHandler(id, fileName, fileSize);
        return false;
    },
    nowDownload: function ({ fileId, fileName, fileSize }) {
        filesObj.showPanel();
        const temptime = new Date().getTime();
        filesObj.download(fileId, temptime + "_" + fileName, fileSize);
    },
    download: function (id, filename, fileSize) {
        $("#file-manager-panel-list-empty").addClass("hide");
        var html = $("#file-manager-panel-list-item-template").html();
        html = html.replace("{id}", id);
        html = html.replace("{tryid}", id);
        html = html.replace("{name}", filename);
        $("#file-manager-panel-list").append(html);
        $("#file-manager-panel-list-item-" + id).find(".progress").removeClass("hide");
        $("#file-manager-panel-list-item-" + id).attr("fileName", filename);
        $("#file-manager-panel-list-item-" + id).attr("fileSize", fileSize);
        var div = document.getElementById('file-manager-panel-list');
        div.scrollTop = div.scrollHeight;
        filesObj.downloadHandler(id, filename, fileSize);
    },
    downloadHandler: function (id, fileName, fileSize) {
        console.log('download file', id, fileName, fileSize);
        let curSize = 0;
        var url = window.appinfo.rooturl + 'capi/file/download?fileId=' + id + "&token=" + window.appinfo.token + "&uuid=" + remoteObj.curData.uuid;
        const filePath = window.appinfo.userpath + "/files/";;
        window.appruntime.downloadFile(
            url,
            filePath,
            fileName,
            function (len) {
                curSize += len;
                var percentComplete = curSize / fileSize;
                var tempwidth = Math.round(percentComplete * 100);
                $("#file-manager-panel-list-item-" + id).find(".determinate").css("width", tempwidth + "%");
            },
            function () {
                $("#file-manager-panel-list-item-" + id).find(".progress").addClass("hide");
                $("#file-manager-panel-list-item-" + id).find(".btn-try").addClass("hide");
                filesObj.ackDownload(id);
            },
            function () {
                $("#file-manager-panel-list-item-" + id).find(".progress").addClass("hide");
                $("#file-manager-panel-list-item-" + id).find(".btn-try").removeClass("hide");
            }
        );
    },
    ackDownload: function (fileId) {
        $.httpSend({
            url: window.appinfo.rooturl + 'capi/client/commons',
            type: 'post',
            data: JSON.stringify({
                token: window.appinfo.token,
                sn: window.appinfo.sn,
                event: 'files_delete',
                fileId,
                uuid: remoteObj.curData.uuid,
            })
        });
    }
}

$(function () {
    filesObj.init();
});