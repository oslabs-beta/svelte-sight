<script>
  import ViewsNavbar from './ViewsNavbar.svelte';
  import ViewsDisplay from './ViewsDisplay.svelte';
</script>

<div id='views-container'>
  <ViewsNavbar />
  <ViewsDisplay />
</div>

<style>
  #views-container {
    background-color: palevioletred;
    border: 1px solid rgb(105, 107, 112);
    border-right: .5px solid rgb(105, 107, 112);
    display: grid;
    grid-template-rows: 40px minmax(0, 1fr);
    overflow: auto;
  }

  ViewsNavbar {
    grid-row: 1 / span 1;
  }

  ViewsDisplay {
    grid-row: 2 / span 1;
  }
</style>