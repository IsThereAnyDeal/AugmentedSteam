<script lang="ts">
    import {L} from "@Core/Localization/Localization";
    import {
        __cancel,
        __export_copyClipboard,
        __export_download,
        __export_format,
        __export_text,
        __export_type,
        __export_wishlist,
        __loading,
        __wait
    } from "@Strings/_strings";
    import {slide} from "svelte/transition";
    import {createEventDispatcher} from "svelte";
    import Modal from "@Core/Modals/Contained/Modal.svelte";
    import Clipboard from "@Content/Modules/Clipboard";
    import Downloader from "@Core/Downloader";
    import {
        ExportMethod,
        type WishlistData,
        WishlistExporter
    } from "@Content/Features/Store/Wishlist/Utils/WishlistExporter";
    import {EModalAction} from "@Core/Modals/Contained/EModalAction";
    import BlockingWaitDialog from "@Core/Modals/BlockingWaitDialog";
    import ServiceFactory from "@Protobufs/ServiceFactory";
    import type UserInterface from "@Core/User/UserInterface";
    import Long from "long";
    import {StoreItemID} from "@Protobufs/Compiled/proto.bundle";
    import type Language from "@Core/Localization/Language";
    import ProtobufUtils from  "@Protobufs/ProtobufUtils";

    const dispatch = createEventDispatcher<{
        close: void
    }>();

    export let language: Language;
    export let user: UserInterface;
    export let type: "text"|"json" = "text";
    export let format: string = "%title%";

    let input: HTMLInputElement;

    function add(value: string): void {
        if (!input) { return; }
        format = input.value;

        if (input.selectionStart !== null) {
            const selection = input.selectionStart;
            if (input.selectionEnd && selection !== input.selectionEnd) {
                format = format.slice(0, selection) + format.slice(input.selectionEnd);
            }
            format = format.slice(0, selection) + value + format.slice(selection);
            input.selectionStart = selection + value.length;
        } else {
            format = format + value;
            input.selectionStart = format.length;
        }
        input.selectionEnd = input.selectionStart;
        input.focus();
    }

    async function loadWishlist(): Promise<WishlistData> {
        let data: WishlistData = [];

        const wishlistService = ServiceFactory.WishlistService(user);
        const storeService = ServiceFactory.StoreBrowseService(user);

        const wishlist = await wishlistService.getWishlist({
            steamid: Long.fromString(user.steamId)
        });

        const chunkSize = 50;
        for (let i=0; i <= wishlist.items.length; i += chunkSize) {
            const chunk = wishlist.items.slice(i, i+chunkSize).map(item => new StoreItemID({
                appid: item.appid
            }));

            const items = await storeService.getItems({
                context: {
                    language: language.name,
                    countryCode: user.storeCountry,
                    steamRealm: 1
                },
                dataRequest: {
                    includeBasicInfo: true,
                    includeRelease: true
                },
                ids: chunk
            });

            for (let item of items.storeItems) {
                data.push({
                    appid: item.id!,
                    name: item.name!,
                    releaseDate: item.release?.steamReleaseDate ?? null,
                    price: ProtobufUtils.getNumber(
                        item.bestPurchaseOption?.finalPriceInCents ?? null
                    ),
                    basePrice: ProtobufUtils.getNumber(
                           item.bestPurchaseOption?.originalPriceInCents
                        ?? item.bestPurchaseOption?.finalPriceInCents
                        ?? null
                    ),
                    discount: item.bestPurchaseOption?.discountPct ?? null,
                });
            }
        }
        return data;
    }

    async function handleButton(e: CustomEvent<EModalAction>): Promise<void> {
        const response = e.detail;
        if (response === EModalAction.Cancel) {
            dispatch("close");
            return;
        }

        const method = response === EModalAction.OK
            ? ExportMethod.download
            : ExportMethod.copy;

        const wait = new BlockingWaitDialog(L(__wait), () => L(__loading));
        await wait.update();
        const wishlistData = await loadWishlist();
        wait.dismiss();

        const wishlist = new WishlistExporter(wishlistData);

        let data = "";
        let filename = "";
        let filetype = "";
        if (type === "json") {
            data = await wishlist.toJson();
            filename = "wishlist.json";
            filetype = "application/json";
        } else if (type === "text" && format) {
            data = await wishlist.toText(format);
            filename = "wishlist.txt";
            filetype = "text/plain";
        }

        if (method === ExportMethod.copy) {
            Clipboard.set(data);
        } else if (method === ExportMethod.download) {
            Downloader.download(new Blob([data], {"type": `${filetype};charset=UTF-8`}), filename);
        }
    }
</script>


<Modal title={L(__export_wishlist)}
       buttons={{
           primary: L(__export_download),
           secondary: L(__export_copyClipboard),
           cancel: L(__cancel)
       }}
       on:button={handleButton}>

    <div class="as_wexport_container">
        <div class="as_wexport">
            <h2>{L(__export_type)}</h2>
            <div class="as_wexport_buttons">
                <label><input type="radio" value="text" bind:group={type} on:change> {L(__export_text)}</label>
                <label><input type="radio" value="json" bind:group={type} on:change> JSON</label>
            </div>
        </div>

        {#if type === "text"}
            <div class="as_wexport" transition:slide={{axis: "y", duration: 200}}>
                <h2>{L(__export_format)}</h2>
                <div>
                    <input type="text" bind:value={format} bind:this={input} on:change>
                    <div class="as_wexport_symbols">
                        {#each ["%title%", "%id%", "%appid%", "%url%", "%release_date%", "%price%", "%discount%", "%base_price%", "%note%"] as str, index}
                            {#if index > 0}, {/if}
                            <button type="button" on:click={() => add(str)}>{str}</button>
                        {/each}
                    </div>
                </div>
            </div>
        {/if}
    </div>
</Modal>


<style>
    .as_wexport_container {
        width: 580px;
    }
    .as_wexport {
        margin-bottom: 30px;
    }
    .as_wexport_buttons {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 30px
    }
    .as_wexport_symbols {
        margin-top: 2px;
        font-size: 11px;
    }

    label {
        display: inline-flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 15px;
        border-radius: 8px;
        border: 1px solid #333643;
        text-align: left;
        cursor: pointer;
    }
    label:hover {
        color: white;
        border-color: white;
    }
    label:has(input[type=radio]:checked) {
        color: white;
        border-color: #1a97ff;
    }
    label input[type=radio] {
        display: none;
    }

    input[type=text] {
        width: 100%;
        color: #b9bfc6;
        background-color: #313c48;
        box-shadow: 1px 1px 0 rgba(0,0,0,0.2) inset;
        border-radius: 3px;
        font-size: 12px;
        padding: 10px;
        border: none;
        box-sizing: border-box;
    }

    button {
        background: inherit;
        border: 0;
        outline: 0;
        padding: 0;
        color: #acb2b8;
        cursor: pointer;
    }
    button:hover {
        text-decoration: underline;
        color: white;
    }
</style>
