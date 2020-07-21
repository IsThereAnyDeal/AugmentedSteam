import {Localization, SyncedStorage} from "core";
import {Common, Currency, User} from "common";
import {CommentHandler} from "community/common/CommentHandler";

export default async function(context) {

    if (!document.getElementById("global_header")) { return; }

    try {

        // TODO What errors can be "suppressed" here?
        await SyncedStorage.init().catch(err => { console.error(err); });
        await Promise.all([Localization, User, Currency]);
    } catch (err) {
        console.group("Augmented Steam initialization");
        console.error("Failed to initiliaze Augmented Steam");
        console.error(err);
        console.groupEnd();

        return;
    }

    Common.init();

    CommentHandler.hideSpamComments();
    CommentHandler.addFavoriteEmoticons();

    return new context().applyFeatures();
}
