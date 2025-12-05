<script lang="ts">
    import {L} from "@Core/Localization/Localization";
    import {__loginWarning} from "@Strings/_strings";
    import Warning from "@Content/Modules/Widgets/AugmentedSteam/Components/Warning.svelte";
    import LocalStorage from "@Core/Storage/LocalStorage";

    interface Props {
        react: boolean;
        page: "store"|"community";
        onclose: () => void;
    }

    let { react, page, onclose }: Props = $props();

    let host: string = $derived.by(() => {
        switch(page) {
            case "store": return "store.steampowered.com";
            case "community": return "steamcommunity.com";
            default: throw new Error();
        }
    });

    function handleClose(): void {
        if (page === "store") {
            LocalStorage.set(`hide_login_warn_store`, true);
        } else if (page === "community") {
            LocalStorage.set(`hide_login_warn_community`, true);
        }
        onclose();
    }
</script>


<Warning {react} onclose={handleClose} onhide={onclose}>
    {@html L(__loginWarning, {"link": `<a href="https://${host}/login/">${host}</a>`})}
</Warning>


