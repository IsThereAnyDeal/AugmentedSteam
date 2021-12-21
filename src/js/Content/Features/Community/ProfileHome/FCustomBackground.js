import {Feature, ProfileData} from "../../../modulesContent";

export default class FCustomBackground extends Feature {

    checkPrerequisites() {
        const prevHash = window.location.hash.match(/#previewBackground\/(\d+)\/([a-z0-9.]+)/i);
        if (prevHash) {
            const src = `//cdn.akamai.steamstatic.com/steamcommunity/public/images/items/${prevHash[1]}/${prevHash[2]}`;
            this._setProfileBg(src);

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

    _setProfileBg(src) {

        const isVideo = /(webm|mp4)$/.test(src);
        const profilePage = document.querySelector(".no_header.profile_page");
        let animatedBgContainer = document.querySelector(".profile_animated_background");

        if (isVideo) {
            if (animatedBgContainer) {
                animatedBgContainer.querySelector("video").src = src;
            } else {
                profilePage.style.backgroundImage = "none";

                animatedBgContainer = document.createElement("div");
                animatedBgContainer.classList.add("profile_animated_background");

                const videoEl = document.createElement("video");
                ["playsinline", "autoplay", "muted", "loop"].forEach(attr => videoEl.setAttribute(attr, ""));
                videoEl.src = src;
                animatedBgContainer.append(videoEl);
                profilePage.prepend(animatedBgContainer);
            }
        } else {
            if (animatedBgContainer) {
                animatedBgContainer.remove(); // Animated BGs will interfere with static BGs
            }

            profilePage.style.backgroundImage = `url(${src})`;
        }

        if (!profilePage.classList.contains("has_profile_background")) {
            for (const node of [document.body, profilePage, profilePage.querySelector(".profile_content")]) {
                node.classList.add("has_profile_background");
            }
        }
    }
}
