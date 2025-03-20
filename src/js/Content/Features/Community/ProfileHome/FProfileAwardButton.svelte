<script lang="ts">
	import { __giveAward } from "@Strings/_strings";
	import { L } from "@Core/Localization/Localization";
</script>

<a class="popup_menu_item es_award_button" id="es_award" role="button">
	<img
		src="//community.fastly.steamstatic.com/public/shared/images/award_icon.svg"
		alt="Steam Community Award Icon"
	/>&nbsp; {L(__giveAward)}
</a>

<style>
	.es_award_button img {
		top: 5px !important;
	}
</style>
