chrome.devtools.panels.create(
  'Svelte Tool',
  null,
  'panel.html',
  panel => {
    chrome.devtools.inspectedWindow.getResources((resources) => {

    })
  }
)