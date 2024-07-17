<script lang="ts">
    import type {TProfileData} from "@Background/Modules/AugmentedSteam/_types";
    import ExtensionResources from "@Core/ExtensionResources";
    import external from "@Content/externalLink";

    // Build reputation images regexp
    const repImgs: Array<[string, RegExp, string]> = [
        ["banned", /scammer|banned/i, "bad"],
        ["caution", /caution/i, "caution"],
        ["donate", /donator/i, "neutral"],
        ["okay", /admin|middleman/i, "good"],
        ["valve", /valve admin/i, "good"],
    ];

    export let steamId: string;
    export let steamrep: TProfileData['steamrep'];
</script>


<a id="es_steamrep" href="https://steamrep.com/profiles/{steamId}" use:external>
    {#each steamrep as value}
        {#each repImgs as [img, regex, status]}
            {#if regex.test(value)}
                <div class={status}><img src={ExtensionResources.getURL(`img/sr/${img}.png`)} alt={status}>
                    <span>{value}</span>
                </div>
            {/if}
        {/each}
    {/each}
</a>
