<script>
	import { onMount } from "svelte";
	// import { default as HyperbeeComponent } from "../../";
	import HyperbeeComponent from "hyperbee-svelte-component";

	let db;
	let opts = { keyEncoding: "utf-8", valueEncoding: "utf-8" };
	let feed;
	let display = true; // if you want to debug the component, default: false

	onMount(async () => {
		feed = store.get({ key }); // get a hypercore feed from a corestore or hyperspace instance
	});
</script>

<main>
	{#if feed}
		<HyperbeeComponent {feed} {opts} {display} bind:db />
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
