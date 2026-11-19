<script lang="ts">
    import Modal from "@Core/Modals/Contained/Modal.svelte";
    import {
        __cancel,
        __groups_leave,
        __groups_leaveAdminConfirm_currentlyAdmin,
        __groups_leaveAdminConfirm_wantToLeave, __ok
    } from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";

    interface Props {
        id: string,
        name: string,
        onconfirm: () => void,
        oncancel: () => void
    }

    let {id, name, onconfirm, oncancel}: Props = $props();
</script>


<Modal title={L(__groups_leave)} buttons={{
    primary: L(__ok),
    cancel: L(__cancel)
}} onprimary={onconfirm} {oncancel}>
    <div class="admin">
        {L(__groups_leaveAdminConfirm_currentlyAdmin, { name })}
    </div>

    <div>
        <a href="/gid/{id}" target="_blank">{name}</a>
    </div>
    <div>
        {L(__groups_leaveAdminConfirm_wantToLeave)}
    </div>
</Modal>


<style>
    .admin {
        margin-bottom: 30px;
        font-size: 21px;
        color: #d72e2e;
    }

    a:hover {
        text-decoration: underline;
    }
</style>