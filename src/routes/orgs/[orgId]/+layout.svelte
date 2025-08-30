<div>
	<header class="flex items-center justify-between border-b">
		<div class="w-full max-w-screen-xl mx-auto flex items-center justify-between p-4">
			<a href="/" class="flex items-center gap-2 font-medium">
				<div class="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
					<svg
						class="size-4"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width={2}
							d="M13 10V3L4 14h7v7l9-11h-7z"
						/>
					</svg>
				</div>
				NanoBrand
			</a>
		</div>
	</header>

	<svelte:boundary>
		<main>
			<div class="w-full max-w-screen-xl mx-auto p-4">
				{@render children?.()}
			</div>
		</main>

		{#snippet pending()}
			<div class="flex h-64 items-center justify-center">
				<div class="text-center">
					<div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
					<p class="text-muted-foreground">Loading...</p>
				</div>
			</div>
		{/snippet}
	</svelte:boundary>
</div>
