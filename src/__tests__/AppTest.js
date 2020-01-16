import '@testing-library/jest-dom/extend-expect';
import { render, fireEvent } from '@testing-library/svelte';
import App from '../App';
import ViewsNavbar from '../left-panel/ViewsNavbar.svelte';
import chrome from 'sinon-chrome';


// test('left panel renders on load', () => {
//   const leftPanel = document.querySelector('#views-container');
//   const { results } = render(App);

//   expect(results).toContainElement(leftPanel);
// })
describe('test.js', () => {
  before(function () {
    global.chrome = chrome;
  }); 

  test('changes button text on click', async () => {
    const { getByText } = render(ViewsNavbar)
    const button = getByText('Tree')
  
    // Using await when firing events is unique to the svelte testing library because
    // we have to wait for the next `tick` so that Svelte flushes all pending state changes.
    await fireEvent.click(button)
  
    expect(button).toHaveTextContent('Tree')
  })

  after(function () {
    chrome.flush();
    delete global.chrome;
  });
})

