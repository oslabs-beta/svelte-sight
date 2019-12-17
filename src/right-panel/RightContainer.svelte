<script>
  import StatesContainer from './states/StatesContainer.svelte';
  import PropsContainer from './props/PropsContainer.svelte';
</script>

<div id='right-container'>
  <StatesContainer />
  <PropsContainer />
</div>

<style>
  #right-container {
    display: grid;
    grid-template-rows: 60% 40%;
  }

  StatesContainer {
    grid-row: 1 / span 1;
  }

  PropsContainer {
    grid-row: 2 / span 1;
  }
</style>
