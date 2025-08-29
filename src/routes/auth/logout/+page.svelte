<script lang="ts">
	import { onMount } from 'svelte';

	onMount(() => {
		// Redirect if someone lands here directly via GET
		window.location.href = '/auth/login';
	});
</script>

<!-- This page should never be seen, but provides fallback -->
<div class="flex min-h-screen items-center justify-center">
	<p>Redirecting...</p>
</div>
