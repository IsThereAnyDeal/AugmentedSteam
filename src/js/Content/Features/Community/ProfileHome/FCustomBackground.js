import {DOMHelper, Feature, ProfileData} from "../../../modulesContent";

export default class FCustomBackground extends Feature {

    checkPrerequisites() {
        const prevHash = window.location.hash.match(/#previewBackground\/(\d+)\/([a-z0-9.]+)/i);
        if (prevHash) {
            const imgUrl = `//steamcdn-a.akamaihd.net/steamcommunity/public/images/items/${prevHash[1]}/${prevHash[2]}`;
            this.setProfileBg(imgUrl);

            return false;
        }

        return !this.context.isPrivateProfile;
    }

    async apply() {

        await ProfileData;
        const bg = ProfileData.getBgImgUrl();
        if (!bg) { return; }

        FCustomBackground.setProfileBg(bg);
    }

    /**
     * Only sets static backgrounds for now.
     * TODO Update to support animated backgrounds once the custom backgrounds database
     * and/or the "view full image" feature on the Market supports them.
     */
    static setProfileBg(imgUrl) {
        DOMHelper.remove(".profile_animated_background"); // Animated BGs will interfere with static BGs

        const profilePage = document.querySelector(".no_header.profile_page");
        profilePage.style.backgroundImage = `url(${imgUrl})`;

        if (!profilePage.classList.contains("has_profile_background")) {
            for (const node of [document.body, profilePage, profilePage.querySelector(".profile_content")]) {
                node.classList.add("has_profile_background");
            }
        }
    }
}
