import {HTML, Localization} from "../../../../modulesCore";
import {Feature, User} from "../../../modulesContent";
import Workshop from "../Workshop";

export default class FSubscribeAllDependencies extends Feature {

    checkPrerequisites() {
        return User.isSignedIn;
    }

    apply() {
        document.getElementById("SubscribeItemBtn").addEventListener("click", () => {

            const subBtn = HTML.element(
                `<div class="btn_green_steamui btn_medium">
                    <span>${Localization.str.workshop.subscribe_all}</span>
                </div>`
            );

            subBtn.addEventListener("click", async() => {
                const items = document.querySelectorAll(".newmodal #RequiredItems > a");

                const loader = HTML.element("<div class='loader'></div>");

                for (const item of items) {

                    // If the user has pressed the "Cancel" button
                    if (!subBtn.isConnected) { return; }

                    item.querySelector(".requiredItem").insertAdjacentElement("beforeend", loader);

                    const id = new URL(item.href).searchParams.get("id");
                    const div = item.firstElementChild;

                    try {
                        await Workshop.changeSubscription(id, this.context.appid, "subscribe");
                        div.classList.add("es_required_item--success");
                    } catch (err) {
                        console.error(err);
                        div.classList.add("es_required_item--error");
                    }
                }

                loader.remove();
            });

            document.querySelector(".newmodal .btn_green_steamui").insertAdjacentElement("beforebegin", subBtn);
        });
    }
}
