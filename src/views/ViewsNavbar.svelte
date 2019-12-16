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
      // modified the key name to match the url key later and made the value 
      // to be the stringified version of value from D3PreTree
      let newD3Pre = []
      for (let eachObj of D3PreTree) {
        let temp = {}
        let key = Object.keys(eachObj)[0]
        let value = Object.values(eachObj)[0]
        key = key.split('')
        key.shift()
        key.pop()
        key.pop()
        key.pop()
        key = key.join('')
        temp[key] = JSON.stringify(value)
        newD3Pre.push(temp)
      }

    }, 100)
    })

  }
</script>

<div id="views-navbar">
  <button on:click={fetchData}>Get Data</button>
</div>

<style>
  #views-navbar {
    background-color: brown;
  }
</style>