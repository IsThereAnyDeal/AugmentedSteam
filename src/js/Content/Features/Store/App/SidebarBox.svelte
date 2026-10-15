<script lang="ts">
    import type {Snippet} from "svelte";

    interface Props {
        title: string,
        children: Snippet
    }

    let { title, children }: Props = $props();
</script>

<div class="block responsive_apppage_details_right heading">{title}</div>
<div class="block underlined_links">
    <div class="block_content">
        <div class="block_content_inner">
            {@render children()}
        </div>
    </div>
</div>