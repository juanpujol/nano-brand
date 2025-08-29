<script lang="ts">
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { page } from '$app/state';
	import {
		LayoutDashboard,
		Settings,
		ChartBar,
		Users,
		TrendingUp,
		ListFilter,
		Settings2,
		Building2,
		UserCog,
		Target,
		Plug
	} from 'lucide-svelte';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';

	let {
		items,
		hideLabel = false,
		groupLabel = 'Platform'
	}: {
		items: {
			title: string;
			url: string;
			icon?: string;
			isActive?: boolean;
			items?: {
				title: string;
				url: string;
			}[];
		}[];
		hideLabel?: boolean;
		groupLabel?: string;
	} = $props();

	const pathname = $derived(page.url.pathname);

	// Map icon names to components
	const iconMap = {
		LayoutDashboard,
		Settings,
		ChartBar,
		Users,
		TrendingUp,
		ListFilter,
		Settings2,
		Building2,
		UserCog,
		Target,
		Plug,
		// Keep old names for backward compatibility
		BarChart3: ChartBar,
		Filter: ListFilter
	};

	function getIconComponent(iconName?: string) {
		if (!iconName) return null;
		return iconMap[iconName as keyof typeof iconMap];
	}

	function isActive(item: { url: string; items?: { title: string; url: string }[] }) {
		if (item.items?.length) {
			// For collapsible items, check if any sub-item is active
			return item.items.some((subItem) => {
				if (pathname === subItem.url) return true;
				// Only use startsWith for paths with trailing segments (not root paths)
				if (subItem.url !== '/' && pathname.startsWith(subItem.url + '/')) return true;
				return false;
			});
		}

		// For direct items
		if (pathname === item.url) return true;

		// Special handling for the base org URL (Relatórios)
		// Only match if it's exactly the org root or a dashboard path
		if (item.url.match(/^\/orgs\/[^/]+$/) && !item.url.endsWith('/')) {
			// This is a base org URL like /orgs/123
			// Only active for exact match or dashboard paths
			return pathname === item.url || pathname.startsWith(item.url + '/dash');
		}

		// For other paths, only use startsWith for paths with trailing segments
		if (item.url !== '/' && pathname.startsWith(item.url + '/')) return true;

		return false;
	}
</script>

<Sidebar.Group>
	{#if !hideLabel}
		<Sidebar.GroupLabel>{groupLabel}</Sidebar.GroupLabel>
	{/if}
	<Sidebar.Menu>
		{#each items as item (item.title)}
			{@const active = isActive(item)}
			{#if item.items?.length}
				<Collapsible.Root open={active} class="group/collapsible">
					{#snippet child({ props })}
						<Sidebar.MenuItem {...props}>
							<Collapsible.Trigger>
								{#snippet child({ props })}
									<Sidebar.MenuButton {...props} tooltipContent={item.title}>
										{@const IconComponent = getIconComponent(item.icon)}
										{#if IconComponent}
											<IconComponent class="size-4" />
										{/if}
										<span class="whitespace-nowrap">{item.title}</span>
										<ChevronRightIcon
											class="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
										/>
									</Sidebar.MenuButton>
								{/snippet}
							</Collapsible.Trigger>
							<Collapsible.Content>
								<Sidebar.MenuSub>
									{#each item.items ?? [] as subItem (subItem.title)}
										<Sidebar.MenuSubItem>
											<a href={subItem.url} class="block">
												<Sidebar.MenuSubButton>
													<span class="whitespace-nowrap">{subItem.title}</span>
												</Sidebar.MenuSubButton>
											</a>
										</Sidebar.MenuSubItem>
									{/each}
								</Sidebar.MenuSub>
							</Collapsible.Content>
						</Sidebar.MenuItem>
					{/snippet}
				</Collapsible.Root>
			{:else}
				{@const IconComponent = getIconComponent(item.icon)}
				<Sidebar.MenuItem>
					<a href={item.url} class="block">
						<Sidebar.MenuButton
							class={active ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''}
							tooltipContent={item.title}
						>
							{#if IconComponent}
								<IconComponent class="size-4" />
							{/if}
							<span class="whitespace-nowrap">{item.title}</span>
						</Sidebar.MenuButton>
					</a>
				</Sidebar.MenuItem>
			{/if}
		{/each}
	</Sidebar.Menu>
</Sidebar.Group>
