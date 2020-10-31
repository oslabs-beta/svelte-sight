const exploreCompositeDataType = (node) => {
  if (node.type === 'Literal') {
    return node.value;
  }
  if (node.type === 'ArrayExpression') {
    if (node.elements[0].type === 'Literal') {
      return node.elements;
    }
    const arr = [];
    for (let i = 0; i < node.elements.length; i += 1) {
      arr.push(exploreCompositeDataType(node.elements[i]));
    }
    return arr;
  }
  const obj = {};
  for (let i = 0; i < node.properties.length; i += 1) {
    if (node.properties[i].value.type === 'Literal') {
      obj[node.properties[i].key.name || node.properties[i].key.value] = node.properties[i].value.value;
    } else {
      obj[node.properties[i].key.name] = exploreCompositeDataType(node.properties[i].value);
    }
  }
  return obj;
};

export default exploreCompositeDataType;
