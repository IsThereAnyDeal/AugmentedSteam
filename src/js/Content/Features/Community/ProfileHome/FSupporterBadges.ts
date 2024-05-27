import self_ from "./FSupporterBadges.svelte";
import Feature from "@Content/Modules/Context/Feature";
import type CProfileHome from "@Content/Features/Community/ProfileHome/CProfileHome";
import type {TProfileData} from "@Background/Modules/AugmentedSteam/_types";

export default class FSupporterBadges extends Feature<CProfileHome> {

    private _data: TProfileData["badges"]|undefined;

    override async checkPrerequisites(): Promise<boolean> {
        if (this.context.isPrivateProfile) {
            return false;
        }

        const result = await this.context.data;
        if (!result || !result.badges || !result.badges.length) {
            return false;
        }

        this._data = result.badges;
        return true;
    }

    override apply(): void {
        const node = document.querySelector<HTMLElement>(".profile_badges")!;
        (new self_({
            target: node.parentElement!,
            anchor: node.nextElementSibling!,
            props: {
                badges: this._data!
            }
        }));
    }
}
