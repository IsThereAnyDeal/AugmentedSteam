import {Background, ContextType, User} from "../../../modulesContent";
import {CCommunityBase} from "../CCommunityBase";
import FBackgroundSelection from "./FBackgroundSelection";
import FStyleSelection from "./FStyleSelection";

export class CProfileEdit extends CCommunityBase {

    constructor() {

        super(ContextType.PROFILE_EDIT, [
            FBackgroundSelection,
            FStyleSelection,
        ]);

        this.steamId = User.steamId;
        this.data = this.profileDataPromise().catch(err => console.error(err));
    }

    profileDataPromise() {
        return Background.action("profile", this.steamId);
    }

    clearOwn() {
        return Background.action("clearownprofile", this.steamId);
    }
}
