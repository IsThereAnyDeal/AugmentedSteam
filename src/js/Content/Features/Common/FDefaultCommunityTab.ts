import Feature from "@Content/Modules/Context/Feature";
import type CBase from "@Content/Features/Common/CBase";
import Settings from "@Options/Data/Settings";

export default class FDefaultCommunityTab extends Feature<CBase> {

    override checkPrerequisites(): boolean {
        return Settings.community_default_tab !== ""; // Default value is an empty string
    }

    override apply(): void {
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
    }
}
