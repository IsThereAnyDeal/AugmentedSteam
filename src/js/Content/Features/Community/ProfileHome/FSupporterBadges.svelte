<script lang="ts" context="module">
    import self_ from "./FSupporterBadges.svelte";
    import {__esSupporter} from "@Strings/_strings";
    import Config from "../../../../config";
    import {L} from "@Core/Localization/Localization";
    import Feature from "@Content/Modules/Context/Feature";
    import type CProfileHome from "@Content/Features/Community/ProfileHome/CProfileHome";
    import type {TProfileData} from "@Background/Modules/AugmentedSteam/_types";

    export class FSupporterBadges extends Feature<CProfileHome> {

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
</script>


<script lang="ts">
    import ExtensionResources from "@Core/ExtensionResources";

    export let badges: TProfileData["badges"];
</script>


<div class="profile_badges" id="es_supporter_badges">
    <div class="profile_count_link">
        <a href={Config.PublicHost}>
            <span class="count_link_label">{L(__esSupporter)}</span>&nbsp;
            <span class="profile_count_link_total">{badges.length}</span>
        </a>
    </div>
    <div class="profile_count_link_preview">

        {#each badges as badge}
            {@const img = ExtensionResources.getURL(`/img/badges/${badge.img}`)}

            {#if badge.link}
                <div class="profile_badges_badge" data-tooltip-html="Augmented Steam<br>{badge.title}">
                    <a href={badge.link}><img class="badge_icon small" src={img} alt="" /></a>
                </div>
            {:else}
                <div class="profile_badges_badge" data-tooltip-html="Augmented Steam<br>{badge.title}">
                    <img class="badge_icon small" src={img} alt="" />
                </div>
            {/if}
        {/each}

    </div>
</div>
