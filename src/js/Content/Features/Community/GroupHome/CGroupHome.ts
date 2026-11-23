import Context, {type ContextParams} from "@Content/Modules/Context/Context";
import {bootstrapLegacy, features} from "@Content/bootstrap";
import commonFeatures from "@Content/Features/Common/_commonFeatures";
import communityFeatures from "@Content/Features/Community/communityFeatures";
import FFriendsInviteButton from "@Content/Features/Community/GroupHome/FFriendsInviteButton";
import FGroupLinks from "@Content/Features/Community/GroupHome/FGroupLinks";

export default class CGroupHome extends Context {

    public readonly groupId: string|null = null;

    constructor(params: ContextParams) {
        super(params);

        // Check `#leave_group_form` when logged in; fallback to the join chat button otherwise
        this.groupId = document.querySelector<HTMLInputElement>("input[name=groupId]")?.value
            ?? document.querySelector(".joinchat_bg")
                ?.getAttribute("onclick")
                ?.match(/OpenGroupChat\(\s*'(\d+)'/)
                ?.[1]
            ?? null;
    }
}


/**
 * @contentScript
 * @match *://steamcommunity.com/groups/*
 */
export async function run(): Promise<void> {
    const params = await bootstrapLegacy();
    const context = new CGroupHome(params);

    // Don't apply features if there's an error message (e.g. non-existent group)
    const hasFeatures = document.getElementById("message") === null;

    await features(context, [
        ...commonFeatures(),
        ...communityFeatures(),
        ...(hasFeatures ? [
            FFriendsInviteButton,
            FGroupLinks,
        ] : [])
    ]);
}
