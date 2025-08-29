<script lang="ts">
	import { DashboardSelector } from '$lib/components/dashboard';
	import dashboardsData from '$lib/data/dashboards-mock-data.json';
	import { page } from '$app/stores';
	import { toast } from 'svelte-sonner';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();

	// Dashboard favorite states (mock state for each dashboard)
	let favoriteStates = $state<Record<string, boolean>>({});

	// Get current orgId from page params
	const orgId = $derived($page.params.orgId);
	const currentDashId = $derived($page.params.dashId);

	// Initialize favorite states from mock data
	$effect(() => {
		const initialStates: Record<string, boolean> = {};
		dashboardsData.forEach((dashboard) => {
			const dashId = dashboard.href === '/' ? 'general' : dashboard.href.slice(1);
			initialStates[dashId] = dashboard.isFavorited;
		});
		favoriteStates = initialStates;
	});

	// Dashboards data with proper URLs
	const dashboards = $derived(
		dashboardsData.map((dashboard) => {
			// Create dashboard ID from href (remove leading slash and convert to dash-case)
			const dashId = dashboard.href === '/' ? 'general' : dashboard.href.slice(1);

			return {
				...dashboard,
				href: `/orgs/${orgId}/dash/${dashId}`,
				isSelected: dashId === currentDashId,
				isFavorited: favoriteStates[dashId] ?? dashboard.isFavorited,
				onFavoriteToggle: () => toggleFavorite(dashId),
				onEdit: () => handleEdit(dashId),
				onDuplicate: () => handleDuplicate(dashId),
				onDelete: () => handleDelete(dashId)
			};
		})
	);

	function toggleFavorite(dashId: string) {
		const wasFavorited = favoriteStates[dashId];
		favoriteStates[dashId] = !favoriteStates[dashId];

		const dashboardName =
			dashboardsData.find((d) => (d.href === '/' ? 'general' : d.href.slice(1)) === dashId)
				?.title || 'Dashboard';

		if (wasFavorited) {
			toast.success(`${dashboardName} removido dos favoritos`);
		} else {
			toast.success(`${dashboardName} adicionado aos favoritos`);
		}
	}

	function handleEdit(dashId: string) {
		// TODO: Implement edit dashboard functionality
		console.log('Edit dashboard:', dashId);
	}

	function handleDuplicate(dashId: string) {
		// TODO: Implement duplicate dashboard functionality
		console.log('Duplicate dashboard:', dashId);
	}

	function handleDelete(dashId: string) {
		// TODO: Implement delete dashboard functionality
		console.log('Delete dashboard:', dashId);
	}

	function handleNewDashboard() {
		// TODO: Implement new dashboard functionality
	}
</script>

<DashboardSelector {dashboards} onNewDashboard={handleNewDashboard} />

{@render children()}
