export const update = (source) => {
// Compute the flattened node list.
  const nodes = root.descendants();

  const height = Math.max(
    500,
    nodes.length * barHeight + margin.top + margin.bottom,
  );

  d3.select('svg')
    .transition()
    .attr('height', height);

  let index = -1;
  root.eachBefore((n) => {
    n.x = ++index * barHeight;
    n.y = n.depth * 20;
  });

  // Update the nodes…
  const node = svg
    .selectAll('.node')
    .data(nodes, (d) => d.id || (d.id = ++i));

  const nodeEnter = node
    .enter()
    .append('g')
    .attr('class', 'node')
    .attr(
      'transform',
      () => `translate(${source.y0},${source.x0})`,
    )
    .on('click', click);

  // adding arrows
  nodeEnter
    .append('text')
    .attr('x', -20)
    .attr('y', 2)
    .attr('fill', 'grey')
    .attr('class', 'arrow')
    .attr('class', 'fas')
    .attr('font-size', '12px')
    .attr('cursor', 'pointer')
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
    })
    .text((d) => (d.children ? '\uf107' : d._children ? '\uf105' : ''));

  // adding file or folder names
  nodeEnter
    .append('text')
    .attr('dy', 3.5)
    .attr('dx', 5.5)
    .text((d) => d.data.id)
    .style('fill', 'white')
    .on('mouseover', function (d) {
      d3.select(this).classed('selected', true);
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
    })
    .attr('cursor', 'pointer')
    .on('mouseout', (d) => {
      d3.selectAll('.selected').classed('selected', false);
    });

  // Transition nodes to their new position.
  nodeEnter
    .transition(nodeEnterTransition)
    .attr('transform', (d) => `translate(${d.y},${d.x})`)
    .style('opacity', 1);

  node
    .transition()
    .duration(duration)
    .attr('transform', (d) => `translate(${d.y},${d.x})`)
    .style('opacity', 1);

  // Transition exiting nodes to the parent's new position.
  node
    .exit()
    .transition()
    .duration(duration)
    .attr(
      'transform',
      () => `translate(${source.y},${source.x})`,
    )
    .style('opacity', 0)
    .remove();

  // Stash the old positions for transition.
  root.each((d) => {
    d.x0 = d.x;
    d.y0 = d.y;
  });
};

export const treeRender = (data, d3, viewsRoot) => {
  const margin = {
    top: 10, right: 20, bottom: 30, left: 20,
  };
  const width = 960;
  const height = 1000;
  const barHeight = 20;

  const i = 0;
  const duration = 400;
  let root;

  const nodeEnterTransition = d3
    .transition()
    .duration(300)
    .ease(d3.easeLinear);

  const svg = d3
    .select(viewsRoot)
    .append('svg')
    .attr('width', width) // + margin.left + margin.right)
    .attr('height', height)
    .append('g')
    .attr(
      'transform',
      `translate(${margin.left},${margin.top})`,
    );

  root = d3.hierarchy(data);
  root.x0 = 0;
  root.y0 = 0;
  update(root);
};

export const click = (d) => {
  if (d.children) {
    d._children = d.children;
    d.children = null;
  } else {
    d.children = d._children;
    d._children = null;
  }
  d3.select(this).remove();
  update(d);
};

/*
function treeRender(data) {
  let margin = { top: 10, right: 20, bottom: 30, left: 20 },
    width = 960,
    height = 1000,
    barHeight = 20;

  let i = 0,
    duration = 400,
    root;

  let nodeEnterTransition = d3
    .transition()
    .duration(300)
    .ease(d3.easeLinear);

  let svg = d3
    .select(viewsRoot)
    .append("svg")
    .attr("width", width) // + margin.left + margin.right)
    .attr("height", height)
    .append("g")
    .attr(
      "transform",
      "translate(" + margin.left + "," + margin.top + ")"
    );

  root = d3.hierarchy(data);
  root.x0 = 0;
  root.y0 = 0;
  update(root);

  function update(source) {
    // Compute the flattened node list.
    var nodes = root.descendants();

    var height = Math.max(
      500,
      nodes.length * barHeight + margin.top + margin.bottom
    );

    d3.select("svg")
      .transition()
      .attr("height", height);

    var index = -1;
    root.eachBefore(n => {
      n.x = ++index * barHeight;
      n.y = n.depth * 20;
    });

    // Update the nodes…
    var node = svg
      .selectAll(".node")
      .data(nodes, d => d.id || (d.id = ++i));

    var nodeEnter = node
      .enter()
      .append("g")
      .attr("class", "node")
      .attr(
        "transform",
        () => "translate(" + source.y0 + "," + source.x0 + ")"
      )
      .on("click", click);

    // adding arrows
    nodeEnter
      .append("text")
      .attr("x", -20)
      .attr("y", 2)
      .attr("fill", "grey")
      .attr("class", "arrow")
      .attr("class", "fas")
      .attr("font-size", "12px")
      .attr("cursor", "pointer")
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
      })
      .text(d => (d.children ? "\uf107" : d._children ? "\uf105" : ""));

    // adding file or folder names
    nodeEnter
      .append("text")
      .attr("dy", 3.5)
      .attr("dx", 5.5)
      .text(d => d.data.id)
      .style("fill", "white")
      .on("mouseover", function(d) {
        d3.select(this).classed("selected", true);
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
      })
      .attr("cursor", "pointer")
      .on("mouseout", function(d) {
        d3.selectAll(".selected").classed("selected", false);
      });

    // Transition nodes to their new position.
    nodeEnter
      .transition(nodeEnterTransition)
      .attr("transform", d => "translate(" + d.y + "," + d.x + ")")
      .style("opacity", 1);

    node
      .transition()
      .duration(duration)
      .attr("transform", d => "translate(" + d.y + "," + d.x + ")")
      .style("opacity", 1);

    // Transition exiting nodes to the parent's new position.
    node
      .exit()
      .transition()
      .duration(duration)
      .attr(
        "transform",
        () => "translate(" + source.y + "," + source.x + ")"
      )
      .style("opacity", 0)
      .remove();

    // Stash the old positions for transition.
    root.each(d => {
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
    d3.select(this).remove();
    update(d);
  }
}
*/
