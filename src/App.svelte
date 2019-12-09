<script>
  import ViewsContainer from './views/ViewsContainer.svelte';
	import StatesContainer from './states/StatesContainer.svelte';
  import TimeTravelContainer from './timetravel/TimeTravelContainer.svelte';
</script>

<main>
  <section>
    <ViewsContainer />
    <StatesContainer />
  </section>
  <TimeTravelContainer />
</main>

<style>
	main {
		height: 100%;
		width: 100%;
		margin: 0;
		padding: 0;
		display: grid;
    grid-template-rows: minmax(0, 1fr) 40px;
	}

	section {
    grid-row: 1 / span 1;
    background-color: blueviolet;
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

	TimeTravelContainer {
    grid-row: 2 / span 1;
  }

	ViewsContainer {
    grid-column: 1 / span 1;
	}

	StatesContainer {
    grid-column: 2 / span 1;
		padding: .5rem;
	}
</style>