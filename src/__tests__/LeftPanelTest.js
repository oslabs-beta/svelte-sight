import '@testing-library/jest-dom/extend-expect';
import { render } from '@testing-library/svelte';
import ViewsContainer from '../left-panel/ViewsContainer';
import ViewsNavbar from '../left-panel/ViewsNavbar';



test('Should render navbar on load', () => {
  const { results } = render(ViewsContainer);
  const navbar = document.querySelector('#views-navbar');

  expect(results).toContainElement(navbar);
})

test('Navbar should contain Tree, Chart, Raw buttons', () => {
  const { getByText } = render(ViewsNavbar);
  const tree = getByText('Tree');
  const chart = getByText('Chart');
  const raw = getByText('Raw');

  expect(tree).toBeInTheDocument();
  expect(chart).toBeInTheDocument();
  expect(raw).toBeInTheDocument();
})

