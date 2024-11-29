import self_ from "./FFriendsInviteButton.svelte";
import Feature from "@Content/Modules/Context/Feature";
import type CGroupHome from "@Content/Features/Community/GroupHome/CGroupHome";

export default class FFriendsInviteButton extends Feature<CGroupHome> {

    override checkPrerequisites(): boolean {
        return this.context.user.isSignedIn
            && this.context.groupId !== null
            && document.querySelector(".grouppage_join_area") === null;
    }

    override apply(): void {

        const node = document.querySelector("#join_group_form");
        if (!node) {
            throw new Error("Node not found");
        }

        (new self_({
            target: node.parentElement!,
            props: {
                groupId: this.context.groupId!
            }
        }));
    }
}
