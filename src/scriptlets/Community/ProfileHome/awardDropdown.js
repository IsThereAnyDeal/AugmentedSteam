(function () {
    const params = JSON.parse(document.currentScript.dataset.params);
    loginURL = params.loginURL;
    steamId = params.steamId;

	document.querySelector('#es_award')?.addEventListener('click', () => {
		window.AddProfileAward(1, loginURL, steamId);
	});
})();
