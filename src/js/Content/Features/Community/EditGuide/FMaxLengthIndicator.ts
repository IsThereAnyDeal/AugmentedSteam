import Feature from "@Content/Modules/Context/Feature";
import type CEditGuide from "@Content/Features/Community/EditGuide/CEditGuide";
import {MountTargetError} from "@Core/Errors/Errors";

export default class FMaxLengthIndicator extends Feature<CEditGuide> {

    override async isEnabled(): Promise<boolean> {
        // FIXME setting
        return true;
    }

    override async apply(): Promise<string|null> {
        const description = document.querySelector("textarea#description");
        if (!description) {
            throw new MountTargetError("Textarea not found");
        }

        const helpContainer = description.parentNode!.querySelector(".workshopFormattingHelpContainer") as HTMLDivElement;
        if (!helpContainer) {
            throw new MountTargetError("Help container not found");
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

        return null;
    }
}
