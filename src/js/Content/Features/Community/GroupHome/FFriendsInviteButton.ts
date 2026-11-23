import self_ from "./FFriendsInviteButton.svelte";
import Feature from "@Content/Modules/Context/Feature";
import type CGroupHome from "@Content/Features/Community/GroupHome/CGroupHome";
import { mount } from "svelte";
import {MountTargetError} from "@Core/Errors/Errors";

export default class FFriendsInviteButton extends Feature<CGroupHome> {

    override async isEnabled(): Promise<boolean> {
        // FIXME setting
        return true;
    }

    override async apply(): Promise<string|null> {
        if (!this.context.user.isSignedIn
            || this.context.groupId=== null
            || document.querySelector(".grouppage_join_area") !== null
        ) {
            return null;
        }

        const node = document.querySelector("#join_group_form");
        if (!node) {
            throw new MountTargetError();
        }

        mount(self_, {
            target: node.parentElement!,
            props: {
                groupId: this.context.groupId
            }
        });
        return null;
    }
}
