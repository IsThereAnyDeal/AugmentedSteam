import self_ from "./FGroupLinks.svelte";
import Feature from "@Content/Modules/Context/Feature";
import Settings from "@Options/Data/Settings";
import type CGroupHome from "@Content/Features/Community/GroupHome/CGroupHome";

export default class FGroupLinks extends Feature<CGroupHome> {

    override checkPrerequisites(): boolean | Promise<boolean> {
        return Settings.group_steamgifts;
    }

    override apply(): void {

        const anchor = document.querySelector<HTMLElement>(".responsive_hidden > .rightbox")
            ?.parentElement
            ?.nextElementSibling;
        if (anchor) {
            (new self_({
                target: anchor.parentElement!,
                anchor: anchor as HTMLElement,
                props: {
                    groupId: this.context.groupId
                }
            }));
        }
    }
}
