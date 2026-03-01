// DollarVote Popup
document.addEventListener('DOMContentLoaded', async () => {
  // Count badges on current page
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => document.querySelectorAll('.dollarvote-badge').length
      });
      document.getElementById('page-count').textContent = results[0]?.result || 0;
    }
  } catch (e) {
    document.getElementById('page-count').textContent = '0';
  }

  // Today's lookup count from storage
  const data = await chrome.storage.local.get('lookupCount');
  document.getElementById('today-count').textContent = data.lookupCount || 0;
});
