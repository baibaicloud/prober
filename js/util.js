(function ($) {

	$.makeuuid = function () {
		return Math.floor(Math.random() * 100000) + "";
	};

})(jQuery);