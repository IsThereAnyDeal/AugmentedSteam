import self_ from "./FGroupLinks.svelte";
import Feature from "@Content/Modules/Context/Feature";
import Settings from "@Options/Data/Settings";
import type CGroupHome from "@Content/Features/Community/GroupHome/CGroupHome";

export default class FGroupLinks extends Feature<CGroupHome> {

    override checkPrerequisites(): boolean {
        return Settings.group_steamgifts && this.context.groupId !== null;
    }

    override apply(): void {

        const anchor = document.querySelector(".responsive_hidden > .rightbox")
            ?.parentElement
            ?.nextElementSibling;

        if (!anchor) {
            throw new Error("Node not found");
        }

        (new self_({
            target: anchor.parentElement!,
            anchor,
            props: {
                groupId: this.context.groupId!
            }
        }));
    }
}
