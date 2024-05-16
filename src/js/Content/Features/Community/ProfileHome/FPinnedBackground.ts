import Feature from "@Content/Modules/Context/Feature";
import type CProfileHome from "@Content/Features/Community/ProfileHome/CProfileHome";
import Settings from "@Options/Data/Settings";

export default class FPinnedBackground extends Feature<CProfileHome> {

    override checkPrerequisites(): boolean {
        return Settings.profile_pinned_bg;
    }

    override apply(): void {

        const animatedBgNode = document.querySelector<HTMLElement>(".profile_animated_background");
        if (animatedBgNode) {
            animatedBgNode.style.position = "fixed";
        } else {

            /**
             * For static bgs, add its own element, so it can scroll independently to avoid performance issues.
             * See https://www.fourkitchens.com/blog/article/fix-scrolling-performance-css-will-change-property/
             */
            const bgNode = document.createElement("div");
            bgNode.classList.add("as_profile_static_background");

            // Copy background-image from inline style
            const profilePage = document.querySelector<HTMLElement>(".no_header.profile_page");

            // For the default background this property is not present in the inline style, so use getComputedStyle
            if (profilePage) {
                bgNode.style.backgroundImage = getComputedStyle(profilePage).backgroundImage;
                profilePage.insertAdjacentElement("afterbegin", bgNode);
                profilePage.style.backgroundImage = "none";
            }
        }
    }
}
