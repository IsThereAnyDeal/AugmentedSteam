<script lang="ts" context="module">
    import self_ from "./FCommunityAppPageLinks.svelte";
    import Feature from "@Content/Modules/Context/Feature";
    import type CApp from "@Content/Features/Community/App/CApp";

    export class FCommunityAppPageLinks extends Feature<CApp> {

        private node: HTMLElement | null = null;

        public override checkPrerequisites(): boolean {
            return (Settings.showsteamdb || Settings.showitadlinks || Settings.showbartervg)
                && (this.node = document.querySelector(".apphub_OtherSiteInfo")) !== null
                && this.context.appid !== null;
        }

        public override apply(): void {
            const node = this.node!;
            (new self_({
                "target": node,
                "props": {
                    appid: this.context.appid!
                },
            }));
        }
    }
</script>

<script lang="ts">
    import SteamMediumButton from "../../../SteamMediumButton.svelte";
    import Settings from "@Options/Data/Settings";

    export let appid: number;
</script>


{#if Settings.showsteamdb}
    <SteamMediumButton icon="steamdb_ico" href="https://steamdb.info/app/{appid}/">SteamDB</SteamMediumButton>
{/if}

{#if Settings.showitadlinks}
    <SteamMediumButton icon="itad_ico" href="https://isthereanydeal.com/steam/app/{appid}/">ITAD</SteamMediumButton>
{/if}

{#if Settings.showbartervg}
    <SteamMediumButton icon="bartervg_ico" href="https://barter.vg/steam/app/{appid}/">Barter.vg</SteamMediumButton>
{/if}
