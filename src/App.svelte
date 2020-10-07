<script>
  import svelte from 'svelte/compiler';
  import ViewsContainer from './left-panel/ViewsContainer.svelte';
  import RightContainer from './right-panel/RightContainer.svelte';
</script>

<main>
  <ViewsContainer />
  <RightContainer />
</main>

<style>
	main {
		height: 100%;
		width: 100%;
		margin: 0;
		padding: 0;
		display: grid;
    grid-template-columns: minmax(0, 60%) minmax(0, 40%);
	}

	ViewsContainer {
    grid-column: 1 / span 1;
	}

	RightContainer {
    grid-column: 2 / span 1;
	}
</style>
