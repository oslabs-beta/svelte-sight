console.log('hello from content.js');

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log(msg.msg);

})