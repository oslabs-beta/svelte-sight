import svelte from 'svelte/compiler';

// globals
let i = 0;
const componentNames = [];
let unorderedListOfNodesForDependencyGraph = [];  // This is a pre- or partial tree with known relationships among componenets/files that go only 1 layer deep (this is all we need to build the rest of the tree)
let componentTree;

chrome.devtools.panels.create(
  'Svelte Tool',
  null,
  'devtools.html',
  (panel) => {
    panel.onShown.addListener(() =>
      chrome.devtools.inspectedWindow.getResources((resources) => {

        const arrSvelteFiles = resources.filter(file => file.url.includes('.svelte'));
        
        arrSvelteFiles.forEach((el) => componentNames.push(`<${el.url.split('').reverse().join('').slice(7, el.url.split('').reverse().join('').indexOf('/')).split('').reverse().join('')} />`))

        arrSvelteFiles.map((resource) => {
          resource.getContent((source) => {
            if (source) {
              const ast = svelte.parse(source);
              console.log(ast);
            }
          })
        })
      })
    )
  }
)
