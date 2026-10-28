<script lang="ts">
    import {L} from "@Core/Localization/Localization";
    import {__readReviews} from "@Strings/_strings";

    interface Props {
        standalone: boolean,
        score: number|null,
        award: string|null,
        url: string
    }

    let { standalone, score, award, url }: Props = $props();

    let lc_award = $derived(award?.toLowerCase() ?? "");
</script>

{#snippet review()}
    <div class="container">
        <div class={[
            "score", {
                mighty: lc_award === "mighty",
                strong: lc_award === "strong",
                fair: lc_award === "fair",
                weak: lc_award === "weaky"
            }
        ]}>{score ?? "--"}</div>
        <div class="logo"></div>
        <div>
            <div class="label">OpenCritic</div>
            <div>{award} - <a href="{url}?utm_source=augmented-steam-itad&utm_medium=average" target="_blank">{L(__readReviews)}</a>
                <img src="https://store.cloudflare.steamstatic.com/public/images/ico/iconExternalLink.gif" alt="External link">
            </div>
        </div>
    </div>
{/snippet}

{#if standalone}
    <div class="block responsive_apppage_reviewblock"> <!-- steam classes -->
        {@render review()}
    </div>
{:else}
    {@render review()}
{/if}


<style>
    .container {
        clear: both;
        display: flex;
        align-items: center;

        &:not(:first-child) {
            padding-top: 6px;
        }
    }

    .score {
        width: 50px;
        height: 50px;
        line-height: 50px;
        font-family: Arial, Helvetica, sans-serif;
        color: #ffffff;
        font-size: 25px;
        text-align: center;

        &.mighty { background: #fc430a; }
        &.strong { background: #9e00b4; }
        &.fair   { background: #4aa1ce; }
        &.weak   { background: #80b06a; }
    }

    .logo {
        background-image: url("extension://img/opencritic.png");
        background-repeat: no-repeat;
        height: 35px;
        width: 35px;
        margin: 0 2px 0 10px;
    }

    .label {
        font-family: "Motiva Sans", Sans-serif;
        font-weight: bold;
        color: #ffffff;
        font-size: 26px;
        line-height: 26px;
    }
</style>