<script>
  import svelte from 'svelte/compiler';
  // Refresh page
  let refreshPage = true;
  // DevTools Page Connection to Background
  const backgroundPageConnection = chrome.runtime.connect({
    name: 'panel'
  });
  backgroundPageConnection.postMessage({
    name: 'init',
    tabId: chrome.devtools.inspectedWindow.tabId
  }); 
  backgroundPageConnection.onMessage.addListener(() => {
    console.log('in backgroundPageConnection onMessage App.svelte');
    getData();
    refreshPage = false;
  });
  //// 
  // Function to color code JSON objects
  function syntaxHighlight(json) {
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        var cls = 'number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'key';
            } else {
                cls = 'string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'boolean';
        } else if (/null/.test(match)) {
            cls = 'null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
  }
  // Conditional rendering 
  const getData = (tab) => { 
    const viewsRoot = document.getElementById('views-root');
    const statesRoot = document.getElementById('states-root');
    const propsRoot = document.getElementById('props-root');
    const chartRoot = document.getElementById('chart-root');
  	// globals
		let i = 0;
    const componentNames = [];
    const D3PreTree = [];
    const unorderedListOfNodes = [];  // This is a pre- or partial tree with known relationships among componenets/files that go only 1 layer deep (this is all we need to build the rest of the tree)
    let componentTree;
		chrome.devtools.inspectedWindow.getResources((resources) => {
      const arrSvelteFiles = resources.filter(file => file.url.includes('.svelte'));
      
      arrSvelteFiles.forEach((el) => componentNames.push(`<${el.url.split('').reverse().join('').slice(7, el.url.split('').reverse().join('').indexOf('/')).split('').reverse().join('')} />`))
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
              const node = {};
              const t1 = {};
              const t2 = {};
              const t3 = {};
              const elementOfD3PreTree = {};
              // Find dependencies (via import statements) of current svelte component/file and store the dep in the node for said svelte component/file
              ast.instance.content.body.forEach(function(el) {
                if (el.type === "ImportDeclaration" && el.source.value.indexOf('.svelte') !== -1) {
                  t1[`<${el.source.value.slice(2, el.source.value.length - 7)} />`] = {};
                }
              })
              
              if (Object.entries(t1).length !== 0) {
                node[componentNames[i]] = t1;
              } else {
                node[componentNames[i]] = {};
              }
              
              // Find props (via export statements) of current svelte component/file and store the props in the node for said svelte component/file
              ast.instance.content.body.forEach(function(el) {
                if (el.type === "ExportNamedDeclaration") {
                  t3[el.declaration.declarations[0].id.name] = null;
                }
              })
              Object.defineProperty(node[componentNames[i]], 'Props', {
                value: t3,
                configurable: true,
                writable: true,
                enumerable: false,
              });
              svelte.walk(ast, {
                enter(ASTnode, parent, prop, index) {
                  
                  if (ASTnode.hasOwnProperty('declarations')) {
                    // For variable declarations that either have not been initialized or have a value that is equal to 'null'
                    if (!ASTnode.declarations[0].init) {
                      t2[ASTnode.declarations[0].id.name] = ASTnode.declarations[0].init;
                      Object.defineProperty(node[componentNames[i]], 'State', {
                        value: t2,
                        configurable: true,
                        writable: true,
                        enumerable: false,
                      });
                      
                    // For variable declarations that have a value that is a primitive data type or is a "literal"
                    } else if (ASTnode.declarations[0].init.type === "Literal") {
                      t2[ASTnode.declarations[0].id.name] = ASTnode.declarations[0].init.value;
                      Object.defineProperty(node[componentNames[i]], 'State', {
                        value: t2,
                        configurable: true,
                        writable: true,
                        enumerable: false,
                      });
                    
                    // For variable declarations that have a value that is a composite data
                    } else if (ASTnode.declarations[0].init.type === "ObjectExpression" || ASTnode.declarations[0].init.type === "ArrayExpression") {
                      t2[ASTnode.declarations[0].id.name] = compositeDataTypeFoundInAST(ASTnode.declarations[0].init);
                      Object.defineProperty(node[componentNames[i]], 'State', {
                        value: t2,
                        configurable: true,
                        writable: true,
                        enumerable: false,
                      });
                    }
                  }
                },
                leave(ASTnode, parent, prop, index) {
                  // do_something_else(ASTnode);
                }
              })
              if (Object.entries(node).length !== 0) {
                unorderedListOfNodes.push(node);
                
                // For D3
                const temp = {};
                temp['State'] = t2;
                temp['Props'] = t3;
                elementOfD3PreTree[componentNames[i]] = temp;
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
            if (i === componentNames.length - 1) {
              
              componentTree = unorderedListOfNodes[0];
              unorderedListOfNodes.shift();
              createTree(unorderedListOfNodes);
              console.log('')
              console.log('FINALunorderedListOfNodes', unorderedListOfNodes, JSON.stringify(unorderedListOfNodes))
              console.log('FINALcomponentTree: ', componentTree)
              console.log('D3PreTree', D3PreTree);  // For D3
              // Raw Tab
              // if (tab === 'raw') {
              //   viewsRoot.innerHTML = '';
              //   const pre = document.createElement('pre');
              //   const prettyJSON = JSON.stringify(componentTree, null, 3);
              //   pre.innerHTML = syntaxHighlight(prettyJSON);
              //   viewsRoot.appendChild(pre);
              // }
              //////////////////// TESTING HIDDEN STATE //////////////////
              // console.log(componentTree['<App />'].hasOwnProperty('State'))
              // if (componentTree['<App />'].hasOwnProperty('State')) {
              //   Object.defineProperty(componentTree['<App />'], 'State', {
              //     enumerable: true,
              //   });
              //   console.log('FINALcomponentTree: ', componentTree)
              // }
            }
            i += 1
        }})
      })
		  // globals for D3 component treee
		let AST = []
    let urls = []
    
    //retrieves each urls and pushes onto urls array and pushes contents into AST array
		for (let i = 0; i < arrSvelteFiles.length; i++) {
        urls.push(JSON.parse(JSON.stringify(arrSvelteFiles[i])))
        arrSvelteFiles[i].getContent(content => {
          AST.push(svelte.parse(content))
          
        })
     }
     // runs next logic after async svelte.parse is completed
  setTimeout(() => {
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
        temp[key] = value
        newD3Pre.push(temp)
      }

      //declare global variable object to assemble component template
      let bigData= {}


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
  
  
  //D3 rendering
  function chartRender(template) {
      /////////// Margin and svg for tree
      let i = 0,
        duration = 400,
        root = template;
   let margin = {top: 30, right: 0, bottom: 30, left: 0},
      width = 400 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;
      // append the svg object to the body of the page
      // appends a 'group' element to 'svg'
      // moves the 'group' element to the top left margin
      let svg = d3.select(chartRoot).append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr('margin-left', '10px')
        .append("g")
        .attr("transform", "translate("
              + -20 + "," + margin.top + ")")
      // declares a tree layout and assigns the size
      let treemap = d3.tree().size([400, 500]);
  ///////start of tree
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
          .on('click', click)
          .on('mouseover', function(d) {
            let statesRendered = document.createElement('pre');
            let propsRendered = document.createElement('pre');
            statesRoot.innerHTML = '';
            propsRoot.innerHTML = '';
            statesRendered.innerHTML = syntaxHighlight(JSON.stringify(d.data.data.data.State, null, 2));
            statesRoot.appendChild(statesRendered);
            propsRendered.innerHTML = syntaxHighlight(JSON.stringify(d.data.data.data.Props, null, 2));
            propsRoot.appendChild(propsRendered);
          })
        // Add Circle for the nodes
        nodeEnter.append('circle')
            .attr('class', 'node')
            .attr('r', 1e-6)
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
            .style('fill', 'rgb(77, 166, 255)')
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
              return d._children ? "rgb(194, 160, 251)" : "rgb(16, 122, 117)";
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
        // ****************** links section ***************************
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
        // Toggle children on click.git 
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
  }
  // end of chartRender function
  function treeRender(template) {
    let duration = 400;
    //////Margin and svg for collapsible
    let margin = {top: 30, right: 20, bottom: 30, left: 20},
        width = 480,
        barHeight = 20,
        barWidth = (width - margin.left - margin.right) * 0.8;
       
   
      let svg = d3.select(viewsRoot).append('svg')
      .attr('width', 400).attr('height', 600)
      .append('g').attr('transform', 'translate(0, 50)');
    
      // declares a tree layout and assigns the size
      let treemap = d3.tree().size([400, 500]);
      console.log('treemap is', treemap)
/////// start of collapsible
      let new_root;
      let diagonal = d3.linkHorizontal()
        .x(function(d) { return d.y; })
        .y(function(d) { return d.x; });
  
      
      new_root = d3.hierarchy(template);
      new_root.x0 = 0;
      new_root.y0 = 0;
      update(new_root);
      function update(source) {
  // Compute the flattened node list.
  let nodes = new_root.descendants();
  let height = Math.max(500, nodes.length * barHeight + margin.top + margin.bottom);
  d3.select("svg").transition()
      .duration(duration)
      .attr("height", height);
  d3.select(self.frameElement).transition()
      .duration(duration)
      .style("height", height + "px");
  // Compute the "layout". TODO https://github.com/d3/d3-hierarchy/issues/67
  let index = -1;
  new_root.eachBefore(function(n) {
    n.x = ++index * barHeight;
    n.y = n.depth * 20;
  });
  // Update the nodes…
  let node = svg.selectAll(".node")
    .data(nodes, function(d) { return d.id || (d.id = ++i); });
  let nodeEnter = node.enter().append("g")
      .attr("class", "node")
      .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
      .style("opacity", 0);
  // Enter any new nodes at the parent's previous position.
  nodeEnter.append("rect")
      .attr('cursor', 'pointer')
      .attr("y", -barHeight / 2)
      .attr("height", barHeight)
      .attr("width", barWidth)
      .style("fill", 'rgb(37, 42, 50)')
      .on("click", click)
      .on('mouseover', function(d) {
            let statesRendered = document.createElement('pre')
            let propsRendered = document.createElement('pre')
            statesRoot.innerHTML = '';
            propsRoot.innerHTML = '';
            console.log('inside mouseover', d.data)
            statesRendered.innerHTML = syntaxHighlight(JSON.stringify(d.data.data.data.State, null, 2));
            statesRoot.appendChild(statesRendered)
            console.log('wtf is this hist,', Object.keys(d.data.data.data.Props))
            propsRendered.innerHTML = syntaxHighlight(JSON.stringify(d.data.data.data.Props, null, 2));
            propsRoot.appendChild(propsRendered)
      })
  nodeEnter.append("text")
      .attr("dy", 3.5)
      .attr("dx", 5.5)
      .style('fill', 'white')
      .attr('cursor', 'pointer')
      .on("click", click)
      .text(function(d) { return d.data.id; });
  // Transition nodes to their new position.
  nodeEnter.transition()
      .duration(duration)
      .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; })
      .style("opacity", 1);
  node.transition()
      .duration(duration)
      .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; })
      .style("opacity", 1)
      .select("rect")
      .style("fill", 'rgb(37, 42, 50)');
  // Transition exiting nodes to the parent's new position.
  node.exit().transition()
      .duration(duration)
      .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
      .style("opacity", 0)
      .remove();
    // Stash the old positions for transition.
    new_root.each(function(d) {
      d.x0 = d.x;
      d.y0 = d.y;
    });
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
    function color(d) {
      return d._children ? "#3182bd" : d.children ? "#c6dbef" : "#fd8d3c";
    }
    ///////end of collapsible
  }
  // end treeRender function
    switch (tab) {
      case 'tree':
        viewsRoot.innerHTML = '';
        chartRoot.innerHTML = '';
        treeRender(templateStructured);
        break;
      case 'chart':
        viewsRoot.innerHTML = '';
        chartRoot.innerHTML = '';
        chartRender(templateStructured);
        break;
      case 'raw':
        viewsRoot.innerHTML = '';
        chartRoot.innerHTML = '';
        statesRoot.innerHTML = '';
        propsRoot.innerHTML = '';
        const pre = document.createElement('pre');
        const prettyJSON = JSON.stringify(componentTree, null, 2);
        pre.innerHTML = syntaxHighlight(prettyJSON);
        viewsRoot.appendChild(pre);
        break;
    }
  }, 100)
})
		// end D3 Tree logic
}
</script>

<div id="views-navbar">
  <button on:click={() => getData('tree')}>Tree</button>
  <button on:click={() => getData('chart')}>Chart</button>
  <button on:click={() => getData('raw')}>Raw</button>

  {#if refreshPage}
    <div id='load-screen'>
      <div id='refresh'>Please refresh your Svelte application</div>
      <div class="loadingio-spinner-interwind-cjqvhe7g9xe"><div class="ldio-qgqa75k37hd"><div><div><div><div></div></div></div><div><div><div></div></div></div></div></div></div>
    </div>
  {/if}
</div>

<style>
  #views-navbar {
    background-color: rgb(53, 60, 69);
    border-bottom: 1px solid rgb(70, 80, 90);
  }
  #load-screen {
    position: fixed;
    height: 100%;
    width: 100%;
    background-color: rgb(25, 25, 25);
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
  }
  #refresh {
    color: white;
    font-size: 1.25rem;
  }
  /* Loading Icon */
  @keyframes ldio-qgqa75k37hd-r {
    0%, 100% { animation-timing-function: cubic-bezier(0.2 0 0.8 0.8) }
    50% { animation-timing-function: cubic-bezier(0.2 0.2 0.8 1) }
    0% { transform: rotate(0deg) }
    50% { transform: rotate(180deg) }
    100% { transform: rotate(360deg) }
  }
  @keyframes ldio-qgqa75k37hd-s {
    0%, 100% { animation-timing-function: cubic-bezier(0.2 0 0.8 0.8) }
    50% { animation-timing-function: cubic-bezier(0.2 0.2 0.8 1) }
    0% { transform: translate(-19px,-19px) scale(0) }
    50% { transform: translate(-19px,-19px) scale(1) }
    100% { transform: translate(-19px,-19px) scale(0) }
  }
  .ldio-qgqa75k37hd > div { transform: translate(0px,-9.5px) }
  .ldio-qgqa75k37hd > div > div {
    animation: ldio-qgqa75k37hd-r 1.6949152542372878s linear infinite;
    transform-origin: 50px 50px;
  }
  .ldio-qgqa75k37hd > div > div > div {
    position: absolute;
    transform: translate(50px, 38.6px);
  }
  .ldio-qgqa75k37hd > div > div > div > div {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background: #f80000;
    animation: ldio-qgqa75k37hd-s 1.6949152542372878s linear infinite;
  }
  .ldio-qgqa75k37hd > div > div:last-child {
    animation-delay: -0.8474576271186439s;
  }
  .ldio-qgqa75k37hd > div > div:last-child > div > div {
    animation-delay: -0.8474576271186439s;
    background: #faa44a;
  }
  .loadingio-spinner-interwind-cjqvhe7g9xe {
    width: 94px;
    height: 94px;
    display: inline-block;
    overflow: hidden;
    background: none;
  }
  .ldio-qgqa75k37hd {
    width: 100%;
    height: 100%;
    position: relative;
    transform: translateZ(0) scale(0.94);
    backface-visibility: hidden;
    transform-origin: 0 0; /* see note above */
  }
  .ldio-qgqa75k37hd div { box-sizing: content-box; }
</style>