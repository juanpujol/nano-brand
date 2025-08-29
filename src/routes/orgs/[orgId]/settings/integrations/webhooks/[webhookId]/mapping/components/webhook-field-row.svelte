<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { ArrowRight, ChevronDown, CircleCheck } from '@lucide/svelte';

	interface Props {
		targetKey: string;
		label: string;
		isRequired: boolean;
		selectedValue: string | undefined;
		onOpenFieldDialog: (targetKey: string) => void;
	}

	let { targetKey, label, isRequired, selectedValue, onOpenFieldDialog }: Props = $props();
</script>

<div class="group relative">
	<div
		class="block w-full rounded-none border-b p-4 text-sm no-underline transition-none group-last:border-b-0 hover:bg-accent/30 hover:!no-underline focus-visible:bg-accent focus-visible:ring-0"
	>
		<div class="flex flex-col gap-4 md:flex-row">
			<div class="flex flex-grow translate-y-2 flex-col items-start gap-2">
				<p
					class="flex items-center gap-2 text-xs leading-none font-medium text-muted-foreground select-none"
				>
					Campo de destino
					{#if isRequired}
						<span class="text-destructive">* Obrigatório</span>
					{/if}
				</p>
				<div class="flex w-full flex-grow justify-between gap-2">
					<div class="flex flex-col gap-2">
						<div>
							<code class="rounded bg-muted px-2 py-1 font-mono text-xs break-all">
								{label}
							</code>
						</div>
					</div>
					<div class="flex gap-2">
						{#if selectedValue}
							<CircleCheck strokeWidth={3} class="h-4 w-4 text-green-500" />
						{/if}
						<ArrowRight class="hidden h-4 w-4 text-muted-foreground sm:block" />
					</div>
				</div>
			</div>

			<div class="flex flex-col gap-2 sm:flex-row">
				<div class="space-y-2">
					<p class="mb-2 p-0 text-xs leading-none font-medium text-muted-foreground">
						Campo do webhook
					</p>
					<Button
						variant="outline"
						class="w-48 justify-between text-left font-normal"
						id={targetKey}
						onclick={() => onOpenFieldDialog(targetKey)}
					>
						<span class="block truncate">
							{selectedValue || 'Selecione um campo'}
						</span>
						<ChevronDown class="h-4 w-4 opacity-50" />
					</Button>
				</div>
			</div>
		</div>
	</div>
</div>
