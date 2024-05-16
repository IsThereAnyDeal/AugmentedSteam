(function(){
    // https://github.com/SteamDatabase/SteamTracking/blob/8e19832027cf425b5db71c09c878739b5630c66a/steamcommunity.com/public/javascript/workshop_previewplayer.js#L123
    const player = window.g_player;

    // g_player is null when the shared file only has one screenshot and therefore no highlight strip
    if (player === null) { return; }

    const elemSlider = window.$("highlight_slider");
    const nSliderWidth = player.m_elemStripScroll.getWidth() - player.m_elemStrip.getWidth();

    // Shared files with too few screenshots won't have a slider
    if (typeof player.slider !== "undefined") {
        player.slider.dispose();
    }

    if (nSliderWidth > 0) {
        const newValue = player.slider.value * (nSliderWidth / player.slider.range.end);

        player.slider = new (window.Control.Slider)(
            elemSlider.down(".handle"),
            elemSlider,
            {
                "range": window.$R(0, nSliderWidth),
                "sliderValue": newValue,
                "onSlide": player.SliderOnChange.bind(player),
                "onChange": player.SliderOnChange.bind(player),
            }
        );

        g_player.SliderOnChange(newValue);
    } else {
        elemSlider.hide();
    }
})();
