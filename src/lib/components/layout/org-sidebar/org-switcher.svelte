<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { useSidebar } from '$lib/components/ui/sidebar';
	import { ChevronsUpDown, Plus, Building2, Check } from 'lucide-svelte';

	interface Organization {
		id: string;
		name: string;
		created_at: string;
		updated_at: string;
	}

	interface Membership {
		id: string;
		organization_id: string;
		profile_id: string;
		role: 'admin' | 'member';
		created_at: string;
		organizations?: Organization;
	}

	interface Props {
		memberships: Membership[];
		currentOrganization?: Organization;
	}

	let { memberships, currentOrganization }: Props = $props();
	const sidebar = useSidebar();

	function getInitials(name: string) {
		return name
			.split(' ')
			.map((part) => part.charAt(0))
			.join('')
			.toUpperCase()
			.slice(0, 2);
	}
</script>

<Sidebar.Menu>
	<Sidebar.MenuItem>
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					<Sidebar.MenuButton
						{...props}
						size="lg"
						class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
					>
						<div
							class="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"
						>
							{#if currentOrganization}
								<div class="text-xs font-semibold">
									{getInitials(currentOrganization.name)}
								</div>
							{:else}
								<Building2 class="size-4" />
							{/if}
						</div>
						<div class="grid flex-1 text-left text-sm leading-tight">
							<span class="truncate font-medium">
								{currentOrganization?.name || 'Selecione uma organização'}
							</span>
							<span class="truncate text-xs">Organização</span>
						</div>
						<ChevronsUpDown class="ml-auto" />
					</Sidebar.MenuButton>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content
				class="w-(--bits-dropdown-menu-anchor-width) min-w-56 rounded-lg"
				align="start"
				side={sidebar.isMobile ? 'bottom' : 'right'}
				sideOffset={4}
			>
				<DropdownMenu.Label class="text-xs text-muted-foreground">Organizações</DropdownMenu.Label>

				{#if memberships.length > 1}
					<DropdownMenu.Item class="gap-2 p-2">
						<a href="/orgs" class="flex w-full cursor-pointer items-center gap-2">
							<div class="flex size-6 items-center justify-center rounded-md border">
								<Building2 class="size-3.5 shrink-0" />
							</div>
							<span>Todas as organizações</span>
						</a>
					</DropdownMenu.Item>
					<DropdownMenu.Separator />
				{/if}

				{#each memberships as membership (membership.id)}
					{@const org = membership.organizations}
					{#if org}
						<DropdownMenu.Item class="gap-2 p-2">
							<a href="/orgs/{org.id}" class="flex w-full cursor-pointer items-center gap-2">
								<div class="flex size-6 items-center justify-center rounded-md border">
									<div class="text-xs font-semibold">
										{getInitials(org.name)}
									</div>
								</div>
								<span>{org.name}</span>
								{#if currentOrganization?.id === org.id}
									<Check class="ml-auto size-4" />
								{/if}
							</a>
						</DropdownMenu.Item>
					{/if}
				{/each}

				<DropdownMenu.Separator />
				<DropdownMenu.Item class="gap-2 p-2">
					<a href="/setup" class="flex w-full cursor-pointer items-center gap-2">
						<div class="flex size-6 items-center justify-center rounded-md border bg-transparent">
							<Plus class="size-4" />
						</div>
						<span>Criar organização</span>
					</a>
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</Sidebar.MenuItem>
</Sidebar.Menu>
