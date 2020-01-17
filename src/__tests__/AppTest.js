import '@testing-library/jest-dom/extend-expect';
import { render } from '@testing-library/svelte';
import App from '../App.svelte';


test('Should render left panel on load', () => {
  const { results } = render(App);
  const leftPanel = document.querySelector('#views-container');

  expect(results).toContainElement(leftPanel);
});

test('Should render right panel on load', () => {
  const { results } = render(App);
  const rightPanel = document.querySelector('#right-container');

  expect(results).toContainElement(rightPanel);
});
