<script lang="ts" context="module">
    import self_ from "./FSteamRep.svelte";
    import Feature from "@Content/Modules/Context/Feature";
    import type CProfileHome from "@Content/Features/Community/ProfileHome/CProfileHome";
    import Settings from "@Options/Data/Settings";
    import ExtensionResources from "@Core/ExtensionResources";

    export class FSteamRep extends Feature<CProfileHome> {

        override async checkPrerequisites(): Promise<boolean> {
            if (!Settings.showsteamrepapi) {
                return false;
            }

            const result = await this.context.data;
            return result !== null && result.steamrep && result.steamrep.length > 0;
        }

        override async apply(): Promise<void> {

            const steamrep = ((await this.context.data)?.steamrep ?? [])
                .map(r => r.trim())
                .filter(r => r !== "");

            if (steamrep.length === 0) {
                return;
            }

            const target = document.querySelector<HTMLElement>(".profile_rightcol");
            if (target) {
                (new self_({
                    target,
                    anchor: target.firstElementChild ?? undefined,
                    props: {
                        steamId: this.context.steamId!,
                        steamrep
                    }
                }));
            }
        }
    }
</script>


<script lang="ts">
    import type {TProfileData} from "@Background/Modules/AugmentedSteam/_types";

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


<a id="es_steamrep" href="https://steamrep.com/profiles/{steamId}" target="_blank">
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
