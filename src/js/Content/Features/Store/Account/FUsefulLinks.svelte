<script lang="ts">
    import {L} from "@Core/Localization/Localization";
    import {__externalFunds, __manageWebapiKey, __shoppingCartHistory, __steamCloudSaves} from "@Strings/_strings";
</script>


<div class="account_setting_block_short">
    <div class="account_setting_sub_block_long">
        <ul>
            <li><a class="account_manage_link" href="https://help.steampowered.com/accountdata/AccountSpend">{L(__externalFunds)}</a></li>
            <li><a class="account_manage_link" href="https://help.steampowered.com/accountdata/ShoppingCartHistory">{L(__shoppingCartHistory)}</a></li>
        </ul>

        <ul>
            <li><a class="account_manage_link" href="https://steamcommunity.com/dev/apikey">{L(__manageWebapiKey)}</a></li>
            <li><a class="account_manage_link" href="https://store.steampowered.com/account/remotestorage">{L(__steamCloudSaves)}</a></li>
        </ul>
    </div>
</div>


<style>
    .account_setting_sub_block_long {
        display: grid;
        grid-template-columns: 1fr 1fr;
    }

    ul, li {
        list-style-type: none;
    }
</style>