<script lang="ts">
	import { toggleMode } from 'mode-watcher';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Sun, Moon } from '@lucide/svelte';
</script>

<Button
	variant="ghost"
	size="icon"
	onclick={toggleMode}
	class="h-8 w-8 rounded-full border border-white/20 bg-white/10 text-gray-600 backdrop-blur-sm transition-all duration-200 hover:bg-white/20 hover:text-gray-900 dark:border-white/10 dark:bg-black/10 dark:text-gray-400 dark:hover:bg-black/20 dark:hover:text-gray-100"
	title="Alternar tema"
>
	<Sun class="h-4 w-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
	<Moon class="absolute h-4 w-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
	<span class="sr-only">Alternar tema</span>
</Button>
