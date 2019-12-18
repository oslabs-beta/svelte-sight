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




          function createTree(arr) {
            for (let j = 0; j < arr.length; j += 1) {
              let success = 0;

              function searchTree(tree, keyToSearchFor, valToSubstituteIfKeyIsFound) {
                // console.log('componentTree: ', componentTree)
                // console.log('tree: ', tree)
                for(let key in tree) {
                  // console.log(`${key} === ${keyToSearchFor}?`)
                  if (key === keyToSearchFor) {
                      tree[key] = valToSubstituteIfKeyIsFound;
                      arr.splice(j, 1);
                      success += 1;
                      return true;
                  }
                  if (Object.entries(tree[key]).length !== 0 && searchTree(tree[key], keyToSearchFor, valToSubstituteIfKeyIsFound)) {
                    return true;
                  }
                }
                return false;
              }

              for (let key in arr[j]) {

                // if the value of a key in the object in the unorderedArray is not null (an object and therefore has dependencies)
                if (Object.entries(arr[j][key]).length !== 0) {  // testing top-most component (second level)
                  for (let keyOfKey in arr[j][key]) {
                    for(let masterKey in componentTree) {
                      if (keyOfKey === masterKey) {
                        arr[j][key][keyOfKey] = componentTree[masterKey]
                        componentTree = arr[j];
                        arr.splice(j, 1);
                        success += 1;
                      }
                    }
                  }
                }
              }
              for (let key in arr[j]) {
                if (!success) {
                  searchTree(componentTree, key, arr[j][key])
                }
              }
              if (success) {
                j -= success;
                success = 0;
              }
            }
            if (arr.length !== 0) {
              createTree(arr);
            }
          }

          // This is where logic should be placed for anything dependent on this async operation
          if (i === componentNames.length - 1) {
            
            componentTree = unorderedListOfNodes[0];
            unorderedListOfNodes.shift();
            createTree(unorderedListOfNodes);

            const root = document.getElementById('states-root');
            const p = document.createElement('pre');
            p.textContent += JSON.stringify(componentTree, null, 3);
            root.appendChild(p);
          }
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

      // Assigns parent, children, height, depth
      root = d3.hierarchy(templateStructured, function(d) { return d.children; });
      root.x0 = height / 2;
      root.y0 = 0;

      // Collapse after the second level
      root.children.forEach(collapse);

      update(root);

      // Collapse the node and all it's children
      function collapse(d) {
        if(d.children) {
          d._children = d.children
          d._children.forEach(collapse)
          d.children = null
        }
      }

      function update(source) {

        // Assigns the x and y position for the nodes
        let treeData = treemap(root);

        // Compute the new tree layout.
        let nodes = treeData.descendants(),
            links = treeData.descendants().slice(1);

        // Normalize for fixed-depth.
        nodes.forEach(function(d){ d.y = d.depth * 70});

        // ****************** Nodes section ***************************

        // Update the nodes...
        let node = svg.selectAll('g.node')
            .data(nodes, function(d) {return d.id || (d.id = ++i); });

        // Enter any new modes at the parent's previous position.
        let nodeEnter = node.enter().append('g')
            .attr('class', 'node')
            .attr("transform", function(d) {
              return "translate(" + source.y0 + "," + source.x0 + ")";
          })
          // implemented click funciton to expend/collapse
          // implemented mouseover funciton to show States/Props on states-root
          .on('click', click)
          .on('mouseover', function(d) {
            let statesRendered = document.createElement('pre')
            let propsRendered = document.createElement('pre')
            statesRendered.innerText = `States for ${d.data.id} : ${JSON.stringify(d.data.data.data.State, null, 2)}`
            document.getElementById('states-root').appendChild(statesRendered)
            propsRendered.innerText = `Props for ${d.data.id} :  ${JSON.stringify(d.data.data.data.Props, null, 2)}`
            document.getElementById('states-root').appendChild(propsRendered)

          })
          .on("mouseout", function() {
          // Remove the info text on mouse out.
          let rendered = document.querySelectorAll('pre')
          document.getElementById('states-root').innerHTML = ''
        });

        // Add Circle for the nodes
        nodeEnter.append('circle')
            .attr('class', 'node')
            .attr('r', 1e-6)
            .style("fill", function(d) {
                return d._children ? "lightsteelblue" : "#fff";
            });

        // Add labels for the nodes
        nodeEnter.append('text')
            .attr("dy", ".35em")
            .attr("y", function(d) {
                return d.children || d._children ? -20 : 20;
            })
            
            .attr("text-anchor", function(d) {
                return d.children || d._children ? "end" : "start";
            })
            .text(function(d) { return d.data.id; })
            .style('fill', 'darkblue')

        // UPDATE
        let nodeUpdate = nodeEnter.merge(node);

        // Transition to the proper position for the node
        nodeUpdate.transition()
          .duration(duration)
          .attr("transform", function(d) { 
              return "translate(" + d.x + "," + d.y + ")";
          });

        // Update the node attributes and style
        nodeUpdate.select('circle.node')
          .attr('r', 10)
          .style("fill", function(d) {
              return d._children ? "lightsteelblue" : "#fff";
          })
          .attr('cursor', 'pointer');


        // Remove any exiting nodes
        let nodeExit = node.exit().transition()
            .duration(duration)
            .attr("transform", function(d) {
                return "translate(" + source.x + "," + source.y + ")";
            })
            .remove();

        // On exit reduce the node circles size to 0
        nodeExit.select('circle')
          .attr('r', 1e-6);

        // On exit reduce the opacity of text labels
        nodeExit.select('text')
          .style('fill-opacity', 1e-6)
          .style('fill', 'white')

        // Update the links...
        let link = svg.selectAll('path.link')
            .data(links, function(d) { return d.id; });

        // Enter any new links at the parent's previous position.
        let linkEnter = link.enter().insert('path', "g")
            .attr("class", "link")
            .attr('d', function(d){
              let o = {x: source.x0, y: source.y0}
              return diagonal(o, o)
            })
            .style('fill', 'none')
            .style('stroke', 'white')
            // .style('stroke-width, 2px')

        // UPDATE
        let linkUpdate = linkEnter.merge(link);

        // Transition back to the parent element position
        linkUpdate.transition()
            .duration(duration)
            .attr('d', function(d){ return diagonal(d, d.parent) });

        // Remove any exiting links
        let linkExit = link.exit().transition()
            .duration(duration)
            .attr('d', function(d) {
              let o = {x: source.x, y: source.y}
              return diagonal(o, o)
            })
            .remove();

        // Store the old positions for transition.
        nodes.forEach(function(d){
          d.x0 = d.x;
          d.y0 = d.y;
        });

        // Creates a curved (diagonal) path from parent to the child nodes
        function diagonal(s, d) {

        let path = 
                  "M" + s.x + "," + s.y + " C " + 
                  s.x + "," + (s.y + d.y)/2 + " " + 
                  d.x + "," + (s.y + d.y)/2 + " " + 
                  d.x + "," + d.y
          return path
        }

        // Toggle children on click. 
        function click(d) {
          if (d.children) {
              d._children = d.children;
              d.children = null;       
            } else {
              d.children = d._children;
              d._children = null;
            }
          update(d);
        }
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
