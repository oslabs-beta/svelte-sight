<script>
  export let type;
</script>

<div id={`${type.toLowerCase()}-display`}>
  <div id={`${type.toLowerCase()}-root`}></div>
</div>

<style>
  #state-display, #props-display {
    background-color: rgb(37, 42, 50);
    overflow: auto;
  }

  #state-root {
    font-size: 1rem;
  }

  #props-root {
    font-size: 1.1rem;
  }
</style>