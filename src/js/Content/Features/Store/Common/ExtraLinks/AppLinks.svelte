<script lang="ts">
    import HTML from "@Core/Html/Html";
    import {L} from "@Core/Localization/Localization";
    import {__viewOnWebsite, __wikiArticle, __youtubeGameplay, __youtubeReviews} from "@Strings/_strings";
    import Settings from "@Options/Data/Settings";
    import ExtraLink from "@Content/Features/Store/Common/ExtraLinks/ExtraLink.svelte";
    import CommonExtraLinks from "@Content/Features/Common/CommonExtraLinks.svelte";
    import UrlUtils from "@Core/Utils/UrlUtils";

    export let appid: number;
    export let communityAppid: number;
    export let appName: string = "";
</script>


<CommonExtraLinks type="app" gameid={appid} />

{#if Settings.showsteamcardexchange}
    <ExtraLink href="https://www.steamcardexchange.net/index.php?gamepage-appid-{communityAppid}/" icon="cardexchange_btn">
        {L(__viewOnWebsite, {"website": "Steam Card Exchange"})}
    </ExtraLink>
{/if}

{#if Settings.showprotondb}
    <ExtraLink href="https://www.protondb.com/app/{appid}/" icon="protondb_btn">
        {L(__viewOnWebsite, {"website": "ProtonDB"})}
    </ExtraLink>
{/if}

{#if Settings.showcompletionistme}
    <ExtraLink href="https://completionist.me/steam/app/{appid}/" icon="completionistme_btn">
        {L(__viewOnWebsite, {"website": "Completionist.me"})}
    </ExtraLink>
{/if}

{#if Settings.showpcgw}
    <ExtraLink href="https://pcgamingwiki.com/api/appid.php?appid={appid}" icon="pcgw_btn">
        {L(__wikiArticle, {"pcgw": "PCGamingWiki"})}
    </ExtraLink>
{/if}

{#if appName}
    {#if Settings.showtwitch}
        <ExtraLink href="https://www.twitch.tv/directory/game/{encodeURIComponent(appName)}" icon="twitch_btn">
            {L(__viewOnWebsite, {"website": "Twitch"})}
        </ExtraLink>
    {/if}

    {#if Settings.showyoutube}
        <ExtraLink href="https://www.youtube.com/results?search_query={encodeURIComponent(appName)}" icon="as_youtube_btn">
            {L(__viewOnWebsite, {"website": "YouTube"})}
        </ExtraLink>
    {/if}

    {#if Settings.showyoutubegameplay}
        <ExtraLink href="https://www.youtube.com/results?search_query={encodeURIComponent(`${appName} \"PC\" Gameplay`)}" icon="as_youtube_btn">
            {L(__youtubeGameplay)}
        </ExtraLink>
    {/if}

    {#if Settings.showyoutubereviews}
        <ExtraLink href="https://www.youtube.com/results?search_query={encodeURIComponent(`${appName} \"PC\" Review`)}" icon="as_youtube_btn">
            {L(__youtubeReviews)}
        </ExtraLink>
    {/if}
{/if}

{#each Settings.app_custom_link as link}
    {#if link.enabled}
        {@const href = UrlUtils.escapeUserUrl(link.url, {"NAME": appName, "ID": String(appid)})}
        {#if href}
            <ExtraLink {href}
                       iconUrl={link.icon ? HTML.formatUrl(link.icon) : null}>
                {L(__viewOnWebsite, {"website": link.name})}
            </ExtraLink>
        {/if}
    {/if}
{/each}
