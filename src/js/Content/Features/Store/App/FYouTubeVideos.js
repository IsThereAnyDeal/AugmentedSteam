import {HTML, Language, Localization, SyncedStorage} from "../../../../modulesCore";
import {Feature} from "../../../modulesContent";
import {Page} from "../../Page";

export default class FYouTubeVideos extends Feature {

    async checkPrerequisites() {
        if (!SyncedStorage.get("showyoutubegameplay") && !SyncedStorage.get("showyoutubereviews")) { return false; }

        const data = await this.context.data;
        if (data && data.youtube) {
            this._data = data.youtube;
        } else {
            this._data = null;
        }
        return true;
    }

    apply() {
        let ytTabsHtml = "";

        if (SyncedStorage.get("showyoutubegameplay")) {
            ytTabsHtml
                += `<div class="js-tab-yt-gameplay js-tab-yt js-tab es_tab home_tab">
                        <div class="tab_content">${Localization.str.youtube_gameplay}</div>
                    </div>`;
        }

        if (SyncedStorage.get("showyoutubereviews")) {
            ytTabsHtml
                += `<div class="js-tab-yt-review js-tab-yt js-tab es_tab home_tab">
                        <div class="tab_content">${Localization.str.youtube_reviews}</div>
                    </div>`;
        }

        HTML.afterBegin(".leftcol",
            `<div class="es_tabs">
                <div class="home_tabs_row">
                    <div class="js-tab-steam js-tab es_tab home_tab active">
                        <div class="tab_content">Steam</div>
                    </div>
                    ${ytTabsHtml}
                </div>
            </div>`);

        /*
         *  The separation of the tabs bar allows us to place the media slider right above the top right corner of the player.
         *  This empty div is inserted here in order to keep the same height difference between the left and the right column.
         */
        HTML.afterBegin(".rightcol", '<div style="height: 31px;"></div>');

        const steamTab = document.querySelector(".js-tab-steam");

        this._tabToMedia = new Map([
            [steamTab, document.querySelector(".highlight_overflow")],
        ]);

        steamTab.addEventListener("click", () => { this._setActiveTab(steamTab); });

        if (SyncedStorage.get("showyoutubegameplay")) {
            const gamePlayTab = document.querySelector(".js-tab-yt-gameplay");

            gamePlayTab.addEventListener("click", () => {
                if (!this._tabToMedia.has(gamePlayTab)) {
                    const gamePlayMedia = this._getIframe("gameplay");

                    this._tabToMedia.set(gamePlayTab, gamePlayMedia);

                    if (gamePlayMedia === null) { return; }

                    document.querySelector(".highlight_ctn")
                        .insertAdjacentElement("beforeend", gamePlayMedia);
                }

                if (this._tabToMedia.get(gamePlayTab) !== null) {
                    this._setActiveTab(gamePlayTab);
                }
            });
        }

        if (SyncedStorage.get("showyoutubereviews")) {
            const reviewTab = document.querySelector(".js-tab-yt-review");

            reviewTab.addEventListener("click", () => {
                if (!this._tabToMedia.has(reviewTab)) {
                    const reviewMedia = this._getIframe("reviews");

                    this._tabToMedia.set(reviewTab, reviewMedia);

                    if (reviewMedia === null) { return; }

                    document.querySelector(".highlight_ctn")
                        .insertAdjacentElement("beforeend", reviewMedia);
                }

                if (this._tabToMedia.get(reviewTab) !== null) {
                    this._setActiveTab(reviewTab);
                }
            });
        }
    }

    _setActiveTab(tab) {
        if (!tab) { return; }

        const activeTab = document.querySelector(".js-tab.active");
        if (activeTab === tab) { return; }

        const media = this._tabToMedia.get(tab);
        const activeMedia = this._tabToMedia.get(activeTab);

        if (activeTab.classList.contains("js-tab-steam")) {
            Page.runInPageContext(() => {
                SteamOnWebPanelHidden(); // eslint-disable-line no-undef, new-cap
            });
        } else if (activeTab.classList.contains("js-tab-yt")) {
            activeMedia.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', "https://www.youtube.com");
        }

        activeMedia.style.display = "none";
        activeTab.classList.remove("active");

        media.style.display = "block";
        tab.classList.add("active");

        if (tab.classList.contains("js-tab-steam")) {
            Page.runInPageContext(() => {
                SteamOnWebPanelShown(); // eslint-disable-line no-undef, new-cap
            });
        }
    }

    _getIframe(type) {

        const videoIds = this._data && this._data[type];
        if (!videoIds) { return null; }

        const hlParam = encodeURIComponent(Language.getLanguageCode(Language.getCurrentSteamLanguage()));

        const player = document.createElement("iframe");
        player.classList.add("es_youtube_player");
        player.type = "text/html";
        player.src = `https://www.youtube.com/embed?playlist=${videoIds}&origin=https://store.steampowered.com&widget_referrer=https://augmentedsteam.com&hl=${hlParam}&enablejsapi=1`;
        player.allowFullscreen = true;

        return player;
    }
}
