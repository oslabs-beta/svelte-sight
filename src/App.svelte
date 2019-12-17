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

      //declare global variable object to assemble component template
      let bigData = {}

      //mapped out ASTP array so that it is easier to access the node that contains import declaration
      //iterated through the AST array and modified the source key to later match with url array to 
      // combined into bigData object
      AST = AST.map(obj => obj.instance.content.body)
      for (let i = 0; i < AST.length; i++) {
        AST[i] = AST[i].filter(node=> node.type === "ImportDeclaration")
        for (let j = 0; j < AST[i].length; j++) {
          if (AST[i][j].source.value !== 'svelte') {
            let obj = {}
            obj.type = AST[i][j].type
            obj.source = AST[i][j].source.value.split('')
            obj.source.shift()
            obj.source.shift()
            obj.source = obj.source.join('')
            obj.source = obj.source.replace('.svelte', '')
            AST[i][j] = obj
          } else {
            let obj = {}
            obj.type = AST[i][j].type
            obj.source = AST[i][j].source.value
            AST[i][j] = obj
          }
        }
      }

      // modified the url array to match with AST array and then combined into 
      // bigData object
      for (let i = 0 ; i < urls.length; i++) {
        for (let j = urls[i].url.length - 1; j > 0; j--) {
          if (urls[i].url[j] === '/') {
            urls[i].url = urls[i].url.slice(j+1, urls[i].url.length).replace('.svelte', '')
          }
        }
        bigData[urls[i].url] = AST[i]
      }

      //iterate through bigData and made parent/child object and pushed into componentTemplate array
      let componentTemplate = []
      function componentChildren(bigObj) {
        for (let eachKey in bigObj) {
          for (let eachObj of bigObj[eachKey]) {
            if (eachObj.type == 'ImportDeclaration' && eachObj.source !== 'svelte') {
              let obj={}
              obj.parent = eachKey
              obj.child = eachObj.source
              componentTemplate.push(obj)
            }
          }
        }
      }
      componentChildren(bigData)
      
      // added special obj for the top parent component for D3 stratifyy function to successfully create relevant array
      for (let i=0; i < componentTemplate.length; i++) {
        let obj = {}
        obj.child = componentTemplate[i].parent
        if (componentTemplate.every(object => object.child !== obj.child)) {
          if (obj.child !== '') {
            obj.parent = ''
          	componentTemplate.unshift(obj)
          }     
        }
      }

      // combined data from newD3Pre into componentTemplate to render state/props onto panel with D3JS
      for (let i = 0; i < componentTemplate.length; i++) {
        for (let j = 0; j < newD3Pre.length; j++) {
          if (componentTemplate[i].child === Object.keys(newD3Pre[j])[0]) {
            componentTemplate[i].data = Object.values(newD3Pre[j])[0]
          }
        }
      }

      // modified componentTemplate for data that has no States and/or Prop to render appropriate states for users
      // modified the data to show only Props keys for better user experience
      for (let i = 0; i < componentTemplate.length; i++) {
        if (!componentTemplate[i].hasOwnProperty('data')) {
          componentTemplate[i].data = {State : 'No States!', Props : "No Props!"}
        } else if (Object.keys(componentTemplate[i].data.Props).length === 0) {
          componentTemplate[i].data.Props = "No Props!"
        } else {
          let result = []
          componentTemplate[i].data.Props = result.concat(Object.keys(componentTemplate[i].data.Props))
        }
      }

      // finally create templateStructured for D3 using D3.stratify function
      let templateStructured = d3.stratify()
                                  .id(function(d){return d.child})
																	.parentId(function(d){return d.parent})
																	(componentTemplate)

      // D3 starting

      // margin & width

      let margin = {top: 30, right: 0, bottom: 30, left: 0},
      width = 400 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

      // append the svg object to the id tree-root of the page
      // appends a 'group' element to 'svg'
      // moves the 'group' element to the top left margin
      let svg = d3.select("#tree-root").append("svg")
          .attr("width", width)
          .attr("height", height)
          .attr('margin-left', '10px')
        .append("g")
          .attr("transform", "translate("
                + -20 + "," + margin.top + ")")

      // speed of collapse and delcared root to be the premade template
      let i = 0,
          duration = 1300,
          root = templateStructured

      // declares a tree layout and assigns the size
      let treemap = d3.tree().size([400, 500]);





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
