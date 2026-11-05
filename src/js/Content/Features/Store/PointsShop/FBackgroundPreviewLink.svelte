<script lang="ts">
    import {L} from "@Core/Localization/Localization";
    import {__previewBackground} from "@Strings/_strings";
    import type UserInterface from "@Core/User/UserInterface";

    interface Props {
        user: UserInterface,
        bg: string
    }

    let {user, bg}: Props = $props();
</script>


<div id="as-preview-bg">
    <a target="_blank" href="{user.profileUrl}#previewBackground/{bg}">
        {L(__previewBackground)}
    </a>
</div>


<style>
    div {
        align-self: center;
        flex-grow: 1;
        text-align: left;
    }
    a {
        color: #efeaea;
        background-image: linear-gradient(#3d4450,#3d4450),none;
        background-position: 0 0,0 0;
        background-repeat: repeat,repeat;
        background-size: 330% 100%;
        background-attachment: scroll,scroll;
        background-origin: padding-box,padding-box;
        background-clip: border-box,border-box;
        border-radius: 2px;
        min-width: 100px;
        padding: 10px 20px;
        font-size: 18px;
        margin-left: 0;

        &:hover {
            color: #fff;
            background: #464d58;
        }
    }
</style>