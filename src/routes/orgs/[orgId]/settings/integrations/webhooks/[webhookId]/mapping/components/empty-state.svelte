<script lang="ts">
	import { Search } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';

	interface Props {
		onOpenPayloadDialog: () => void;
	}

	let { onOpenPayloadDialog }: Props = $props();
</script>

<Card.Root>
	<Card.Content class="flex flex-col items-center justify-center px-4 py-16 text-center">
		<div class="mb-6 rounded-full bg-muted p-6">
			<Search class="h-12 w-12 text-muted-foreground" />
		</div>
		<h3 class="mb-2 text-xl font-semibold">Configure o mapeamento de campos</h3>
		<p class="mb-6 max-w-md text-muted-foreground">
			Este webhook ainda não possui um payload de exemplo nem campos mapeados. Para começar, você
			precisa:
		</p>
		<div class="mb-6 space-y-3 text-left">
			<div class="flex items-start gap-3">
				<div
					class="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
				>
					1
				</div>
				<div>
					<p class="text-sm font-medium">Ativar captura automática</p>
					<p class="text-sm text-muted-foreground">
						Ative a opção acima para capturar o próximo payload automaticamente
					</p>
				</div>
			</div>
			<div class="flex items-start gap-3">
				<div
					class="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
				>
					2
				</div>
				<div>
					<p class="text-sm font-medium">Enviar dados para o webhook</p>
					<p class="text-sm text-muted-foreground">
						Faça uma requisição POST para capturar um payload de exemplo
					</p>
				</div>
			</div>
			<div class="flex items-start gap-3">
				<div
					class="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
				>
					3
				</div>
				<div>
					<p class="text-sm font-medium">Mapear os campos</p>
					<p class="text-sm text-muted-foreground">
						Configure como os dados do payload se conectam aos campos dos leads
					</p>
				</div>
			</div>
		</div>
		<div class="flex gap-2">
			<Button variant="outline" onclick={onOpenPayloadDialog}>Alterar payload manualmente</Button>
		</div>
	</Card.Content>
</Card.Root>
