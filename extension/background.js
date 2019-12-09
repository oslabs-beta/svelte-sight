console.log('background running');

const buttonClicked = (tab) => {
  chrome.tabs.sendMessage(tab.id, { msg: 'hello' });

}

chrome.browserAction.onClicked.addListener(buttonClicked)