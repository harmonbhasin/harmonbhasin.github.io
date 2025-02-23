<script lang="ts">
	import { formatDate } from '$lib/utils'

	let { data } = $props()
	console.log(data)
</script>

<svelte:head>
	<title>{data.meta.title}</title>
	<meta property="og:type" content="article" />
	<meta property="og:title" content={data.meta.title} />
</svelte:head>

<article class="max-w-2xl mx-auto px-4 py-12">
	<hgroup class="mb-8">
		<h1 class="text-4xl font-bold text-gray-900 mb-4">{data.meta.title}</h1>
		<p class="text-sm text-gray-600">Published on {formatDate(data.meta.date)}</p>
	</hgroup>

	<div class="flex gap-2 mb-12">
		{#each data.meta.categories as category}
			<span class="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors">
				#{category}
			</span>
		{/each}
	</div>

	<div class="prose prose-lg max-w-none">
		<data.content />
	</div>
</article>