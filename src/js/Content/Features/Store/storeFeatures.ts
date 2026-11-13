import FAlternativeLinuxIcon from "@Content/Features/Store/Common/FAlternativeLinuxIcon";
import FSkipGotSteamDialog from "@Content/Features/Store/Common/FSkipGotSteamDialog";
import FRemoveBroadcasts from "@Content/Features/Store/Common/FRemoveBroadcasts";
import type Context from "@Content/Modules/Context/Context";
import type Feature from "@Content/Modules/Context/Feature";
import FSearchSuggestionsDecorations from "@Content/Features/Store/Common/FSearchSuggestionsDecorations";

export default function storeFeatures(): Array<typeof Feature<Context>> {
    return [
        FAlternativeLinuxIcon,
        FSkipGotSteamDialog,
        FRemoveBroadcasts,
        FSearchSuggestionsDecorations
    ]
}
