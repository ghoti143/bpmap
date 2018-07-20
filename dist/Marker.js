function Marker(loc, opt, imgsrc) {

	var marker = L.marker(loc, opt);
	var isHovering = false;

	var handleMouseOut = function(event) {
		isHovering = false;
		setTimeout(() => {
			if(!isHovering) marker.closePopup();
		}, 500);
	};

	var handleMouseOver = function(event) {
        isHovering = true;
        if(!marker.isPopupOpen()) {
            marker.openPopup();
        }
	};

	var handlePopupOpen = function(event) {
        var $wrap = $(event.popup._wrapper);
        var $actual = $wrap.find('img.actual');
        var $loading = $wrap.find('img.loading');
		var errCnt = 0;
		
		$actual.on('load', (event) => {
            $loading.hide();
            $actual.css('background-color','inherit');
        });

        $actual.on('error', (event) => {
			$actual.attr('src', '/assets/broken_bike.png');
        })

		$wrap.hover(handleMouseOver, handleMouseOut);
	};

	marker.on('mouseout', handleMouseOut);
	marker.on('mouseover', handleMouseOver);
	marker.on('popupopen', handlePopupOpen);

	return marker;
}