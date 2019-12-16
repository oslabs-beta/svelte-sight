<script>
  import svelte from 'svelte/compiler'

  // Conditional rendering 
  const getData = () => { 
    const viewsRoot = document.getElementById('views-root');
    const statesRoot = document.getElementById('states-root');
    const propsRoot = document.getElementById('props-root');

    viewsRoot.innerText = 'Get Data';
    statesRoot.innerText = 'Get Data';
    propsRoot.innerText = 'Get Data';
  }

  const getTree = () => {
    const viewsRoot = document.getElementById('views-root');
    const statesRoot = document.getElementById('states-root');
    const propsRoot = document.getElementById('props-root');
    
    viewsRoot.innerText = 'tree';
    statesRoot.innerText = 'tree';
    propsRoot.innerText = 'tree';
  }

  const getChart = () => {
    const viewsRoot = document.getElementById('views-root');
    const statesRoot = document.getElementById('states-root');
    const propsRoot = document.getElementById('props-root');
    
    viewsRoot.innerText = 'chart';
    statesRoot.innerText = 'chart';
    propsRoot.innerText = 'chart';
  }

  const getRaw = () => {
    const viewsRoot = document.getElementById('views-root');
    const statesRoot = document.getElementById('states-root');
    const propsRoot = document.getElementById('props-root');
    
    viewsRoot.innerText = 'raw';
    statesRoot.innerText = 'raw';
    propsRoot.innerText = 'raw';
  }



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
  <button on:click={getData}>Data</button>
  <button on:click={getTree}>Tree</button>
  <button on:click={getChart}>Chart</button>
  <button on:click={getRaw}>Raw</button>
</div>

<style>
  #views-navbar {
    background-color: rgb(53, 60, 69);
    border-bottom: 1px solid rgb(70, 80, 90);
  }
</style>