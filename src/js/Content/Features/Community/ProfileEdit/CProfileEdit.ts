import CCommunityBase from "../CCommunityBase";
import FBackgroundSelection from "./FBackgroundSelection";
import FStyleSelection from "./FStyleSelection";
import ContextType from "@Content/Modules/Context/ContextType";
import User from "@Content/Modules/User";
import AugmentedSteamApiFacade from "@Content/Modules/Facades/AugmentedSteamApiFacade";
import type {TProfileData} from "@Background/Modules/AugmentedSteam/_types";

export default class CProfileEdit extends CCommunityBase {

    public readonly steamId: string;
    public readonly data : Promise<TProfileData|null>;

    constructor() {

        super(ContextType.PROFILE_EDIT, [
            FBackgroundSelection,
            FStyleSelection,
        ]);

        this.steamId = User.steamId;
        this.data = AugmentedSteamApiFacade.getProfileData(this.steamId)
            .catch(e => {
                console.error(e);
                return null;
            });
    }
}
