<script lang="ts">
    import {
        __all,
        __groups_actionGroups,
        __groups_leave,
        __groups_select,
        __groups_selected,
        __inverse,
        __none
    } from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";
    import Messenger from "@Content/Modules/Messaging/Messenger";
    import {MessageHandler} from "@Content/Modules/Messaging/MessageHandler";

    interface Props {
        onleave: () => void
    }

    let { onleave }: Props = $props();

    function onall(){
        Messenger.call(MessageHandler.GroupsManager, "selectAll");
    }

    function onnone() {
        Messenger.call(MessageHandler.GroupsManager, "selectNone");
    }

    function oninverse() {
        Messenger.call(MessageHandler.GroupsManager, "selectInverse");
    }
</script>


<!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
<div id="manage_friends" class="manage_friends_panel">
    <div class="row">{L(__groups_actionGroups)}
        <span class="row">
            <span class="dimmed">{L(__groups_select)}</span>
            <span class="selection_type" onclick={onall}>{L(__all)}</span>
            <span class="selection_type" onclick={onnone}>{L(__none)}</span>
            <span class="selection_type" onclick={oninverse}>{L(__inverse)}</span>
        </span>
    </div>
    <div class="row">
        <div class="manage_friend_actions_ctn">
            <span class="manage_action btnv6_lightblue_blue btn_small" onclick={onleave}>
                <span>{L(__groups_leave)}</span>
            </span>
        </div>
        <span id="selected_msg_err" class="selected_msg error hidden"></span>
    </div>
</div>