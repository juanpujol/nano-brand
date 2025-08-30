<script lang="ts">
	import * as Avatar from '$lib/components/ui/avatar';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
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
		ChevronDown
	} from 'lucide-svelte';

	interface Props {
		user: User;
	}

	let { user }: Props = $props();

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
		user.user_metadata?.display_name || user.email?.split('@')[0] || 'User'
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
				return 'Light';
			case 'dark':
				return 'Dark';
			default:
				return 'System';
		}
	}
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<button
				class="flex items-center gap-2 rounded-md p-1 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
				{...props}
			>
				<Avatar.Root class="size-8 rounded-lg">
					<Avatar.Image src="" alt={currentUserName} />
					<Avatar.Fallback class="rounded-lg bg-foreground/10 font-medium">
						{getInitials(currentUserName)}
					</Avatar.Fallback>
				</Avatar.Root>
				<ChevronDown class="size-4 text-muted-foreground" />
			</button>
		{/snippet}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content class="w-56 rounded-lg" side="bottom" align="end" sideOffset={4}>
		<DropdownMenu.Label class="p-0 font-normal">
			<div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
				<Avatar.Root class="size-8 rounded-lg">
					<Avatar.Image src="" alt={currentUserName} />
					<Avatar.Fallback class="rounded-lg bg-foreground/10 font-medium">
						{getInitials(currentUserName)}
					</Avatar.Fallback>
				</Avatar.Root>
				<div class="grid flex-1 text-left text-sm leading-tight">
					<span class="truncate font-medium">{currentUserName}</span>
					<span class="truncate text-xs text-muted-foreground">{currentUserEmail}</span>
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
			<span>My Account</span>
		</DropdownMenu.Item>

		<DropdownMenu.Separator />

		<!-- Theme Submenu -->
		<DropdownMenu.Sub>
			<DropdownMenu.SubTrigger class="flex items-center gap-2">
				<Moon class="h-4 w-4" />
				<div class="flex items-center gap-3">
					<span>Theme</span>
					<span class="ml-auto text-xs text-muted-foreground">
						{getCurrentThemeLabel()}
					</span>
				</div>
			</DropdownMenu.SubTrigger>
			<DropdownMenu.SubContent>
				<!-- System Theme -->
				<DropdownMenu.Item onclick={() => setMode('system')} class="flex items-center gap-2">
					<Monitor class="h-4 w-4" />
					<span>System</span>
					{#if userPreferredMode === 'system'}
						<Check class="ml-auto h-4 w-4" />
					{/if}
				</DropdownMenu.Item>

				<!-- Light Theme -->
				<DropdownMenu.Item onclick={() => setMode('light')} class="flex items-center gap-2">
					<Sun class="h-4 w-4" />
					<span>Light</span>
					{#if userPreferredMode === 'light'}
						<Check class="ml-auto h-4 w-4" />
					{/if}
				</DropdownMenu.Item>

				<!-- Dark Theme -->
				<DropdownMenu.Item onclick={() => setMode('dark')} class="flex items-center gap-2">
					<Moon class="h-4 w-4" />
					<span>Dark</span>
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
					<span>Sign Out</span>
				</button>
			</DropdownMenu.Item>
		</form>
	</DropdownMenu.Content>
</DropdownMenu.Root>

<!-- User Account Dialog -->
<UserAccountDialog
	bind:open={isAccountDialogOpen}
	currentUser={{
		name: currentUserName,
		email: currentUserEmail
	}}
	onUpdate={handleAccountUpdate}
/>