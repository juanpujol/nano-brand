<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Search, Check } from '@lucide/svelte';

	interface Props {
		open: boolean;
		targetField: string | null;
		webhookFields: Record<string, unknown>;
		selectedValue: string | undefined;
		onSelect: (value: string) => void;
		onClose: () => void;
	}

	let {
		open = $bindable(),
		targetField,
		webhookFields,
		selectedValue,
		onSelect,
		onClose
	}: Props = $props();

	// Dialog state
	let searchTerm = $state('');
	let focusedIndex = $state(-1);
	let optionRefs = $state<HTMLElement[]>([]);
	let searchInputRef = $state<HTMLInputElement | null>(null);
	let scrollContainer = $state<HTMLElement | null>(null);

	// Filter webhook fields based on search
	const filteredWebhookFields = $derived.by(() => {
		let fields = Object.entries(webhookFields);

		if (searchTerm.trim()) {
			const search = searchTerm.toLowerCase();
			fields = fields.filter(([key]) => key.toLowerCase().includes(search));
		}

		return fields.map(([key, value]) => ({
			value: key,
			label: key,
			sampleValue: value
		}));
	});

	// All options including "Não mapear"
	const allOptions = $derived.by(() => {
		return [{ value: '', label: 'Não mapear', sampleValue: null }, ...filteredWebhookFields];
	});

	// Keyboard navigation functions
	function scrollToFocused() {
		if (focusedIndex >= 0 && optionRefs[focusedIndex] && scrollContainer) {
			const focusedElement = optionRefs[focusedIndex];
			const containerRect = scrollContainer.getBoundingClientRect();
			const elementRect = focusedElement.getBoundingClientRect();

			// Check if element is outside the visible area
			if (elementRect.top < containerRect.top || elementRect.bottom > containerRect.bottom) {
				// Use instant scrolling for better responsiveness during rapid navigation
				focusedElement.scrollIntoView({
					behavior: 'instant',
					block: 'nearest'
				});
			}
		}
	}

	function selectFocusedOption() {
		if (focusedIndex >= 0 && focusedIndex < allOptions.length) {
			const option = allOptions[focusedIndex];
			onSelect(option.value);
		}
	}

	function handleKeyDown(e: KeyboardEvent) {
		const totalOptions = allOptions.length;

		switch (e.key) {
			case 'ArrowDown':
				e.preventDefault();
				focusedIndex = (focusedIndex + 1) % totalOptions;
				scrollToFocused();
				break;
			case 'ArrowUp':
				e.preventDefault();
				focusedIndex = focusedIndex <= 0 ? totalOptions - 1 : focusedIndex - 1;
				scrollToFocused();
				break;
			case 'Enter':
				e.preventDefault();
				if (focusedIndex >= 0) {
					selectFocusedOption();
				}
				break;
			case 'Home':
				e.preventDefault();
				focusedIndex = 0;
				scrollToFocused();
				break;
			case 'End':
				e.preventDefault();
				focusedIndex = totalOptions - 1;
				scrollToFocused();
				break;
		}
	}

	// Reset focus when dialog opens or search changes
	$effect(() => {
		if (open) {
			focusedIndex = -1;
			searchTerm = '';
			// Don't reset optionRefs array, let bindings handle it
			// Auto-focus search input after a brief delay
			setTimeout(() => {
				searchInputRef?.focus();
			}, 100);
		}
	});

	$effect(() => {
		// Reset focus when search changes
		if (searchTerm) {
			focusedIndex = -1;
		}
	});
</script>

<Dialog.Root {open} onOpenChange={(isOpen) => !isOpen && onClose()}>
	<Dialog.Content class="max-h-[90vh] w-[90vw] max-w-sm overflow-y-auto sm:w-full sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">Mapeamento de campos</Dialog.Title>
			<Dialog.Description>
				{#if targetField}
					Selecione qual campo do webhook fornecerá os dados para <strong>{targetField}</strong>.
				{/if}
			</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-4">
			<div class="relative">
				<Search class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					bind:ref={searchInputRef}
					type="text"
					placeholder="Buscar campos do webhook..."
					bind:value={searchTerm}
					class="w-full pl-9"
					onkeydown={handleKeyDown}
					role="combobox"
					aria-expanded="true"
					aria-haspopup="listbox"
					aria-activedescendant={focusedIndex >= 0 ? `option-${focusedIndex}` : undefined}
				/>
			</div>

			<div
				bind:this={scrollContainer}
				class="max-h-[40vh] overflow-y-auto rounded-lg border"
				role="listbox"
			>
				<div class="space-y-1 p-2">
					{#each allOptions as option, index (option.value)}
						<button
							bind:this={optionRefs[index]}
							id="option-{index}"
							class="flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm hover:bg-accent focus:bg-accent focus:outline-none"
							class:bg-accent={focusedIndex === index}
							onclick={() => onSelect(option.value)}
							role="option"
							aria-selected={selectedValue === option.value}
							data-focused={focusedIndex === index}
						>
							<div class="flex h-4 w-4 items-center justify-center">
								{#if selectedValue === option.value}
									<Check class="h-4 w-4 text-primary" />
								{/if}
							</div>
							<div class="min-w-0 flex-1">
								{#if option.value === ''}
									<div class="font-medium text-muted-foreground">Não mapear</div>
									<div class="text-xs text-muted-foreground">Deixar este campo sem mapeamento</div>
								{:else}
									<code class="py-1 font-mono text-sm break-all">
										{option.label}
									</code>
									{#if option.sampleValue}
										<div class="text-xs break-all text-muted-foreground">
											Exemplo: {String(option.sampleValue)}
										</div>
									{/if}
								{/if}
							</div>
						</button>
					{/each}

					{#if allOptions.length <= 1}
						<div class="py-8 text-center text-muted-foreground">
							{#if searchTerm.trim()}
								Nenhum campo encontrado para "{searchTerm}"
							{:else}
								Nenhum campo disponível
							{/if}
						</div>
					{/if}
				</div>
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>
