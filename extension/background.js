const connections = {};

chrome.runtime.onConnect.addListener((port) => {
  const extensionListener = (message, sender, sendResponse) => {
    // original connection event doesn't include tabID of the DevTools page, so we need to send it explicitly
    if (message.name === 'init') {
      connections[message.tabId] = port;
      console.log('connected');
      return;
    }
    // other message handling
  }

  // Listen to messages sent from the DevTools page
  port.onMessage.addListener(extensionListener);

  port.onDisconnect.addListener((port) => {
    port.onMessage.removeListener(extensionListener);

    const tabs = Object.keys(connections);
    for (let i = 0; i < tabs.length; i += 1) {
      if (connections[tabs[i]] === port) {
        delete connections[tabs[i]];
        break;
      }
    }
  });
});


// Receive message from content script and relay to the DevTools page for the current tab
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('inside background onMessage');
  // Messages from content scripts should have sender.tab set
  if (sender.tab) {
    const tabId = sender.tab.id;
    if (tabId in connections) {
      console.log('inside tabId in connections');
      connections[tabId].postMessage(request);
    } else {
      console.log('Tab not found in connection list');
    }
  }
  else {
    console.log('sender.tab not defined');
  }
  return true;
});