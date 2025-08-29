<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Heart, MoreVertical, Edit, Copy, Trash2 } from 'lucide-svelte';

	interface Props {
		title: string;
		description: string;
		href: string;
		isFavorited?: boolean;
		isSelected?: boolean;
		onFavoriteToggle?: () => void;
		onEdit?: () => void;
		onDuplicate?: () => void;
		onDelete?: () => void;
	}

	let {
		title,
		description,
		href,
		isFavorited = false,
		isSelected = false,
		onFavoriteToggle,
		onEdit,
		onDuplicate,
		onDelete
	}: Props = $props();

	// Dashboard state
	let dropdownOpen = $state(false);

	function handleFavoriteToggle() {
		onFavoriteToggle?.();
	}

	function handleEdit() {
		onEdit?.();
	}

	function handleDuplicate() {
		onDuplicate?.();
	}

	function handleDelete() {
		onDelete?.();
	}
</script>

<div class="group relative">
	<a {href} class="group block">
		<Card.Root
			class="py-4 transition-shadow group-hover:bg-accent hover:shadow-md {isSelected
				? 'border-[oklch(0.75_0.15_248.22)] bg-[oklch(0.96_0.03_241.52)] hover:bg-[oklch(0.93_0.03_241.52)] dark:border-[oklch(0.47_0.12_248.85)] dark:bg-[oklch(0.19_0.03_242.23)] hover:dark:bg-[oklch(0.21_0.03_242.23)]'
				: ''}"
		>
			<Card.Header class="px-4">
				<Card.Title class="truncate pr-16 text-base font-bold">{title}</Card.Title>
				<Card.Description class="line-clamp-2 text-sm text-muted-foreground">
					{description}
				</Card.Description>
			</Card.Header>
		</Card.Root>
	</a>

	<!-- Action buttons -->
	<div class="absolute top-3 right-3 flex gap-1">
		<!-- Favorite button -->
		<Button
			variant="ghost"
			size="icon"
			class="h-8 w-8"
			onclick={(e) => {
				e.preventDefault();
				e.stopPropagation();
				handleFavoriteToggle();
			}}
		>
			<Heart class="size-4 {isFavorited ? 'fill-red-500 text-red-500' : ''}" />
		</Button>

		<!-- More dropdown -->
		<DropdownMenu.Root bind:open={dropdownOpen}>
			<DropdownMenu.Trigger>
				<Button
					variant="ghost"
					size="icon"
					class="h-8 w-8"
					onclick={(e) => {
						e.preventDefault();
						e.stopPropagation();
					}}
				>
					<MoreVertical class="size-4" />
				</Button>
			</DropdownMenu.Trigger>
			<DropdownMenu.Content align="end">
				<DropdownMenu.Item onclick={handleEdit}>
					<Edit class="mr-2 size-4" />
					Editar
				</DropdownMenu.Item>
				<DropdownMenu.Item onclick={handleDuplicate}>
					<Copy class="mr-2 size-4" />
					Duplicar
				</DropdownMenu.Item>
				<DropdownMenu.Separator />
				<DropdownMenu.Item onclick={handleDelete} class="text-destructive">
					<Trash2 class="mr-2 size-4" />
					Excluir
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</div>
</div>
