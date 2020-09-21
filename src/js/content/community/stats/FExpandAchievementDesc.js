import {Feature} from "modules";

export class FExpandAchievementDesc extends Feature {

    apply() {
        // .ellipsis is only added by Steam on personal stats pages
        for (let node of document.querySelectorAll("h5.ellipsis")) {
            node.classList.remove("ellipsis");
        }
    }
}
