import type CProfileHome from "@Content/Features/Community/ProfileHome/CProfileHome";
import Feature from "@Content/Modules/Context/Feature";
import Settings from "@Options/Data/Settings";
import DOMHelper from "@Content/Modules/DOMHelper";
import HTML from "@Core/Html/Html";
import ExtensionResources from "@Core/ExtensionResources";

export default class FCustomStyle extends Feature<CProfileHome> {

    // Synced with available options in CProfileEdit/FStyleSelection
    private readonly _availableStyles = new Set([
        "goldenprofile2020",
        "winter2019",
        "goldenprofile",
        "holiday2014",
        "blue",
        "clear",
        "green",
        "orange",
        "pink",
        "purple",
        "red",
        "teal",
        "yellow",
        "grey",
    ]);

    private style: string = "";

    override async checkPrerequisites(): Promise<boolean> {
        if (this.context.isPrivateProfile || !Settings.show_custom_themes) {
            return false;
        }

        const result = await this.context.data;
        if (!result || !result.style || result.style === "remove") {
            return false;
        }

        if (!this._availableStyles.has(result.style)) {
            return false;
        }

        this.style = result.style;
        return true;
    }

    override apply(): void {
        const style = this.style;

        document.body.classList.add("es_profile_style");

        switch (style) {
            case "winter2019": {
                DOMHelper.insertRemoteStylesheet("https://community.cloudflare.steamstatic.com/public/css/promo/winter2019/goldenprofile.css");

                const profilePageNode = document.querySelector(".no_header.profile_page")!;
                profilePageNode.classList.add("golden_profile");
                HTML.wrap("<div class='profile_golden_wrapper'></div>", profilePageNode);

                HTML.afterBegin(profilePageNode,
                    `<div class="w19_sides_position">
                        <div class="w19_side left">
                            <div class="w19_side_background"></div>
                            <div class="w19_pig"></div>
                            <div class="w19_top"></div>
                            <div class="w19_pendulum">
                                <div class="w19_strings"></div>
                                <img src="//cdn.cloudflare.steamstatic.com/steamcommunity/public/assets/winter2019/goldenprofile/dangle_flake.png">
                            </div>
                        </div>
                        <div class="w19_side right">
                            <div class="w19_side_background"></div>
                            <div class="w19_pig"></div>
                            <div class="w19_top"></div>
                            <div class="w19_pendulum">
                                <div class="w19_strings"></div>
                                <img src="//cdn.cloudflare.steamstatic.com/steamcommunity/public/assets/winter2019/goldenprofile/dangle_flake.png">
                            </div>
                        </div>
                        <div class="snowflakes" aria-hidden="true">
                            <div class="snowflake"></div>
                            <div class="snowflake"></div>
                            <div class="snowflake"></div>
                            <div class="snowflake"></div>
                            <div class="snowflake"></div>
                            <div class="snowflake"></div>
                            <div class="snowflake"></div>
                            <div class="snowflake"></div>
                            <div class="snowflake"></div>
                            <div class="snowflake"></div>
                            <div class="snowflake"></div>
                        </div>
                    </div>`);

                HTML.afterBegin(".profile_header_bg_texture", "<div class='golden_profile_header'></div>");

                document.querySelector(".playerAvatar.profile_header_size")!.classList.add("golden");
                break;
            }

            case "goldenprofile2020": {
                DOMHelper.insertRemoteStylesheet("//community.cloudflare.steamstatic.com/public/css/promo/lny2020/goldenprofile.css");

                const profilePageNode = document.querySelector(".no_header.profile_page")!;
                profilePageNode.classList.add("golden_profile");
                HTML.wrap("<div class='profile_golden_wrapper'></div>", profilePageNode);

                HTML.afterBegin(profilePageNode,
                    `<div class="w19_sides_position">
                        <div class="w19_side left">
                            <div class="w19_side_background"></div>
                        </div>
                        <div class="w19_side right">
                            <div class="w19_side_background"></div>
                        </div>
                    </div>`);

                HTML.afterBegin(".profile_header_bg_texture", "<div class='golden_profile_header'></div>");

                const avatarNode = document.querySelector(".playerAvatar.profile_header_size")!;
                avatarNode.classList.add("golden");
                HTML.afterBegin(avatarNode, "<div class='goldenAvatarOverlay'></div>");

                // Use the animated BG that comes with this theme if the profile has no BG equipped
                if (!profilePageNode.classList.contains("has_profile_background")) {

                    HTML.afterBegin(profilePageNode,
                        `<div class="profile_animated_background">
                            <video playsinline autoplay muted loop poster="//cdn.cloudflare.steamstatic.com/steamcommunity/public/images/items/1223590/daa4b34582ed6cab1327f247be8d03d92ae8aaaa.jpg">
                                <source src="//cdn.cloudflare.steamstatic.com/steamcommunity/public/images/items/1223590/c146558951b46ade8d64ea8e787980f84d30ec46.webm" type="video/webm">
                                <source src="//cdn.cloudflare.steamstatic.com/steamcommunity/public/images/items/1223590/b5c39efda3998e0d2e734e8b7385ecf705ce8cc5.mp4" type="video/mp4">
                            </video>
                        </div>`);

                    for (const node of [document.body, profilePageNode, profilePageNode.querySelector(".profile_content")!]) {
                        node.classList.add("has_profile_background");
                    }
                }
                break;
            }

            case "goldenprofile": {
                DOMHelper.insertRemoteStylesheet("//community.cloudflare.steamstatic.com/public/css/promo/lny2019/goldenprofile.css");

                const profilePageNode = document.querySelector(".no_header.profile_page")!;
                profilePageNode.classList.add("golden_profile");
                HTML.wrap("<div class='profile_golden_wrapper'></div>", profilePageNode);

                HTML.afterBegin(profilePageNode,
                    `<div class="lny_sides_position">
                        <div class="lny_side left">
                            <div class="lny_side_background"></div>
                            <div class="lny_top"></div>
                            <div class="lny_pig"></div>
                            <div class="lny_pendulum">
                                <div class="lny_strings"></div>
                                <img src="//cdn.cloudflare.steamstatic.com/steamcommunity/public/assets/lny2019/goldenprofile/test_lantern1.png">
                            </div>
                        </div>
                        <div class="lny_side right">
                            <div class="lny_side_background"></div>
                            <div class="lny_top"></div>
                            <div class="lny_pig"></div>
                            <div class="lny_pendulum">
                                <div class="lny_strings"></div>
                                <img src="//cdn.cloudflare.steamstatic.com/steamcommunity/public/assets/lny2019/goldenprofile/test_lantern2.png">
                            </div>
                        </div>
                    </div>`);

                HTML.afterBegin(".profile_header_bg_texture",
                    `<div class="golden_profile_header">
                        <div class="lny_pig_center"></div>
                    </div>`);

                document.querySelector(".playerAvatar.profile_header_size")!.classList.add("golden");
                break;
            }

            case "holiday2014":
                DOMHelper.insertRemoteStylesheet("//community.cloudflare.steamstatic.com/public/css/skin_1/holidayprofile.css");

                HTML.beforeEnd(".profile_header_bg_texture", "<div class='holidayprofile_header_overlay'></div>");
                document.querySelector(".no_header.profile_page")!.classList.add("holidayprofile");

                DOMHelper.insertScript(ExtensionResources.getURL("js/extra/holidayprofile.js"));
                break;

            case "clear":
                document.body.classList.add("es_style_clear");
                break;

            default: {
                DOMHelper.insertStylesheet(`img/profile_styles/${style}/style.css`);

                const headerImg = ExtensionResources.getURL(`img/profile_styles/${style}/header.jpg`);
                document.querySelector<HTMLElement>(".profile_header_bg_texture")!.style.backgroundImage = `url(${headerImg})`;
                break;
            }
        }
    }
}
