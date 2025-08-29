<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Share, FileText, Image, Link, Mail } from '@lucide/svelte';

	interface Props {
		onExportPDF?: () => void;
		onExportImage?: () => void;
		onPublicLink?: () => void;
		onSendEmail?: () => void;
	}

	let { onExportPDF, onExportImage, onPublicLink, onSendEmail }: Props = $props();
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<Button size="sm" variant="secondary" class="size-9 md:w-auto md:px-3" {...props}>
				<Share class="size-4 md:mr-2" />
				<span class="sr-only md:not-sr-only">Compartilhar</span>
			</Button>
		{/snippet}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content align="end" class="w-56">
		<DropdownMenu.Item onclick={onExportPDF}>
			<FileText class="mr-2 size-4" />
			<span>Exportar PDF</span>
		</DropdownMenu.Item>
		<DropdownMenu.Item onclick={onExportImage}>
			<Image class="mr-2 size-4" />
			<span>Exportar como imagem</span>
		</DropdownMenu.Item>
		<DropdownMenu.Separator />
		<DropdownMenu.Item onclick={onPublicLink}>
			<Link class="mr-2 size-4" />
			<span>Link público</span>
		</DropdownMenu.Item>
		<DropdownMenu.Item onclick={onSendEmail}>
			<Mail class="mr-2 size-4" />
			<span>Enviar por email</span>
		</DropdownMenu.Item>
	</DropdownMenu.Content>
</DropdownMenu.Root>
