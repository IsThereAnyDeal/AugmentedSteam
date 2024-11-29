import CCommunityBase from "../CCommunityBase";
import FBackgroundSelection from "./FBackgroundSelection";
import FStyleSelection from "./FStyleSelection";
import ContextType from "@Content/Modules/Context/ContextType";
import AugmentedSteamApiFacade from "@Content/Modules/Facades/AugmentedSteamApiFacade";
import type {TProfileData} from "@Background/Modules/AugmentedSteam/_types";
import type {ContextParams} from "@Content/Modules/Context/Context";

export default class CProfileEdit extends CCommunityBase {

    public readonly root: HTMLElement|null = null;
    public readonly steamId: string;
    public readonly data : Promise<TProfileData|null>;

    constructor(params: ContextParams) {

        super(params, ContextType.PROFILE_EDIT, [
            FBackgroundSelection,
            FStyleSelection,
        ]);

        this.root = document.querySelector("#react_root");
        this.steamId = this.user.steamId;
        this.data = AugmentedSteamApiFacade.getProfileData(this.steamId)
            .catch(e => {
                console.error(e);
                return null;
            });
    }

    override async applyFeatures(): Promise<void> {
        if (!this.root) {
            throw new Error("React root not found");
        }

        let sideBarNode = document.querySelector('[href$="/edit/info"]');
        if (!sideBarNode) {
            await new Promise<void>(resolve => {
                new MutationObserver((_, observer) => {
                    sideBarNode = document.querySelector('[href$="/edit/info"]');
                    if (sideBarNode) {
                        observer.disconnect();
                        resolve();
                    }
                }).observe(this.root!, {"childList": true, "subtree": true});
            });
        }

        await super.applyFeatures();

        new MutationObserver(() => {
            document.dispatchEvent(new CustomEvent("as_profileNav"));
        }).observe(sideBarNode!.parentElement!, {"subtree": true, "attributeFilter": ["class"]});
    }
}
