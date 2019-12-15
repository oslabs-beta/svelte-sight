<script>
  import svelte from 'svelte/compiler'

  //creates function fetchData that will be invoked as user clicks a button
  const fetchData = () => {
    // grabs all the associated files when devtool is open and then runs the callback
    chrome.devtools.inspectedWindow.getResources((resources) => {
      const arrSvelteFiles = resources.filter(file => file.url.includes('.svelte'));
    
    let AST = []
    let urls = []

    //retrieves each urls and pushes onto urls array
    for (let i = 0; i < arrSvelteFiles.length; i++) {
        urls.push(JSON.parse(JSON.stringify(arrSvelteFiles[i])))
        arrSvelteFiles[i].getContent(content => {
          AST.push(svelte.parse(content))
        })
     }

    
    // runs next logic after async svelte.parse is completed
    setTimeout(()=> {

    }, 100)
    })

  }
</script>

<div id="views-navbar">
  <button on:click={fetchData}>Get Data</button>
</div>

<style>
  #views-navbar {
    background-color: rgb(53, 60, 69);
    border-bottom: 1px solid rgb(70, 80, 90);
  }
</style>