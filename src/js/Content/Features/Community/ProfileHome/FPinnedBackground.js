import {SyncedStorage} from "../../../../modulesCore";
import {Feature} from "../../../modulesContent";

export default class FPinnedBackground extends Feature {

    checkPrerequisites() {
        return SyncedStorage.get("profile_pinned_bg");
    }

    apply() {

        const animatedBgNode = document.querySelector(".profile_animated_background");
        if (animatedBgNode) {
            animatedBgNode.style.position = "fixed";
        } else {

            /**
             * For static bgs, add its own element so it can scroll independently to avoid performance issues.
             * See https://www.fourkitchens.com/blog/article/fix-scrolling-performance-css-will-change-property/
             */
            const bgNode = document.createElement("div");
            bgNode.classList.add("as_profile_static_background");

            // Copy background-image from inline style
            const profilePage = document.querySelector(".no_header.profile_page");

            // For the default background this property is not present in the inline style, so use getComputedStyle
            bgNode.style.backgroundImage = getComputedStyle(profilePage).backgroundImage;
            profilePage.insertAdjacentElement("afterbegin", bgNode);
            profilePage.style.backgroundImage = "none";
        }
    }
}
