import {Feature} from "../../../Modules/Content/Feature/Feature";

import {HTML} from "../../../Modules/Core/Html/Html";
import {ProfileData} from "community/common";

export default class FCustomBackground extends Feature {

    async apply() {

        const prevHash = window.location.hash.match(/#previewBackground\/(\d+)\/([a-z0-9.]+)/i);

        if (prevHash) {
            const imgUrl = `//steamcdn-a.akamaihd.net/steamcommunity/public/images/items/${prevHash[1]}/${prevHash[2]}`;

            // Make sure the url is for a valid background image
            HTML.beforeEnd(document.body, `<img class="es_bg_test" style="display: none" src="${imgUrl}" />`);

            document.querySelector("img.es_bg_test").addEventListener("load", () => {
                const nodes = document.querySelectorAll(".no_header.profile_page, .profile_background_image_content");
                for (let i = 0, len = nodes.length; i < len; i++) {
                    const node = nodes[i];
                    node.style.backgroundImage = `url('${imgUrl}')`;
                }
                document.querySelector(".es_bg_test").remove();
            });

            return;
        }

        if (document.querySelector(".profile_page.private_profile")) {
            return;
        }

        await ProfileData;
        const bg = ProfileData.getBgImgUrl();
        if (!bg) { return; }

        document.querySelector(".no_header").style.backgroundImage = `url(${bg})`;

        let node = document.querySelector(".profile_background_image_content");
        if (node) {
            node.style.backgroundImage = `url(${bg})`;
            return;
        }

        document.querySelector(".no_header").classList.add("has_profile_background");
        node = document.querySelector(".profile_content");
        node.classList.add("has_profile_background");
        HTML.afterBegin(node, `<div class="profile_background_holder_content"><div class="profile_background_overlay_content"></div><div class="profile_background_image_content " style="background-image: url(${bg});"></div></div></div>`);
    }
}
