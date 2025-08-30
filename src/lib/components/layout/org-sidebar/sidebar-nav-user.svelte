<script lang="ts">
	import * as Avatar from '$lib/components/ui/avatar';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { useSidebar } from '$lib/components/ui/sidebar';
	import { setMode, userPrefersMode } from 'mode-watcher';
	import { createClient } from '$lib/supabase/client';
	import UserAccountDialog from '$lib/components/layout/user-account-dialog.svelte';
	import type { User } from '@supabase/supabase-js';
	import {
		User as UserIcon,
		LogOut,
		Monitor,
		Sun,
		Moon,
		Check,
		ChevronsUpDown
	} from 'lucide-svelte';

	interface Props {
		user: User;
	}

	let { user }: Props = $props();
	const sidebar = useSidebar();

	let isAccountDialogOpen = $state(false);
	const supabase = createClient();

	function getInitials(name: string) {
		return name
			.split(' ')
			.map((part) => part.charAt(0))
			.join('')
			.toUpperCase()
			.slice(0, 2);
	}

	// Get user name from metadata or email - make it reactive
	let currentUserName = $state(
		user.user_metadata?.display_name || user.email?.split('@')[0] || 'Usuário'
	);
	let currentUserEmail = $state(user.email || '');

	async function handleAccountUpdate(userData: { name: string; email: string }) {
		// Fire and forget - since we know it works but doesn't return properly
		supabase.auth.updateUser({
			data: { display_name: userData.name }
		});

		// Wait a short moment for the update to process
		await new Promise((resolve) => setTimeout(resolve, 500));

		// Update the local name and email state to reflect the change immediately
		currentUserName = userData.name;
		currentUserEmail = userData.email;

		// Update the user prop to reflect the new display_name
		user.user_metadata = {
			...user.user_metadata,
			display_name: userData.name
		};
	}

	// Make the mode reactive using derived
	const userPreferredMode = $derived(userPrefersMode.current);

	function getCurrentThemeLabel() {
		switch (userPreferredMode) {
			case 'light':
				return 'Claro';
			case 'dark':
				return 'Escuro';
			default:
				return 'Sistema';
		}
	}
</script>

<Sidebar.Menu>
	<Sidebar.MenuItem>
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					<Sidebar.MenuButton
						size="lg"
						class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
						{...props}
					>
						<Avatar.Root class="size-8 rounded-lg">
							<Avatar.Image src="" alt={currentUserName} />
							<Avatar.Fallback class="rounded-lg bg-foreground/50 font-medium text-background">
								{getInitials(currentUserName)}
							</Avatar.Fallback>
						</Avatar.Root>
						<div class="grid flex-1 text-left text-sm leading-tight">
							<span class="truncate font-medium">{currentUserName}</span>
							<span class="truncate text-xs">{currentUserEmail}</span>
						</div>
						<ChevronsUpDown class="ml-auto size-4" />
					</Sidebar.MenuButton>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content
				class="w-(--bits-dropdown-menu-anchor-width) min-w-56 rounded-lg"
				side={sidebar.isMobile ? 'bottom' : 'right'}
				align="end"
				sideOffset={4}
			>
				<DropdownMenu.Label class="p-0 font-normal">
					<div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
						<Avatar.Root class="size-8 rounded-lg">
							<Avatar.Image src="" alt={currentUserName} />
							<Avatar.Fallback class="rounded-lg bg-foreground/50 font-medium text-background">
								{getInitials(currentUserName)}
							</Avatar.Fallback>
						</Avatar.Root>
						<div class="grid flex-1 text-left text-sm leading-tight">
							<span class="truncate font-medium">{currentUserName}</span>
							<span class="truncate text-xs">{currentUserEmail}</span>
						</div>
					</div>
				</DropdownMenu.Label>
				<DropdownMenu.Separator />

				<!-- Account Settings -->
				<DropdownMenu.Item
					class="flex items-center gap-2"
					onclick={() => (isAccountDialogOpen = true)}
				>
					<UserIcon class="h-4 w-4" />
					<span>Minha conta</span>
				</DropdownMenu.Item>

				<DropdownMenu.Separator />

				<!-- Theme Submenu -->
				<DropdownMenu.Sub>
					<DropdownMenu.SubTrigger class="flex items-center gap-2">
						<Moon class="h-4 w-4" />
						<div class="flex items-center gap-3">
							<span>Modo</span>
							<span class="ml-auto text-xs text-muted-foreground">
								{getCurrentThemeLabel()}
							</span>
						</div>
					</DropdownMenu.SubTrigger>
					<DropdownMenu.SubContent>
						<!-- System Theme -->
						<DropdownMenu.Item onclick={() => setMode('system')} class="flex items-center gap-2">
							<Monitor class="h-4 w-4" />
							<span>Sistema</span>
							{#if userPreferredMode === 'system'}
								<Check class="ml-auto h-4 w-4" />
							{/if}
						</DropdownMenu.Item>

						<!-- Light Theme -->
						<DropdownMenu.Item onclick={() => setMode('light')} class="flex items-center gap-2">
							<Sun class="h-4 w-4" />
							<span>Claro</span>
							{#if userPreferredMode === 'light'}
								<Check class="ml-auto h-4 w-4" />
							{/if}
						</DropdownMenu.Item>

						<!-- Dark Theme -->
						<DropdownMenu.Item onclick={() => setMode('dark')} class="flex items-center gap-2">
							<Moon class="h-4 w-4" />
							<span>Escuro</span>
							{#if userPreferredMode === 'dark'}
								<Check class="ml-auto h-4 w-4" />
							{/if}
						</DropdownMenu.Item>
					</DropdownMenu.SubContent>
				</DropdownMenu.Sub>

				<DropdownMenu.Separator />

				<!-- Sign Out -->
				<form action="/auth/logout" method="post" class="w-full">
					<DropdownMenu.Item>
						<button type="submit" class="flex w-full items-center gap-2">
							<LogOut class="h-4 w-4" />
							<span>Sair</span>
						</button>
					</DropdownMenu.Item>
				</form>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</Sidebar.MenuItem>
</Sidebar.Menu>

<!-- User Account Dialog -->
<UserAccountDialog
	bind:open={isAccountDialogOpen}
	currentUser={{
		name: currentUserName,
		email: currentUserEmail
	}}
	onUpdate={handleAccountUpdate}
/>
