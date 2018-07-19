function Marker(loc, opt, imgsrc) {

	var marker = L.marker(loc, opt);
	var isHovering = false;

	var closePopup = function() {
		setTimeout(() => {
			if(!isHovering) marker.closePopup();
		}, 500);
	};

	var handleMouseOut = function(event) {
		isHovering = false;
		closePopup();
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

        $actual.on('load', (event) => {
            $loading.hide();
            $actual.css('background-color','inherit');
        });

        $actual.on('error', (event) => {
            $actual.hide();
        })

		$wrap.hover(handleMouseOver, handleMouseOut);
	};

	marker.on('mouseout', handleMouseOut);
	marker.on('mouseover', handleMouseOver);
	marker.on('popupopen', handlePopupOpen);

	return marker;
}