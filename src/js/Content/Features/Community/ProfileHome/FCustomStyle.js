import {ExtensionResources, HTML} from "../../../../modulesCore";
import {DOMHelper, Feature, ProfileData} from "../../../modulesContent";

export default class FCustomStyle extends Feature {

    checkPrerequisites() {
        return !this.context.isPrivateProfile;
    }

    async apply() {

        const data = await ProfileData;
        if (!data || !data.style) { return; }

        const style = ProfileData.getStyle();
        let stylesheet = document.createElement("link");
        stylesheet.rel = "stylesheet";
        stylesheet.type = "text/css";
        const availableStyles = [
            "clear",
            "goldenprofile",
            "green",
            "holiday2014",
            "orange",
            "pink",
            "purple",
            "red",
            "teal",
            "yellow",
            "blue",
            "grey"
        ];

        if (availableStyles.indexOf(style) === -1) { return; }

        document.body.classList.add("es_profile_style");

        switch (style) {
            case "goldenprofile": {
                stylesheet.href = "https://steamcommunity-a.akamaihd.net/public/css/promo/lny2019/goldenprofile.css";
                document.head.appendChild(stylesheet);

                const container = document.createElement("div");
                container.classList.add("profile_golden_wrapper");

                const profilePageNode = document.querySelector(".responsive_page_template_content .profile_page");
                DOMHelper.wrap(container, profilePageNode);

                profilePageNode.classList.add("golden_profile");

                HTML.afterBegin(profilePageNode,
                    `<div class="lny_sides_position">
                    <div class="lny_side left">
                        <div class="lny_side_background"></div>
                        <div class="lny_top"></div>
                        <div class="lny_pig"></div>
                        <div class="lny_pendulum">
                            <div class="lny_strings"></div>
                            <img src="https://steamcdn-a.akamaihd.net/steamcommunity/public/assets/lny2019/goldenprofile/test_lantern1.png">
                        </div>
                    </div>
                    <div class="lny_side right">
                        <div class="lny_side_background"></div>
                        <div class="lny_top"></div>
                        <div class="lny_pig"></div>
                        <div class="lny_pendulum">
                            <div class="lny_strings"></div>
                            <img src="https://steamcdn-a.akamaihd.net/steamcommunity/public/assets/lny2019/goldenprofile/test_lantern2.png">
                        </div>
                    </div>
                </div>`);

                HTML.beforeBegin(
                    ".profile_header",
                    `<div class="golden_profile_header">
                    <div class="lny_pig_center"></div>
                </div>`
                );

                break;
            }
            case "holiday2014":
                stylesheet.href = "//steamcommunity-a.akamaihd.net/public/css/skin_1/holidayprofile.css";
                document.head.appendChild(stylesheet);

                HTML.beforeEnd(".profile_header_bg_texture", "<div class='holidayprofile_header_overlay'></div>");
                document.querySelector(".profile_page").classList.add("holidayprofile");

                DOMHelper.insertScript({"src": ExtensionResources.getURL("js/extra/holidayprofile.js")});

                break;
            case "clear":
                document.body.classList.add("es_style_clear");
                break;
            default: {
                const styleUrl = ExtensionResources.getURL(`img/profile_styles/${style}/style.css`);
                const headerImg = ExtensionResources.getURL(`img/profile_styles/${style}/header.jpg`);

                stylesheet.href = styleUrl;
                document.head.appendChild(stylesheet);

                document.querySelector(".profile_header_bg_texture").style.backgroundImage = `url('${headerImg}')`;
                break;
            }
        }
        stylesheet = null;
    }
}
