<script lang="ts">
	import { formatDate } from '$lib/utils'
	import * as config from '$lib/config'

	let { data } = $props()
</script>

<svelte:head>
	<title>Blog</title>
</svelte:head>

<section class="max-w-2xl mx-auto px-4 py-12">
	<ul class="space-y-8">
		{#each data.posts as post}
			<li class="border-b border-gray-200 pb-8 last:border-b-0 last:pb-0">
				<a href={`/blog/${post.slug}`} class="text-3xl font-bold text-gray-900 capitalize hover:text-blue-600">
					{post.title}
				</a>
				<p class="text-sm text-gray-600 mt-2">{formatDate(post.date)}</p>
				<p class="text-gray-600 mt-3 leading-relaxed">{post.description}</p>
			</li>
		{/each}
	</ul>
</section>