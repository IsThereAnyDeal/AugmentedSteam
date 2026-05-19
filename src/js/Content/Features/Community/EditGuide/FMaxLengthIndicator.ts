import Feature from "@Content/Modules/Context/Feature";
import type CEditGuide from "@Content/Features/Community/EditGuide/CEditGuide";

export default class FMaxLengthIndicator extends Feature<CEditGuide> {

    override apply(): void {
        const description = document.querySelector("textarea#description");
        if (!description) {
            throw new Error("Textarea not found");
        }

        const helpContainer = description.parentNode!.querySelector(".workshopFormattingHelpContainer") as HTMLDivElement;
        if (!helpContainer) {
            throw new Error("Help container not found");
        }

        const counter = document.createElement("div");
        counter.innerText = "0";

        helpContainer.style.display = "flex";
        helpContainer.style.justifyContent = "space-between";
        helpContainer.insertAdjacentElement("afterbegin", counter);

        description.addEventListener("input", (e: Event) => {
            e =  e as InputEvent;
            const textarea = e.target as HTMLTextAreaElement;
            const count = textarea.value.length;
            counter.innerText = String(count);
        });
    }
}
