<script lang="ts">
    import {__userScore, __userScoreReviews} from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";

    interface Props {
        score: number,
        url: string
    }

    let { score, url }: Props = $props();
</script>


<div class="container">
    <div class={["score", {
        high: score >= 75,
        medium: score < 75 && score >= 50,
        low: score < 50
    }]}>{score}</div>
    <div class="logo"></div>
    <div>
        <div class="label">{L(__userScore)}</div>
        <div>
            <a href={url} target="_blank">{L(__userScoreReviews)}</a>
            <img src="https://store.fastly.steamstatic.com/public/images/ico/iconExternalLink.gif" alt="External link" />
        </div>
    </div>
</div>


<style>
    .container {
        clear: both;
        display: flex;
        align-items: center;
        padding-top: 6px;
    }

    .score {
        width: 50px;
        height: 50px;
        line-height: 50px;
        font-family: Arial, Helvetica, sans-serif;
        color: #ffffff;
        font-size: 25px;
        text-align: center;

        &.high   { background: #66cc33; }
        &.medium { background: #ffcc33; }
        &.low    { background: #ff0000; }
    }

    .logo {
        background-image: url('https://store.steampowered.com/public/images/v6/mc_logo_no_text.png');
        background-repeat: no-repeat;
        height: 35px;
        width: 35px;
        margin: 0 2px 0 10px;
    }

    .label {
        font-family: "Motiva Sans", Sans-serif;
        font-weight: bold;
        color: #ffffff;
        font-size: 26px;
        line-height: 26px;
    }
</style>