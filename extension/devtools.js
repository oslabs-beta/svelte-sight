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
        
        arrSvelteFiles.forEach((el) => componentNames.push(`<${el.url.split('').reverse().join('').slice(7, el.url.split('').reverse().join('').indexOf('/')).split('').reverse().join('')} />`));

        arrSvelteFiles.map((resource) => {
          resource.getContent((source) => {
            if (source) {

              const ast = svelte.parse(source);


              function createAsset() {
                const obj = {};
                const t1 = {};
                const t2 = {};

                ast.instance.content.body.forEach(function(el) {
                  if (el.type === "ImportDeclaration" && el.source.value.indexOf('.svelte') !== -1) {
                    t1[`<${el.source.value.slice(2, el.source.value.length - 7)} />`] = null;
                  }
                })
                
                if (Object.entries(t1).length !== 0) {
                  obj[componentNames[i]] = t1;
                } else {
                  obj[componentNames[i]] = null;
                }


                svelte.walk(ast, {
                  enter(node, parent, prop, index) {
                    if (node.hasOwnProperty('declarations')) {


                      // For variable declarations that either have not been initialized or have a value that is equal to 'null'
                      if (!node.declarations[0].init) { // || node.declarations[0].init.type === "Literal") {
                        t2[node.declarations[0].id.name] = node.declarations[0].init;
                        obj['state'] = t2;

                        
                      // // For variable declarations that have a value that is a primitive data type or is a "literal"
                      } else if (node.declarations[0].init.type === "Literal") {
                        t2[node.declarations[0].id.name] = node.declarations[0].init.value;
                        obj['state'] = t2;
                      

                      // For variable declarations that have a value that is a composite data
                      } else if (node.declarations[0].init.type === "ObjectExpression" || node.declarations[0].init.type === "ArrayExpression") {
                        t2[node.declarations[0].id.name] = compositeDataTypeFoundInAST(node.declarations[0].init);
                        obj['state'] = t2;
                      }
                    }
                  },
                  leave(node, parent, prop, index) {
                    // do_something_else(node);
                  }
                })


                if (Object.entries(obj).length !== 0) {
                  unorderedListOfNodesForDependencyGraph.push(obj);
                }
              }
              createAsset();
            }
          })
        })
      })
    )
  }
)
