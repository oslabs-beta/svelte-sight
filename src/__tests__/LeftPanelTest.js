import '@testing-library/jest-dom/extend-expect';
import { render } from '@testing-library/svelte';
import ViewsContainer from '../left-panel/ViewsContainer.svelte';
import ViewsNavbar from '../left-panel/ViewsNavbar.svelte';
import ViewsDisplay from '../left-panel/ViewsDisplay.svelte';


test('Left panel should render navbar & display on load', () => {
  const { results } = render(ViewsContainer);
  const navbar = document.querySelector('#views-navbar');
  const viewsDisplay = document.querySelector('#views-display');

  expect(results).toContainElement(navbar);
  expect(results).toContainElement(viewsDisplay);
});

test('Navbar should contain Tree, Chart, Raw buttons', () => {
  const { getByText } = render(ViewsNavbar);
  const tree = getByText('Tree');
  const chart = getByText('Chart');
  const raw = getByText('Raw');

  expect(tree).toBeInTheDocument();
  expect(chart).toBeInTheDocument();
  expect(raw).toBeInTheDocument();
});

test('ViewsDisplay should render views & chart roots on load', () => {
  const { results } = render(ViewsDisplay);
  const viewsRoot = document.querySelector('#views-root');
  const chartRootWrapper = document.querySelector('#chart-root-wrapper');
  const chartRoot = document.querySelector('#chart-root');

  expect(results).toContainElement(viewsRoot);
  expect(results).toContainElement(chartRootWrapper);
  expect(results).toContainElement(chartRoot);
});
