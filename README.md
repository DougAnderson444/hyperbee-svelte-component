# hyperbee-svelte-component

Want to use hyperbee in the browser?

Hyperbee bundled into a Svelte Component for use in the browser or other bundlers

# Use

```html

<script>
	import { onMount } from "svelte";
	import HyperbeeComponent from "hyperbee-svelte-component";

	let db
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


```

# Building

Run rollup to build the component

```
npm run build
```

Under the hood it bundles with browserify first (can't get rollup to do it right due to cjs?)

This bundles all the `require('hyperbee')` for you and rolls it into the component.

