<script lang="ts">
  import * as Card from '$lib/components/ui/card';
</script>


<div class="grid gap-4">
	<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <Card.Root>
      <Card.Header>
        <Card.Title>
          <h2 class="text-lg font-bold">Widget 1</h2>
        </Card.Title>
      </Card.Header>
      <Card.Content>
        <p>
          Widget 1 content
        </p>
      </Card.Content>
    </Card.Root>
    <Card.Root>
      <Card.Header>
        <Card.Title>
          <h2 class="text-lg font-bold">Widget 2</h2>
        </Card.Title>
      </Card.Header>
    </Card.Root>
    <Card.Root>
      <Card.Header>
        <Card.Title>
          <h2 class="text-lg font-bold">Widget 3</h2>
        </Card.Title>
      </Card.Header>
    </Card.Root>
    <Card.Root>
      <Card.Header>
        <Card.Title>
          <h2 class="text-lg font-bold">Widget 4</h2>
        </Card.Title>
      </Card.Header>
    </Card.Root>
	</div>
</div>