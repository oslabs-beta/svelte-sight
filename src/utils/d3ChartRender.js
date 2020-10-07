// Creates a curved (diagonal) path from parent to the child nodes
export const diagonal = (s, d) => {
  const path = `M${
    s.x
  },${
    s.y
  } C ${
    s.x
  },${
    (s.y + d.y) / 2
  } ${
    d.x
  },${
    (s.y + d.y) / 2
  } ${
    d.x
  },${
    d.y}`;
  return path;
};

// Toggle children on click.git
export const click = (d, update) => {
  if (d.children) {
    d._children = d.children;
    d.children = null;
  } else {
    d.children = d._children;
    d._children = null;
  }
  update(d);
};

export const update = (
  treemap,
  root,
  svg,
  source,
  statesRoot,
  propsRoot,
  syntaxHighlight,
  duration,
) => {
  // Assigns the x and y position for the nodes
  const treeData = treemap(root);
  // Compute the new tree layout.
  const nodes = treeData.descendants();
  const links = treeData.descendants().slice(1);
  // Normalize for fixed-depth.
  nodes.forEach((d) => {
    d.y = d.depth * 70;
  });
  // ****************** Nodes section ***************************
  // Update the nodes...
  const node = svg.selectAll('g.node').data(nodes, (d) => d.id || (d.id = ++i));
  // Enter any new modes at the parent's previous position.
  const nodeEnter = node
    .enter()
    .append('g')
    .attr('class', 'node')
    .attr('transform', (d) => `translate(${source.y0},${source.x0})`)
    .on('click', click)
    .on('mouseover', (d) => {
      const statesRendered = document.createElement('pre');
      const propsRendered = document.createElement('pre');
      statesRoot.innerHTML = '';
      propsRoot.innerHTML = '';
      statesRendered.innerHTML = syntaxHighlight(
        JSON.stringify(d.data.data.data.State, null, 2),
      );
      statesRoot.appendChild(statesRendered);
      propsRendered.innerHTML = syntaxHighlight(
        JSON.stringify(d.data.data.data.Props, null, 2),
      );
      propsRoot.appendChild(propsRendered);
    });
  // Add Circle for the nodes
  nodeEnter
    .append('circle')
    .attr('class', 'node')
    .attr('r', 1e-6);
  // Add labels for the nodes
  nodeEnter
    .append('text')
    .attr('dy', '.35em')
    .attr('y', (d) => (d.children || d._children ? -20 : 20))
    .attr('text-anchor', (d) => (d.children || d._children ? 'end' : 'start'))
    .text((d) => d.data.id)
    .style('fill', 'rgb(77, 166, 255)');
  // UPDATE
  const nodeUpdate = nodeEnter.merge(node);
  // Transition to the proper position for the node
  nodeUpdate
    .transition()
    .duration(duration)
    .attr('transform', (d) => `translate(${d.x},${d.y})`);
  // Update the node attributes and style
  nodeUpdate
    .select('circle.node')
    .attr('r', 10)
    .style('fill', (d) => (d._children ? 'rgb(244, 200, 249)' : 'rgb(16, 122, 117)'))
    .attr('cursor', 'pointer');
  // Remove any exiting nodes
  const nodeExit = node
    .exit()
    .transition()
    .duration(duration)
    .attr('transform', (d) => `translate(${source.x},${source.y})`)
    .remove();
  // On exit reduce the node circles size to 0
  nodeExit.select('circle').attr('r', 1e-6);
  // On exit reduce the opacity of text labels
  nodeExit
    .select('text')
    .style('fill-opacity', 1e-6)
    .style('fill', 'white');
  // ****************** links section ***************************
  // Update the links...
  const link = svg.selectAll('path.link').data(links, (d) => d.id);
  // Enter any new links at the parent's previous position.
  const linkEnter = link
    .enter()
    .insert('path', 'g')
    .attr('class', 'link')
    .attr('d', (d) => {
      const o = { x: source.x0, y: source.y0 };
      return diagonal(o, o);
    })
    .style('fill', 'none')
    .style('stroke', 'white');
  // .style('stroke-width, 2px')
  // UPDATE
  const linkUpdate = linkEnter.merge(link);
  // Transition back to the parent element position
  linkUpdate
    .transition()
    .duration(duration)
    .attr('d', (d) => diagonal(d, d.parent));
  // Remove any exiting links
  const linkExit = link
    .exit()
    .transition()
    .duration(duration)
    .attr('d', (d) => {
      const o = { x: source.x, y: source.y };
      return diagonal(o, o);
    })
    .remove();
  // Store the old positions for transition.
  nodes.forEach((d) => {
    d.x0 = d.x;
    d.y0 = d.y;
  });
};

export const chartRender = (template, d3, chartRoot, templateStructured, collapse) => {
  // Margin and svg for tree
  const i = 0;
  const duration = 400;
  let root = template;
  const margin = {
    top: 30, right: 0, bottom: 30, left: 0,
  };
  const width = 400 - margin.left - margin.right;
  const height = 700 - margin.top - margin.bottom;
  // append the svg object to the body of the page
  // appends a 'group' element to 'svg'
  // moves the 'group' element to the top left margin
  const svg = d3
    .select(chartRoot)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('margin-left', '10px')
    .append('g')
    .attr('transform', `translate(${-20},${margin.top})`);
  // declares a tree layout and assigns the size
  const treemap = d3.tree().size([400, 500]);
  // start of tree
  // Assigns parent, children, height, depth
  root = d3.hierarchy(templateStructured, (d) => d.children);
  root.x0 = height / 2;
  root.y0 = 0;
  // Collapse after the second level
  root.children.forEach(collapse);
  update(root);
};

export const collapse = (d) => {
  if (d.children) {
    d._children = d.children;
    d._children.forEach(collapse);
    d.children = null;
  }
};


/*
function chartRender(template) {
  // Margin and svg for tree
  let i = 0,
    duration = 400,
    root = template;
  let margin = { top: 30, right: 0, bottom: 30, left: 0 },
    width = 400 - margin.left - margin.right,
    height = 700 - margin.top - margin.bottom;
  // append the svg object to the body of the page
  // appends a 'group' element to 'svg'
  // moves the 'group' element to the top left margin
  let svg = d3
    .select(chartRoot)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("margin-left", "10px")
    .append("g")
    .attr("transform", "translate(" + -20 + "," + margin.top + ")");
  // declares a tree layout and assigns the size
  let treemap = d3.tree().size([400, 500]);
  ///////start of tree
  // Assigns parent, children, height, depth
  root = d3.hierarchy(templateStructured, function(d) {
    return d.children;
  });
  root.x0 = height / 2;
  root.y0 = 0;
  // Collapse after the second level
  root.children.forEach(collapse);
  update(root);
  // Collapse the node and all it's children
  function collapse(d) {
    if (d.children) {
      d._children = d.children;
      d._children.forEach(collapse);
      d.children = null;
    }
  }
  function update(source) {
    // Assigns the x and y position for the nodes
    let treeData = treemap(root);
    // Compute the new tree layout.
    let nodes = treeData.descendants(),
      links = treeData.descendants().slice(1);
    // Normalize for fixed-depth.
    nodes.forEach(function(d) {
      d.y = d.depth * 70;
    });
    // ****************** Nodes section ***************************
    // Update the nodes...
    let node = svg.selectAll("g.node").data(nodes, function(d) {
      return d.id || (d.id = ++i);
    });
    // Enter any new modes at the parent's previous position.
    let nodeEnter = node
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", function(d) {
        return "translate(" + source.y0 + "," + source.x0 + ")";
      })
      .on("click", click)
      .on("mouseover", function(d) {
        let statesRendered = document.createElement("pre");
        let propsRendered = document.createElement("pre");
        statesRoot.innerHTML = "";
        propsRoot.innerHTML = "";
        statesRendered.innerHTML = syntaxHighlight(
          JSON.stringify(d.data.data.data.State, null, 2)
        );
        statesRoot.appendChild(statesRendered);
        propsRendered.innerHTML = syntaxHighlight(
          JSON.stringify(d.data.data.data.Props, null, 2)
        );
        propsRoot.appendChild(propsRendered);
      });
    // Add Circle for the nodes
    nodeEnter
      .append("circle")
      .attr("class", "node")
      .attr("r", 1e-6);
    // Add labels for the nodes
    nodeEnter
      .append("text")
      .attr("dy", ".35em")
      .attr("y", function(d) {
        return d.children || d._children ? -20 : 20;
      })
      .attr("text-anchor", function(d) {
        return d.children || d._children ? "end" : "start";
      })
      .text(function(d) {
        return d.data.id;
      })
      .style("fill", "rgb(77, 166, 255)");
    // UPDATE
    let nodeUpdate = nodeEnter.merge(node);
    // Transition to the proper position for the node
    nodeUpdate
      .transition()
      .duration(duration)
      .attr("transform", function(d) {
        return "translate(" + d.x + "," + d.y + ")";
      });
    // Update the node attributes and style
    nodeUpdate
      .select("circle.node")
      .attr("r", 10)
      .style("fill", function(d) {
        return d._children ? "rgb(244, 200, 249)" : "rgb(16, 122, 117)";
      })
      .attr("cursor", "pointer");
    // Remove any exiting nodes
    let nodeExit = node
      .exit()
      .transition()
      .duration(duration)
      .attr("transform", function(d) {
        return "translate(" + source.x + "," + source.y + ")";
      })
      .remove();
    // On exit reduce the node circles size to 0
    nodeExit.select("circle").attr("r", 1e-6);
    // On exit reduce the opacity of text labels
    nodeExit
      .select("text")
      .style("fill-opacity", 1e-6)
      .style("fill", "white");
    // ****************** links section ***************************
    // Update the links...
    let link = svg.selectAll("path.link").data(links, function(d) {
      return d.id;
    });
    // Enter any new links at the parent's previous position.
    let linkEnter = link
      .enter()
      .insert("path", "g")
      .attr("class", "link")
      .attr("d", function(d) {
        let o = { x: source.x0, y: source.y0 };
        return diagonal(o, o);
      })
      .style("fill", "none")
      .style("stroke", "white");
    // .style('stroke-width, 2px')
    // UPDATE
    let linkUpdate = linkEnter.merge(link);
    // Transition back to the parent element position
    linkUpdate
      .transition()
      .duration(duration)
      .attr("d", function(d) {
        return diagonal(d, d.parent);
      });
    // Remove any exiting links
    let linkExit = link
      .exit()
      .transition()
      .duration(duration)
      .attr("d", function(d) {
        let o = { x: source.x, y: source.y };
        return diagonal(o, o);
      })
      .remove();
    // Store the old positions for transition.
    nodes.forEach(function(d) {
      d.x0 = d.x;
      d.y0 = d.y;
    });
    // Creates a curved (diagonal) path from parent to the child nodes
    function diagonal(s, d) {
      let path =
        "M" +
        s.x +
        "," +
        s.y +
        " C " +
        s.x +
        "," +
        (s.y + d.y) / 2 +
        " " +
        d.x +
        "," +
        (s.y + d.y) / 2 +
        " " +
        d.x +
        "," +
        d.y;
      return path;
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
*/
