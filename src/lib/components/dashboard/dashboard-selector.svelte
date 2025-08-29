<script lang="ts">
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { useSidebar } from '$lib/components/ui/sidebar';
	import DashboardTile from './dashboard-tile.svelte';
	import { Plus } from 'lucide-svelte';

	interface Dashboard {
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

	interface Props {
		dashboards: Dashboard[];
		onNewDashboard?: () => void;
	}

	let { dashboards, onNewDashboard }: Props = $props();

	// Sidebar state
	const sidebar = useSidebar();
</script>

<ScrollArea
	class="mb-4 w-full border-b {sidebar.state === 'expanded'
		? 'md:max-w-[calc(100vw-var(--sidebar-width))]'
		: 'md:max-w-[calc(100vw-var(--sidebar-width-icon)-1rem)]'}"
	orientation="horizontal"
>
	<div class="flex w-full justify-center gap-4 px-4 pb-4">
		<button
			class="sticky -left-[5.45rem] z-10 flex h-[104px] w-[104px] flex-shrink-0 flex-col items-start justify-center rounded-lg bg-primary p-4 text-left text-sm font-semibold text-background shadow-xs backdrop-blur-sm transition hover:bg-primary/90"
			onclick={onNewDashboard}
		>
			<Plus class="mb-2 size-6" />
			Novo dashboard
		</button>
		{#each dashboards as dashboard (dashboard.href)}
			<div class="w-80 flex-shrink-0">
				<DashboardTile
					title={dashboard.title}
					description={dashboard.description}
					href={dashboard.href}
					isFavorited={dashboard.isFavorited || false}
					isSelected={dashboard.isSelected || false}
					onFavoriteToggle={dashboard.onFavoriteToggle}
					onEdit={dashboard.onEdit}
					onDuplicate={dashboard.onDuplicate}
					onDelete={dashboard.onDelete}
				/>
			</div>
		{/each}
	</div>
</ScrollArea>
