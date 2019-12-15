<script>
  import PropsNavbar from './PropsNavbar.svelte';
  import PropsDisplay from './PropsDisplay.svelte';
</script>

<div id='props-container'>
  <PropsNavbar />
  <PropsDisplay />
</div>

<style>
  #props-container {
    border: 1px solid rgb(105, 107, 112);
    display: grid;
    grid-template-rows: 30px minmax(0, 1fr);
    overflow: auto;
  }

  PropsNavbar {
    grid-row: 1 / span 1;
  }

  PropsDisplay {
    grid-row: 2 / span 1;
  }
</style>