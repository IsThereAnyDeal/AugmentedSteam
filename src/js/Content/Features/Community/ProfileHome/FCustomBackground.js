import {DOMHelper, Feature, ProfileData} from "../../../modulesContent";

export default class FCustomBackground extends Feature {

    checkPrerequisites() {
        const prevHash = window.location.hash.match(/#previewBackground\/(\d+)\/([a-z0-9.]+)/i);
        if (prevHash) {
            const imgUrl = `//steamcdn-a.akamaihd.net/steamcommunity/public/images/items/${prevHash[1]}/${prevHash[2]}`;

            const testImg = document.createElement("img");
            testImg.style.display = "none";
            testImg.src = imgUrl;

            document.body.append(testImg);

            // Make sure the url is for a valid background image
            testImg.addEventListener("load", () => {
                DOMHelper.remove(".profile_animated_background"); // Animated BGs will interfere with static BGs
                this._setProfileBg(imgUrl);
                testImg.remove();
            });

            return false;
        }

        return !this.context.isPrivateProfile;
    }

    async apply() {

        await ProfileData;
        const bg = ProfileData.getBgImgUrl();
        if (!bg) { return; }

        this._setProfileBg(bg);
    }

    _setProfileBg(imgUrl) {
        document.body.classList.add("has_profile_background");

        const profilePage = document.querySelector(".no_header.profile_page");
        profilePage.classList.add("has_profile_background");
        profilePage.style.backgroundImage = `url(${imgUrl})`;

        profilePage.querySelector(".profile_content").classList.add("has_profile_background");
    }
}
