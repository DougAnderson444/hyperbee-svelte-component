# hyperbee-svelte-component

Want to use hyperbee in the browser?

Hyperbee bundled into a Svelte Component for use in the browser or other bundlers

# Use

```html

<script>
    import Hyperbee from "hyperbee-svelte-component";

    //stores
    import {
        hyperprotocolNode 
        // any node that has a corestore and corestore-networker available to it
        // the author uses hypnsNode from 
    } from "../js/stores.js";

    let feed;
    let display = true; // if you want to display the verbose; defaults to false

    $: hyperprotocolNode ? open() : null;

    const open = async () => {
        feed = $hyperprotocolNode.store.get({ name: "some-random-feed-name" });
        await feed.ready();
        $hyperprotocolNode.swarmNetworker.configure(feed.discoveryKey, {
            announce: true,
            lookup: true,
        });
    };
</script>

{#if feed}
    <Hyperbee {feed} {display} />
{:else}
    No feed of bee yet.
{/if}

```

# Building

## Step 1

Bundle with browserify (can't get rollup to do it)

```
npm run build:browserify
```

This bundles all the `require('hyperbee')` for you.

## Step 2

Run rollup to build the component

```
npm run build
```
