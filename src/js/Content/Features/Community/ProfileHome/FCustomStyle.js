import {ExtensionResources, HTML} from "../../../../modulesCore";
import {DOMHelper, Feature, ProfileData} from "../../../modulesContent";

export default class FCustomStyle extends Feature {

    checkPrerequisites() {
        return !this.context.isPrivateProfile;
    }

    async apply() {

        const {style} = await ProfileData || {};
        if (!style) { return; }

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

        if (!availableStyles.includes(style)) { return; }

        document.body.classList.add("es_profile_style");

        switch (style) {
            case "goldenprofile": {
                DOMHelper.insertStylesheet("//steamcommunity-a.akamaihd.net/public/css/promo/lny2019/goldenprofile.css");

                const profilePageNode = document.querySelector(".no_header.profile_page");
                profilePageNode.classList.add("golden_profile");
                HTML.wrap(profilePageNode, "<div class='profile_golden_wrapper'></div>");

                HTML.afterBegin(profilePageNode,
                    `<div class="lny_sides_position">
                        <div class="lny_side left">
                            <div class="lny_side_background"></div>
                            <div class="lny_top"></div>
                            <div class="lny_pig"></div>
                            <div class="lny_pendulum">
                                <div class="lny_strings"></div>
                                <img src="//steamcdn-a.akamaihd.net/steamcommunity/public/assets/lny2019/goldenprofile/test_lantern1.png">
                            </div>
                        </div>
                        <div class="lny_side right">
                            <div class="lny_side_background"></div>
                            <div class="lny_top"></div>
                            <div class="lny_pig"></div>
                            <div class="lny_pendulum">
                                <div class="lny_strings"></div>
                                <img src="//steamcdn-a.akamaihd.net/steamcommunity/public/assets/lny2019/goldenprofile/test_lantern2.png">
                            </div>
                        </div>
                    </div>`);

                HTML.afterBegin(".profile_header_bg_texture",
                    `<div class="golden_profile_header">
                        <div class="lny_pig_center"></div>
                    </div>`);

                document.querySelector(".playerAvatar.profile_header_size").classList.add("golden");

                break;
            }
            case "holiday2014":
                DOMHelper.insertStylesheet("//steamcommunity-a.akamaihd.net/public/css/skin_1/holidayprofile.css");

                HTML.beforeEnd(".profile_header_bg_texture", "<div class='holidayprofile_header_overlay'></div>");
                document.querySelector(".no_header.profile_page").classList.add("holidayprofile");

                DOMHelper.insertScript({"src": ExtensionResources.getURL("js/extra/holidayprofile.js")});

                break;
            case "clear":
                document.body.classList.add("es_style_clear");
                break;
            default: {
                DOMHelper.insertStylesheet(ExtensionResources.getURL(`img/profile_styles/${style}/style.css`));

                const headerImg = ExtensionResources.getURL(`img/profile_styles/${style}/header.jpg`);
                document.querySelector(".profile_header_bg_texture").style.backgroundImage = `url(${headerImg})`;

                break;
            }
        }
    }
}
