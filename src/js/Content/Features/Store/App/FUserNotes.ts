import self_ from "./FUserNotes.svelte";
import Settings from "@Options/Data/Settings";
import type CApp from "@Content/Features/Store/App/CApp";
import Feature from "@Content/Modules/Context/Feature";
import UserNotes from "@Content/Features/Store/Common/UserNotes/UserNotes";
import { mount } from "svelte";
import {MountTargetError} from "@Core/Errors/Errors";

export default class FUserNotes extends Feature<CApp> {

    override async isEnabled(): Promise<boolean> {
        return this.context.user.isSignedIn && Settings.user_notes_app;
    }

    override async apply(): Promise<string|null> {
        const queue = document.querySelector("#queueCtn");
        if (!queue) {
            throw new MountTargetError();
        }

        mount(self_, {
            target: queue,
            props: {
                notes: new UserNotes(),
                appid: this.context.appid,
                appName: this.context.appName
            }
        });
        return null;
    }
}
