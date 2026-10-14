<script lang="ts">
    import {L} from "@Core/Localization/Localization";
    import {__addToWaitlist, __removeFromWaitlistTooltip,} from "@Strings/_strings";
    import WaitlistIcon from "@Content/Icons/WaitlistIcon.svelte";
    import Settings from "@Options/Data/Settings";
    import {onMount} from "svelte";
    import ITADApiFacade from "@Content/Modules/Facades/ITADApiFacade";

    interface Props {
        appid: number,
        storeid: string;
    }

    let { appid, storeid }: Props = $props();

    let waitlisted: boolean = $state(false);
    let loading: boolean = $state(true);

    async function onclick(): Promise<void> {
        if (loading) { return; }

        loading = true;

        try {
            if (waitlisted) {
                await ITADApiFacade.removeFromWaitlist(appid);
            } else {
                await ITADApiFacade.addToWaitlist(appid);
            }
            waitlisted = !waitlisted;
        } catch(e) {
            console.error("FWaitlistToggle", e);
        }

        loading = false;
    }

    onMount(() => {
        (async () => {
            waitlisted = (await ITADApiFacade.inWaitlist([storeid]))[storeid] ?? false;
            loading = false;
        })();
    });
</script>


<div>
    <button type="button" role="button" data-tooltip-text={L(waitlisted ? __removeFromWaitlistTooltip : __addToWaitlist)}
            style:--color={Settings.tag_waitlist_color}
            class={{active: waitlisted}} {onclick}>
        {#if loading}
            <img src="https://community.steamstatic.com/public/images/login/throbber.gif" alt="Loading" />
        {:else}
            <WaitlistIcon />
        {/if}
    </button>
</div>


<style>
    button { /* .btnv6_blue_hoverfade */
        border-radius: 2px;
        border: none;
        padding: 0 15px;
        display: inline-flex;
        align-items: center;
        cursor: pointer;
        text-decoration: none;
        color: #67c1f5;
        background: rgba(103, 193, 245, 0.2);
        height: 32px;
        font-size: 18px;

        &:hover {
            color: white;
            background: linear-gradient(-60deg, #417a9b 5%, #67c1f5 95%);
        }

        & :global(i) {
            position: relative;
            top: 1px;
        }

        &.active {
            background: rgba(103, 193, 245, 0.6);
        }
    }

    img {
        height: 18px;
    }
</style>