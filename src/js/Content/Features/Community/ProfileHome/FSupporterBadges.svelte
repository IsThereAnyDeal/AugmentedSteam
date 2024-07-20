<script lang="ts">
    import ExtensionResources from "@Core/ExtensionResources";
    import Config from "config";
    import type {TProfileData} from "@Background/Modules/AugmentedSteam/_types";
    import {L} from "@Core/Localization/Localization";
    import {__esSupporter} from "@Strings/_strings";

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
