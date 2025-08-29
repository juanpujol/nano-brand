<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { initializeAuth } from '$lib/auth.svelte';
	import { onMount } from 'svelte';
	import { invalidate } from '$app/navigation';
	import { createClient } from '$lib/supabase/client';
	import { ModeWatcher } from 'mode-watcher';
	import { Toaster } from '$lib/components/ui/sonner';
	import { TooltipProvider } from '$lib/components/ui/tooltip';

	let { children } = $props();

	onMount(() => {
		// Initialize auth state
		initializeAuth();

		// Listen for auth changes and invalidate data
		const supabase = createClient();
		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange(() => {
			invalidate('supabase:auth');
		});

		return () => {
			subscription.unsubscribe();
		};
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<ModeWatcher />

<Toaster position="bottom-center" />

<TooltipProvider>
	{@render children?.()}
</TooltipProvider>
