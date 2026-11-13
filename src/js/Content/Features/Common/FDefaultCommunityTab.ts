import Feature from "@Content/Modules/Context/Feature";
import Settings from "@Options/Data/Settings";
import type Context from "@Content/Modules/Context/Context";

/**
 * Tries to find community app pages and add default section to them
 * TODO not sure how well this works
 */
export default class FDefaultCommunityTab extends Feature<Context> {

    override async isEnabled(): Promise<boolean> {
        return Settings.community_default_tab !== ""; // Default value is an empty string
    }

    override async apply(): Promise<string|null> {
        const tab = Settings.community_default_tab;

        const links = document.querySelectorAll<HTMLAnchorElement>("a[href^='https://steamcommunity.com/app/']");
        for (const link of links) {
            if (link.classList.contains("apphub_sectionTab")) { continue; }
            if (!/^\/app\/[0-9]+\/?$/.test(link.pathname)) { continue; }
            if (!link.pathname.endsWith("/")) {
                link.pathname += "/";
            }
            link.pathname += `${tab}/`;
        }
        return null;
    }
}
