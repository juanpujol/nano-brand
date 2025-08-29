<script lang="ts">
	import type { Snippet } from 'svelte';
	import ThemeToggle from './theme-toggle.svelte';

	interface Props {
		title: string;
		description?: string | Snippet;
		icon: Snippet;
		iconGradient: string;
		backgroundGradient: string;
		children: Snippet;
		onBack?: () => void;
		footer?: Snippet;
		outsideContent?: Snippet;
		titleTestId?: string;
	}

	let {
		title,
		description,
		icon,
		iconGradient,
		backgroundGradient,
		children,
		onBack,
		footer,
		outsideContent,
		titleTestId
	}: Props = $props();
</script>

<div
	class="flex min-h-screen items-center justify-center bg-gradient-to-br {backgroundGradient} relative p-4 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"
>
	<!-- Theme Toggle -->
	<div class="absolute top-4 right-4">
		<ThemeToggle />
	</div>
	<div class="w-full max-w-md">
		<div
			class="rounded-2xl border border-gray-200 bg-white p-8 shadow-xl dark:border-gray-700 dark:bg-gray-800"
		>
			<div class="mb-8 text-center">
				<!-- Back Button -->
				{#if onBack}
					<button
						type="button"
						onclick={onBack}
						class="absolute top-4 left-4 p-2 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
						data-testid="back-button"
						aria-label="Voltar"
					>
						<svg
							class="h-5 w-5"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							role="img"
							aria-label="Voltar"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width={2}
								d="M15 19l-7-7 7-7"
							/>
						</svg>
					</button>
				{/if}

				<!-- Icon -->
				<div
					class="h-16 w-16 bg-gradient-to-r {iconGradient} mx-auto mb-4 flex items-center justify-center rounded-2xl"
				>
					{@render icon()}
				</div>

				<!-- Title & Description -->
				<h1 class="mb-2 text-2xl font-bold text-gray-900 dark:text-white" data-testid={titleTestId}>
					{title}
				</h1>
				{#if description}
					{#if typeof description === 'string'}
						<p class="text-gray-600 dark:text-gray-400">{description}</p>
					{:else}
						<div class="text-gray-600 dark:text-gray-400">
							{@render description()}
						</div>
					{/if}
				{/if}
			</div>

			<!-- Main Content -->
			{@render children()}

			<!-- Footer -->
			{#if footer}
				<div class="mt-8">
					{@render footer()}
				</div>
			{/if}
		</div>

		<!-- Content outside the card -->
		{#if outsideContent}
			<div class="mt-6">
				{@render outsideContent()}
			</div>
		{/if}
	</div>
</div>
