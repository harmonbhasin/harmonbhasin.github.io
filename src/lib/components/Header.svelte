<!-- Header.svelte -->
<script>
	import { base } from '$app/paths';
</script>

<header class="bg-white shadow-sm">
	<nav class="max-w-2xl mx-auto px-4 py-4">
		<ul class="flex gap-6">
			<li>
				<a 
					href={`${base}/`} 
					class="text-gray-700 hover:text-gray-900 transition-colors font-medium"
				>
					Home
				</a>
			</li>
			<li>
				{#if false}
					<a 
						href="/blog" 
						class="text-gray-700 hover:text-gray-900 transition-colors font-medium"
					>
						Blog
					</a>
				{/if}
			</li>
		</ul>
	</nav>
</header>