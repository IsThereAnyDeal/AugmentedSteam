import self_ from "./FFavoriteEmoticons.svelte";
import type CCommunityBase from "@Content/Features/Community/CCommunityBase";
import Feature from "@Content/Modules/Context/Feature";

export function handleDrag(e: DragEvent): void {
    if (!e.dataTransfer || !e.target) {
        return;
    }

    const emoticon = (<HTMLElement>(e.target)).dataset.emoticon;
    if (!emoticon) {
        return;
    }

    e.dataTransfer.setData("emoticon", emoticon);
    const emoticonHover = document.querySelector<HTMLElement>(".emoticon_hover");
    if (emoticonHover) {
        emoticonHover.style.display = "none";
    }
}

export default class FFavoriteEmoticons extends Feature<CCommunityBase> {

    override checkPrerequisites(): boolean {
        return document.querySelector(".emoticon_button") !== null;
    }

    override apply(): void {
        new MutationObserver(() => {
            const emoticonPopup = document.querySelector<HTMLElement>(".emoticon_popup:not(.es_emoticons)");
            if (!emoticonPopup) { return; }

            emoticonPopup.classList.add("es_emoticons");

            for (const node of emoticonPopup.querySelectorAll<HTMLElement>(".emoticon_option")) {
                node.draggable = true;
                node.querySelector("img")!.draggable = false;
                node.addEventListener("dragstart", handleDrag);
            }

            new self_({
                target: emoticonPopup,
                anchor: emoticonPopup.firstElementChild ?? undefined,
                props: {
                    emoticonPopup
                }
            });
        }).observe(document.body, {"childList": true});
    }
}
