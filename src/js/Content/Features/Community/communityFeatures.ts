import type Context from "@Content/Modules/Context/Context";
import type Feature from "@Content/Modules/Context/Feature";
import FConfirmDeleteComment from "@Content/Features/Community/FConfirmDeleteComment";

export default function communityFeatures(): Array<typeof Feature<Context>> {
    return [
        FConfirmDeleteComment,
// FIXME        FHideSpamComments,
// FIXME        FFavoriteEmoticons,
    ]
}
