import {Feature} from "modules";

export default class FExpandAchievementDesc extends Feature {

    apply() {

        // .ellipsis is only added by Steam on personal stats pages
        for (const node of document.querySelectorAll("h5.ellipsis")) {
            node.classList.remove("ellipsis");
        }
    }
}
