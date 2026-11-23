import self_ from "./FGroupLinks.svelte";
import Feature from "@Content/Modules/Context/Feature";
import Settings from "@Options/Data/Settings";
import type CGroupHome from "@Content/Features/Community/GroupHome/CGroupHome";
import { mount } from "svelte";
import {MountTargetError} from "@Core/Errors/Errors";

export default class FGroupLinks extends Feature<CGroupHome> {

    override async isEnabled(): Promise<boolean> {
        return Settings.group_steamgifts;
    }

    override async apply(): Promise<string|null> {
        if (this.context.groupId === null) {
            return null;
        }

        const anchor = document.querySelector(".responsive_hidden > .rightbox")
            ?.parentElement
            ?.nextElementSibling;

        if (!anchor) {
            throw new MountTargetError();
        }

        mount(self_, {
            target: anchor.parentElement!,
            anchor,
            props: {
                groupId: this.context.groupId!
            }
        });
        return null;
    }
}
