<script>
  import svelte from 'svelte/compiler';
  import ViewsContainer from './left-panel/views/ViewsContainer.svelte';
  import RightContainer from './right-panel/RightContainer.svelte';
  


  // globals
  let i = 0;
  const componentNames = [];
  const D3PreTree = [];
  let unorderedListOfNodesForDependencyGraph = [];  // This is a pre- or partial tree with known relationships among componenets/files that go only 1 layer deep (this is all we need to build the rest of the tree)
  let componentTree;
  //globals for D3 component tree
  let AST = []
  let urls = []


  chrome.devtools.inspectedWindow.getResources((resources) => {
    const arrSvelteFiles = resources.filter(file => file.url.includes('.svelte'));
    arrSvelteFiles.forEach((el) => componentNames.push(`<${el.url.split('').reverse().join('').slice(7, el.url.split('').reverse().join('').indexOf('/')).split('').reverse().join('')} />`));

    arrSvelteFiles.map((resource) => {
      resource.getContent((source) => {
        if (source) {

          const ast = svelte.parse(source);


          function compositeDataTypeFoundInAST(node) {
            if (node.type === 'Literal') {
              return node.value;
            }

            if (node.type === 'ArrayExpression') {
              if (node.elements[0].type === 'Literal') {
                return node.elements;
              } else {
                const arr = [];
                for (let i = 0; i < node.elements.length; i += 1) {
                  arr.push(compositeDataTypeFoundInAST(node.elements[i]))
                }
                return arr;
              }

              } else {
                const obj = {};    
                for (let i = 0; i < node.properties.length; i += 1) {
                  if (node.properties[i].value.type === 'Literal') {
                      obj[node.properties[i].key.name || node.properties[i].key.value] = node.properties[i].value.value

                  } else {
                    obj[node.properties[i].key.name] = compositeDataTypeFoundInAST(node.properties[i].value);
                  }
                }
                return obj;
              }
          }



          function createNode() {

            const obj = {};
            const t1 = {};
            const t2 = {};
            const elementOfD3PreTree = {};

            // Find dependencies (via import statements) of current svelte component/file and store the dep in the asset for said svelte component/file
            ast.instance.content.body.forEach(function(el) {
              if (el.type === "ImportDeclaration" && el.source.value.indexOf('.svelte') !== -1) {
                t1[`<${el.source.value.slice(2, el.source.value.length - 7)} />`] = {};
              }
            })
            
            if (Object.entries(t1).length !== 0) {
              obj[componentNames[i]] = t1;
            } else {
              obj[componentNames[i]] = {};
            }
            


            svelte.walk(ast, {
              enter(node, parent, prop, index) {
                
                if (node.hasOwnProperty('declarations')) {


                  // For variable declarations that either have not been initialized or have a value that is equal to 'null'
                  if (!node.declarations[0].init) {
                    t2[node.declarations[0].id.name] = node.declarations[0].init;

                    Object.defineProperty(obj[componentNames[i]], 'State', {
                      value: t2,
                      configurable: true,
                      writable: true,
                      enumerable: false,
                    });
                    

                  // For variable declarations that have a value that is a primitive data type or is a "literal"
                  } else if (node.declarations[0].init.type === "Literal") {
                    t2[node.declarations[0].id.name] = node.declarations[0].init.value;

                    Object.defineProperty(obj[componentNames[i]], 'State', {
                      value: t2,
                      configurable: true,
                      writable: true,
                      enumerable: false,
                    });
                  

                  // For variable declarations that have a value that is a composite data
                  } else if (node.declarations[0].init.type === "ObjectExpression" || node.declarations[0].init.type === "ArrayExpression") {
                    t2[node.declarations[0].id.name] = compositeDataTypeFoundInAST(node.declarations[0].init);

                    Object.defineProperty(obj[componentNames[i]], 'State', {
                      value: t2,
                      configurable: true,
                      writable: true,
                      enumerable: false,
                    });
                  }
                }
              },
              leave(node, parent, prop, index) {
                // do_something_else(node);
              }
            })

            if (Object.entries(obj).length !== 0) {
              unorderedListOfNodes.push(obj);
              
              // For D3
              elementOfD3PreTree[componentNames[i]] = t2;
              D3PreTree.push(elementOfD3PreTree);
            }
          }
          createNode();
          i += 1;
        }
      })
    })

    //retrieves each urls and pushes onto urls array
    for (let i = 0; i < arrSvelteFiles.length; i++) {
        urls.push(JSON.parse(JSON.stringify(arrSvelteFiles[i])))
        arrSvelteFiles[i].getContent(content => {
          AST.push(svelte.parse(content))
        })
     }
    
    // runs next logic after async svelte.parse is completed
    setTimeout(()=> {
      // modified D3PreTree so that it fits for D3 statify function
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
</script>


<main>
  <ViewsContainer />
  <RightContainer />
</main>

<style>
	main {
		height: 100%;
		width: 100%;
		margin: 0;
		padding: 0;
		display: grid;
    grid-template-columns: minmax(0, 60%) minmax(0, 40%);
	}

	ViewsContainer {
    grid-column: 1 / span 1;
	}

	RightContainer {
    grid-column: 2 / span 1;
	}
</style>
