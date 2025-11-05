import self_ from "./FUserNotes.svelte";
import Settings from "@Options/Data/Settings";
import type CApp from "@Content/Features/Store/App/CApp";
import Feature from "@Content/Modules/Context/Feature";
import UserNotes from "@Content/Features/Store/Common/UserNotes/UserNotes";

export default class FUserNotes extends Feature<CApp> {

    override checkPrerequisites(): boolean {
        return this.context.user.isSignedIn && Settings.user_notes_app;
    }

    override async apply(): Promise<void> {
        const queue = document.querySelector("#queueCtn");
        if (!queue) {
            throw new Error("Node not found");
        }

        (new self_({
            target: queue,
            props: {
                notes: new UserNotes(),
                appid: this.context.appid,
                appName: this.context.appName
            }
        }));
    }
}
