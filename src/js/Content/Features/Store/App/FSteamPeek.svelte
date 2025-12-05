<script lang="ts">
    import AugmentedSteamApiFacade from "@Content/Modules/Facades/AugmentedSteamApiFacade";
    import {onMount} from "svelte";
    import ServiceFactory from "@Protobufs/ServiceFactory";
    import type UserInterface from "@Core/User/UserInterface";
    import {__moreOnSteampeek} from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";

    type TSimilarGames = Array<{
        appid: number,
        title: string,
        asset: string|null,
        purchase: string|null
    }>;

    export let user: UserInterface;
    export let language: string;
    export let appid: number;

    let promise: Promise<TSimilarGames> = new Promise(() => {});

    onMount(() => {
        promise = (async () => {
            let steampeek = await AugmentedSteamApiFacade.fetchSteamPeek(appid);
            steampeek = steampeek.slice(0, 8);

            const steamResponse = await ServiceFactory.StoreBrowseService(user).getItems({
                context: {
                    language,
                    countryCode: user.storeCountry
                },
                dataRequest: {
                    includeBasicInfo: false,
                    includeAssets: true,
                },
                ids: steampeek.map(item => { return {
                    appid: item.appid
                }})
            });

            const steamMap = new Map(
                steamResponse.storeItems.map(item => {
                    return [item.appid, {
                        asset: item.assets?.header ?? null,
                        purchase: item.bestPurchaseOption?.formattedFinalPrice ?? null
                    }]
                })
            );

            return steampeek.map(item => {
                const steam = steamMap.get(item.appid);
                return {
                    appid: item.appid,
                    title: item.title,
                    asset: steam?.asset ?? null,
                    purchase: steam?.purchase ?? null,
                }
            });
        })();
    });
</script>


{#await promise then data}
    <section id="steampeek">
        <header>
            <div>Steampeek</div>

            <a href="https://steampeek.hu/app/{appid}">{L(__moreOnSteampeek)}</a>
        </header>

        <ul>
            {#each data as item (item.appid)}
                <li>
                    <a href="/app/{item.appid}/" data-ds-appid={appid}>
                        <img src="https://shared.fastly.steamstatic.com//store_item_assets/steam/apps/{item.appid}/{item.asset}" alt="{item.title} banner" />
                        <div class="buy">{item.purchase ?? "--"}</div>
                    </a>
                </li>
            {/each}
        </ul>
    </section>
{/await}


<style>
    section {
        background: radial-gradient(62.67% 62.67% at 62.67% 100%, rgba(255, 255, 255, 0.15) 0%, rgba(116, 133, 140, 0.15) 100%);
        padding: 16px;
        border-radius: 5px;
        margin-bottom: 20px;
    }

    header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;

        & div {
            font-size: 16px;
            text-transform: uppercase;
            font-family: "Motiva Sans",Arial,Helvetica,sans-serif;
            letter-spacing: 1px;
        }

        & a {
            position: relative;
            border-radius: 2px;
            display: inline-block;
            text-decoration: none;
            color: #66c0f4;
            background: #212c3d;
            padding: 0 15px;
            font-size: 15px;
            line-height: 30px;
            transition: background-color 0.2s ease-out;
        }
        & a:hover {
            background: #66c0f4;
            color: white;
        }
    }


    ul {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 12px;
    }
    li {
        list-style-type: none;
        border-radius: 3px;
        overflow: hidden;
    }

    li a {
        display: block;
    }

    img {
        display: block;
        width: 100%;

        &::before {
            display: none;
        }
    }

    .buy {
        background-color: #000;
        font-family: "Motiva Sans",Arial,Helvetica,sans-serif;
        color: #fff;
        height: 38px;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        white-space: nowrap;
        padding: 5px 8px;
    }
</style>