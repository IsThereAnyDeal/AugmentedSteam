<script lang="ts">
    import Modal from "@Core/Modals/Contained/Modal.svelte";
    import {
        __userNote_closeOnStorage, __userNote_closeOnStorageDesc,
        __userNote_notEnoughSpace, __userNote_notEnoughSpaceDesc,
        __userNote_saveLocal,
        __userNote_saveSyncedStorage,
        __userNote_storageWarningDesc
    } from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";

    interface Props {
        exceeded: boolean,
        ratio: number,
        onconfirm: () => void,
        oncancel: () => void,
    }

    let { exceeded, ratio, onconfirm, oncancel }: Props = $props();
</script>


<Modal title={L(exceeded ? __userNote_notEnoughSpace : __userNote_closeOnStorage)} buttons={{
    primary: L(__userNote_saveLocal),
    cancel: L(__userNote_saveSyncedStorage)
}} onprimary={onconfirm} {oncancel}>
    <div>
        {L(exceeded ? __userNote_notEnoughSpaceDesc : __userNote_closeOnStorageDesc, {perc: (ratio * 100).toFixed(0)})}
        <br>
        {L(__userNote_storageWarningDesc)}
    </div>
</Modal>


<style>
    div {
        max-width: 800px;
    }
</style>