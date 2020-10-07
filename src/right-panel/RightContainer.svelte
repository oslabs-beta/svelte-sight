<script>
  import Container from './components/Container.svelte';
</script>

<div id='right-container'>
  <Container type={'State'} />
  <Container type={'Props'} />
</div>

<style>
  #right-container {
    display: grid;
    grid-template-rows: 70% 30%;
  }
</style>
