<script>
  import StatesNavbar from './StatesNavbar.svelte';
  import StatesDisplay from './StatesDisplay.svelte';
</script>

<div id="states-container">
  <StatesNavbar />
  <StatesDisplay />
</div>

<style>
  #states-container {
    border: 1px solid rgb(105, 107, 112);
    display: grid;
    grid-template-rows: 35px minmax(0, 1fr);
    overflow: auto;
  }

  StatesNavbar {
    grid-row: 1 / span 1;
  }

  StatesDisplay {
    grid-row: 2 / span 1;
  }
</style>