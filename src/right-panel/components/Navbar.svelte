<script>
  export let type;
</script>

<div id={`${type.toLowerCase()}-navbar`}>
  <h2>{type}</h2>
</div>

<style>
  #state-navbar, #props-navbar {
    background-color: rgb(76, 80, 86);
    display: flex;
    align-items: center;
    border-bottom: 1px solid rgb(96, 99, 104);
  }

  h2 {
    margin-left: 5px;
  }
</style>