class FPurchaseDate extends ASFeature {

    _node;

    checkPrerequisites() {
        if (User.isSignedIn && SyncedStorage.get("purchase_dates")) {
            this._node = document.querySelector(".game_area_already_owned .already_in_library");
            return this._node;
        }
        return false;
    }

    async apply() {
        let appname = this.context.appName.replace(/:/g, "").trim();
        let date = await User.getPurchaseDate(Language.getCurrentSteamLanguage(), appname);
        if (!date) {
            console.warn("Failed to retrieve purchase date");
            return;
        }

        this._node.textContent += ` ${Localization.str.purchase_date.replace("__date__", date)}`;
    }
}