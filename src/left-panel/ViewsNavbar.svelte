<script>
  import svelte from "svelte/compiler";
  import exploreCompositeDataType from "../utils/exploreCompositeDataType";
  import * as d3ChartRender from "../utils/d3ChartRender";
  import * as d3TreeRender from "../utils/d3TreeRender";
  import syntaxHighlight from "../utils/syntaxHighlight";

  // Refresh page
  let refreshPage = true;

  // DevTools Page Connection to Background
  const backgroundPageConnection = chrome.runtime.connect({
    name: "panel"
  });
  backgroundPageConnection.postMessage({
    name: "init",
    tabId: chrome.devtools.inspectedWindow.tabId
  });
  backgroundPageConnection.onMessage.addListener(() => {
    getData("tree");
    refreshPage = false;
  });

  // Generate views
  const getData = tab => {
    const viewsRoot = document.getElementById("views-root");
    const statesRoot = document.getElementById("states-root");
    const propsRoot = document.getElementById("props-root");
    const chartRoot = document.getElementById("chart-root");
    
    let i = 0;
    let componentNames = [];
    const D3PreTree = [];
    // This is a pre- or partial tree with known relationships among componenets/files that go only 1 layer deep (this is all we need to build the rest of the tree)
    const unorderedListOfNodes = [];
    let componentTree;

    const createNode = (ast) => {
      const node = {};
      const dependencies = {};
      const state = {};
      const props = {};
      const elementOfD3PreTree = {};

      ast.instance.content.body.forEach((el) => {
        // Find dependencies (via import statements) of current svelte component/file and store the dep in the node for said svelte component/file
        if (
          el.type === "ImportDeclaration" &&
          el.source.value.includes(".svelte")
        ) {
          const componentName = `<${el.source.value.slice(2, el.source.value.length - 7)} />`;
          dependencies[componentName] = {};
        } 
        // Find props (via export statements) of current svelte component/file and store the props in the node for said svelte component/file
        else if (el.type === "ExportNamedDeclaration") {
          props[el.declaration.declarations[0].id.name] = null;
        }
      });

      node[componentNames[i]] = Object.keys(dependencies).length ? dependencies : {};

      Object.defineProperty(node[componentNames[i]], "Props", {
        value: props,
        configurable: true,
        writable: true,
        enumerable: false
      });

      svelte.walk(ast, {
        enter(ASTnode, parent, prop, index) {
          if (ASTnode.hasOwnProperty("declarations")) {
            // For variable declarations that either have not been initialized or have a value that is equal to "null"
            if (!ASTnode.declarations[0].init) {
              state[ASTnode.declarations[0].id.name] = ASTnode.declarations[0].init;
            } 
            // For variable declarations that have a value that is a primitive data type or is a "Literal"
            else if (ASTnode.declarations[0].init.type === "Literal") {
              state[ASTnode.declarations[0].id.name] = ASTnode.declarations[0].init.value;
            } 
            // For variable declarations that have a value that is a composite data type
            else if (
              ASTnode.declarations[0].init.type === "ObjectExpression" ||
              ASTnode.declarations[0].init.type === "ArrayExpression"
            ) {
              state[ASTnode.declarations[0].id.name] = exploreCompositeDataType(ASTnode.declarations[0].init);
            }

            Object.defineProperty(node[componentNames[i]], "State", {
              value: state,
              configurable: true,
              writable: true,
              enumerable: false
            });
          }
        },
        leave(ASTnode, parent, prop, index) {
          // doSomethingElse(ASTnode) if required
        }
      });

      if (Object.keys(node).length) {
        unorderedListOfNodes.push(node);

        // For D3
        const temp = {};
        temp["State"] = state;
        temp["Props"] = props;
        elementOfD3PreTree[componentNames[i]] = temp;
        D3PreTree.push(elementOfD3PreTree);
      }
    }

    const createTree = (arr) => {
      for (let j = 0; j < arr.length; j += 1) {
        let success = 0;

        const searchTree = (
          tree,
          keyToSearchFor,
          valToSubstituteIfKeyIsFound
        ) => {
          for (const key in tree) {
            if (key === keyToSearchFor) {
              tree[key] = valToSubstituteIfKeyIsFound;
              arr.splice(j, 1);
              success += 1;
              return true;
            }
            if (
              Object.keys(tree[key]).length &&
              searchTree(
                tree[key],
                keyToSearchFor,
                valToSubstituteIfKeyIsFound
              )
            ) {
              return true;
            }
          }
          return false;
        }

        for (const key in arr[j]) {
          // If an unordered array node has keys that are not null (an object and therefore has dependencies)
          if (Object.keys(arr[j][key]).length > 0) {
            // testing top-most component (second level)
            for (const nestedKey in arr[j][key]) {
              for (const masterKey in componentTree) {
                if (nestedKey === masterKey) {
                  arr[j][key][nestedKey] = componentTree[masterKey];
                  componentTree = arr[j];
                  arr.splice(j, 1);
                  success += 1;
                }
              }
            }
          }
        }

        for (const key in arr[j]) {
          if (!success) {
            searchTree(componentTree, key, arr[j][key]);
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

    // Get resources of inspected program and generate views
    chrome.devtools.inspectedWindow.getResources(resources => {
      const arrSvelteFiles = resources.filter(file =>file.url.includes(".svelte"));
      componentNames = arrSvelteFiles.map(svelteFile =>`<${svelteFile.url.slice(7, el.url.indexOf("/"))} />`);

      arrSvelteFiles.forEach(svelteFile => {
        svelteFile.getContent(source => {
          if (source) {
            const ast = svelte.parse(source);
            createNode(ast);

            if (i === componentNames.length - 1) {
              componentTree = unorderedListOfNodes[0];
              unorderedListOfNodes.shift();
              createTree(unorderedListOfNodes);
            }
            i += 1;
          }
        });
      });

      // For D3 component tree
      let AST = [];
      let urls = [];

      // retrieves URLs from Svelte files and adds them to urls array
      // adds each Svelte file's contents to AST array
      for (let i = 0; i < arrSvelteFiles.length; i++) {
        urls.push(JSON.parse(JSON.stringify(arrSvelteFiles[i])));
        arrSvelteFiles[i].getContent(content => {
          AST.push(svelte.parse(content));
        });
      }

      /* ---- D3 ---- */
      // executes after svelte.parse is completed
      setTimeout(() => {
        // modified D3PreTree so that it fits for D3 stratify function
        const newD3Pre = [];
        for (let eachObj of D3PreTree) {
          let temp = {};
          let key = Object.keys(eachObj)[0];
          let value = Object.values(eachObj)[0];
          key = key.split("");
          key.shift();
          key.pop();
          key.pop();
          key.pop();
          key = key.join("");
          temp[key] = value;
          newD3Pre.push(temp);
        }

        // declare object to assemble component template
        let bigData = {};

        // map out AST array so that it is easier to access the node that contains import declaration
        // iterated through the AST array and modified the source key to later match with url array to
        // combined into bigData object
        AST = AST.map(obj => obj.instance.content.body);
        for (let i = 0; i < AST.length; i++) {
          AST[i] = AST[i].filter(node => node.type === "ImportDeclaration");
          for (let j = 0; j < AST[i].length; j++) {
            if (AST[i][j].source.value !== "svelte") {
              let obj = {};
              obj.type = AST[i][j].type;
              obj.source = AST[i][j].source.value.split("");
              obj.source.shift();
              obj.source.shift();
              obj.source = obj.source.join("");
              obj.source = obj.source.replace(".svelte", "");
              AST[i][j] = obj;
            } else {
              let obj = {};
              obj.type = AST[i][j].type;
              obj.source = AST[i][j].source.value;
              AST[i][j] = obj;
            }
          }
        }

        // modified the url array to match with AST array and then combined into
        // bigData object
        for (let i = 0; i < urls.length; i++) {
          for (let j = urls[i].url.length - 1; j > 0; j--) {
            if (urls[i].url[j] === "/") {
              urls[i].url = urls[i].url
                .slice(j + 1, urls[i].url.length)
                .replace(".svelte", "");
            }
          }
          bigData[urls[i].url] = AST[i];
        }

        // iterate through bigData and made parent/child object and pushed into componentTemplate array
        let componentTemplate = [];
        function componentChildren(bigObj) {
          for (let eachKey in bigObj) {
            for (let eachObj of bigObj[eachKey]) {
              if (
                eachObj.type == "ImportDeclaration" &&
                eachObj.source !== "svelte"
              ) {
                let obj = {};
                obj.parent = eachKey;
                obj.child = eachObj.source;
                componentTemplate.push(obj);
              }
            }
          }
        }
        componentChildren(bigData);

        // added special obj for the top parent component for D3 stratifyy function to successfully create relevant array
        for (let i = 0; i < componentTemplate.length; i++) {
          let obj = {};
          obj.child = componentTemplate[i].parent;
          if (componentTemplate.every(object => object.child !== obj.child)) {
            if (obj.child !== "") {
              obj.parent = "";
              componentTemplate.unshift(obj);
            }
          }
        }

        // combined data from newD3Pre into componentTemplate to render state/props onto panel with D3JS
        for (let i = 0; i < componentTemplate.length; i++) {
          for (let j = 0; j < newD3Pre.length; j++) {
            if (componentTemplate[i].child === Object.keys(newD3Pre[j])[0]) {
              componentTemplate[i].data = Object.values(newD3Pre[j])[0];
            }
          }
        }

        // modified componentTemplate for data that has no States and/or Prop to render appropriate states for users
        // modified the data to show only Props keys for better user experience
        for (let i = 0; i < componentTemplate.length; i++) {
          if (!componentTemplate[i].hasOwnProperty("data")) {
            componentTemplate[i].data = {
              State: "No State",
              Props: "No Props"
            };
          } else if (
            Object.keys(componentTemplate[i].data.Props).length === 0
          ) {
            componentTemplate[i].data.Props = "No Props";
          } else {
            let result = [];
            componentTemplate[i].data.Props = result.concat(
              Object.keys(componentTemplate[i].data.Props)
            );
          }
        }

        // finally create templateStructured for D3 using D3.stratify function
        let templateStructured = d3
          .stratify()
          .id(function(d) {
            return d.child;
          })
          .parentId(function(d) {
            return d.parent;
          })(componentTemplate);

        switch (tab) {
          case "tree":
            viewsRoot.innerHTML = "";
            chartRoot.innerHTML = "";
            d3TreeRender.treeRender(templateStructured, d3, viewsRoot);
            break;
          case "chart":
            viewsRoot.innerHTML = "";
            chartRoot.innerHTML = "";
            d3ChartRender.chartRender(
              template,
              d3,
              chartRoot,
              templateStructured,
              collapse
            );
            break;
          case "raw":
            viewsRoot.innerHTML = "";
            chartRoot.innerHTML = "";
            statesRoot.innerHTML = "";
            propsRoot.innerHTML = "";
            const pre = document.createElement("pre");
            const prettyJSON = JSON.stringify(componentTree, null, 2);
            pre.innerHTML = syntaxHighlight(prettyJSON);
            viewsRoot.appendChild(pre);
            break;
        }
      }, 100);
    });
  };
</script>

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
    0%,
    100% {
      animation-timing-function: cubic-bezier(0.2 0 0.8 0.8);
    }
    50% {
      animation-timing-function: cubic-bezier(0.2 0.2 0.8 1);
    }
    0% {
      transform: rotate(0deg);
    }
    50% {
      transform: rotate(180deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
  @keyframes ldio-qgqa75k37hd-s {
    0%,
    100% {
      animation-timing-function: cubic-bezier(0.2 0 0.8 0.8);
    }
    50% {
      animation-timing-function: cubic-bezier(0.2 0.2 0.8 1);
    }
    0% {
      transform: translate(-19px, -19px) scale(0);
    }
    50% {
      transform: translate(-19px, -19px) scale(1);
    }
    100% {
      transform: translate(-19px, -19px) scale(0);
    }
  }
  .ldio-qgqa75k37hd > div {
    transform: translate(0px, -9.5px);
  }
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
  .ldio-qgqa75k37hd div {
    box-sizing: content-box;
  }
</style>

<div id="views-navbar">
  <button on:click={() => getData('tree')}>Tree</button>
  <button on:click={() => getData('chart')}>Chart</button>
  <button on:click={() => getData('raw')}>Raw</button>

  {#if refreshPage}
    <div id="load-screen">
      <div id="refresh">Please refresh your Svelte application</div>
      <div class="loadingio-spinner-interwind-cjqvhe7g9xe">
        <div class="ldio-qgqa75k37hd">
          <div>
            <div>
              <div>
                <div />
              </div>
            </div>
            <div>
              <div>
                <div />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>
