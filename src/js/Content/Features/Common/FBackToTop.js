import {SyncedStorage} from "../../../Core/Storage/SyncedStorage";
import {Feature} from "../../Modules/Feature/Feature";

export default class FBackToTop extends Feature {

    checkPrerequisites() {
        return SyncedStorage.get("show_backtotop");
    }

    apply() {

        // Remove Steam's back-to-top button
        document.querySelector("#BackToTop")?.remove();

        const btn = document.createElement("div");
        btn.classList.add("es_btt");
        btn.textContent = "▲";

        document.body.append(btn);

        btn.addEventListener("click", () => {
            window.scroll({
                "top": 0,
                "left": 0,
                "behavior": "smooth"
            });
        });

        window.addEventListener("scroll", () => {
            btn.classList.toggle("is-visible", window.scrollY >= 400);
        });
    }
}
