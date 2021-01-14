import {HTML} from "../../../../modulesCore";
import {Feature, ProfileData} from "../../../modulesContent";

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
                const nodes = document.querySelectorAll(".no_header.profile_page, .profile_background_image_content");
                for (const node of nodes) {
                    node.style.backgroundImage = `url(${imgUrl})`;
                }
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

        const profilePage = document.querySelector(".no_header.profile_page");
        profilePage.style.backgroundImage = `url(${bg})`;

        let node = profilePage.querySelector(".profile_background_image_content");
        if (node) {
            node.style.backgroundImage = `url(${bg})`;
        } else {
            profilePage.classList.add("has_profile_background");
            node = profilePage.querySelector(".profile_content");
            node.classList.add("has_profile_background");
            HTML.afterBegin(node,
                `<div class="profile_background_holder_content">
                    <div class="profile_background_overlay_content"></div>
                    <div class="profile_background_image_content" style="background-image: url(${bg});"></div>
                </div>`);
        }
    }
}
