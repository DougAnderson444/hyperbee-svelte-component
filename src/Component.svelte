<script>
    import { onMount } from "svelte";
    import { default as getHyperbee } from "./hyperbee-bundle.js";

    export let feed; // put in feed
    export let db; // get db out
    export let display = false;

    onMount(async () => {
        db = getHyperbee({ feed });
    });
</script>

<main>
    {#if display && getHyperbee}
        Hyperbee is available
        <br />
        {feed
            ? feed.key.toString("hex")
            : "Pass a hypercore feed into this component"}
    {:else if display}
        Hyperbee is NOT available
    {/if}
</main>

<style>
    main {
        text-align: center;
        padding: 1em;
        max-width: 240px;
        margin: 0 auto;
    }

    h1 {
        color: #ff3e00;
        text-transform: uppercase;
        font-size: 4em;
        font-weight: 100;
    }

    @media (min-width: 640px) {
        main {
            max-width: none;
        }
    }
</style>
