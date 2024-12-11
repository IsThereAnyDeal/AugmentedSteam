<script lang="ts">
    import Settings from "@Options/Data/Settings";
    import ProfileLink from "@Content/Modules/Community/ProfileLink.svelte";
    import HTML from "@Core/Html/Html";
    import UrlUtils from "@Core/Utils/UrlUtils";

    export let steamId: string;
    export let clear: boolean;
    export let language: string|undefined; // Add SteamRepCN link if language is Chinese
</script>


{#if (language === "schinese" || language === "tchinese") && Settings.profile_steamrepcn}
    <ProfileLink id="steamrepcn" href="https://steamrepcn.com/profiles/{steamId}">
        {language === "schinese" ? "查看信誉记录" : "確認信譽記錄"}
    </ProfileLink>
{/if}

{#if Settings.profile_steamrep}
    <ProfileLink id="steamrep" href="https://steamrep.com/profiles/{steamId}">SteamRep</ProfileLink>
{/if}

{#if Settings.profile_steamdbcalc}
    <ProfileLink id="steamdbcalc" href="https://steamdb.info/calculator/?player={steamId}">SteamDB</ProfileLink>
{/if}

{#if Settings.profile_steamgifts}
    <ProfileLink id="steamgifts" href="https://www.steamgifts.com/go/user/{steamId}">SteamGifts</ProfileLink>
{/if}

{#if Settings.profile_steamtrades}
    <ProfileLink id="steamtrades" href="https://www.steamtrades.com/user/{steamId}">SteamTrades</ProfileLink>
{/if}

{#if Settings.profile_bartervg}
    <ProfileLink id="bartervg" href="https://barter.vg/steam/{steamId}">Barter.vg</ProfileLink>
{/if}

{#if Settings.profile_astats}
    <ProfileLink id="astats" href="https://www.achievementstats.com/index.php?action=profile&playerId={steamId}">
        Achievement Stats
    </ProfileLink>
{/if}

{#if Settings.profile_backpacktf}
    <ProfileLink id="backpacktf" href="https://backpack.tf/profiles/{steamId}">Backpack.tf</ProfileLink>
{/if}

{#if Settings.profile_astats}
    <ProfileLink id="astatsnl" href="https://astats.astats.nl/astats/User_Info.php?steamID64={steamId}">
        Astats.nl
    </ProfileLink>
{/if}

{#each Settings.profile_custom_link as customLink}
    {#if customLink.enabled}
        {@const href = UrlUtils.escapeUserUrl(customLink.url, {"ID": steamId})}
        {#if href}
            <ProfileLink
                    id="custom"
                    {href}
                    iconUrl={customLink.icon ? HTML.formatUrl(customLink.icon) : undefined}>
                {customLink.name}
            </ProfileLink>
        {/if}
    {/if}
{/each}

{#if clear}
    <div style="clear: both;"></div>
{/if}
