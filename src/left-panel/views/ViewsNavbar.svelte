<script>
  import svelte from 'svelte/compiler'

  // Conditional rendering 
  const getData = (tab) => { 
    const viewsRoot = document.getElementById('views-root');
    const statesRoot = document.getElementById('states-root');
    const propsRoot = document.getElementById('props-root');

    switch (tab) {
      case 'data':
        viewsRoot.innerText = 'Data';
        statesRoot.innerText = 'Data';
        propsRoot.innerText = 'Data';
        break;
      case 'tree':
        viewsRoot.innerText = 'tree';
        statesRoot.innerText = 'tree';
        propsRoot.innerText = 'tree';
        break;
      case 'chart':
        viewsRoot.innerText = 'chart';
        statesRoot.innerText = 'chart';
        propsRoot.innerText = 'chart';
        break;
      case 'raw':
        viewsRoot.innerText = 'raw';
        statesRoot.innerText = 'raw';
        propsRoot.innerText = 'raw';
        break;
    }
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
  <button on:click={() => getData('data')}>Data</button>
  <button on:click={() => getData('tree')}>Tree</button>
  <button on:click={() => getData('chart')}>Chart</button>
  <button on:click={() => getData('raw')}>Raw</button>
</div>

<style>
  #views-navbar {
    background-color: rgb(53, 60, 69);
    border-bottom: 1px solid rgb(70, 80, 90);
  }
</style>