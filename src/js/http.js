(function ($) {

	$.httpSend = function (param) {
		var option = {
			url: "",
			type: "get",
			dataType: "json",
			cache: false,
			timeout: 15000,
			success: null,
			error: null
		}
		option = $.extend(option, param);
		if (!option.success) {
			option.success = function (data) { };
		}
		if (!option.error) {
			option.error = function (e) { };
		}

		if ($.aop && !option.skiperror) {
			$.aop.before({ target: option, method: 'error' }, errorHandler);
		}

		$.ajax(option);
	};

	$.httpSendForm = function (param) {
		var id = param.formId;
		if (!id) {
			M.toast({ html: '请求失败', text: '缺少表单id' });
			return false;
		}
		if (id.indexOf("#") != 0) {
			id = "#" + id;
		}
		var option = {
			type: "POST",
			dataType: "json",
			contentType: "multipart/form-data",
			cache: false,
			timeout: 10000,
			skiperror: false,
			beforeSubmit: function () {
				return true;
			},
			success: null,
			error: null,
			resetSession: true
		}
		option = $.extend(option, param);
		if (!option.success) {
			option.success = function (data) { };
		}
		if (!option.error) {
			option.error = function (e) { };
		}

		if ($.aop && !option.skiperror) {
			$.aop.before({ target: option, method: 'error' }, errorHandler);
		}

		$(id).ajaxSubmit(option);
		return true;
	}

	var errorHandler = function (e) {
		$("#active-status-offline").removeClass("hide");
		$("#active-status-online").addClass("hide");
		$("#active-face-type").html("sentiment_very_dissatisfied");
		$("#active-face-type").css("color", "red");
	}

	$.getUrlParam = function (name) {
		var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
		var r = window.location.search.substr(1).match(reg);
		if (r != null) return unescape(r[2]); return null;
	}

})(jQuery);