
// Background service worker for tracking active time on selected sites

let lastActive = { tabId: null, timestamp: Date.now(), url: null };

function getDomain(url) {
  try {
    const u = new URL(url);
    return u.hostname.replace('www.', '');
  } catch (e) {
    return null;
  }
}

async function addTimeToDomain(domain, deltaMs) {
  if (!domain) return;
  const res = await chrome.storage.local.get('trackedData');
  const trackedData = res.trackedData || {};
  const today = new Date().toISOString().slice(0, 10);
  if (!trackedData[today]) trackedData[today] = {};
  trackedData[today][domain] = (trackedData[today][domain] || 0) + deltaMs;
  await chrome.storage.local.set({ trackedData });
}

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const now = Date.now();
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (lastActive && lastActive.url) {
      const prevDomain = getDomain(lastActive.url);
      const delta = now - lastActive.timestamp;
      const res = await chrome.storage.local.get('trackedSites');
      const trackedSites = res.trackedSites || [];
      if (trackedSites.includes(prevDomain)) {
        await addTimeToDomain(prevDomain, delta);
      }
    }
    lastActive = { tabId: tab.id, timestamp: now, url: tab.url };
  } catch (e) {
    lastActive = { tabId: null, timestamp: now, url: null };
  }
});

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  const now = Date.now();
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    if (lastActive && lastActive.url) {
      const prevDomain = getDomain(lastActive.url);
      const delta = now - lastActive.timestamp;
      const res = await chrome.storage.local.get('trackedSites');
      const trackedSites = res.trackedSites || [];
      if (trackedSites.includes(prevDomain)) {
        await addTimeToDomain(prevDomain, delta);
      }
    }
    lastActive = { tabId: null, timestamp: now, url: null };
  } else {
    try {
      const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      if (tab) {
        lastActive = { tabId: tab.id, timestamp: now, url: tab.url };
      }
    } catch (e) {
      lastActive = { tabId: null, timestamp: now, url: null };
    }
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tabId === lastActive.tabId && changeInfo.url) {
    const now = Date.now();
    if (lastActive && lastActive.url) {
      const prevDomain = getDomain(lastActive.url);
      const delta = now - lastActive.timestamp;
      chrome.storage.local.get('trackedSites', (res) => {
        const trackedSites = res.trackedSites || [];
        if (trackedSites.includes(prevDomain)) addTimeToDomain(prevDomain, delta);
      });
    }
    lastActive.timestamp = now;
    lastActive.url = changeInfo.url;
  }
});

chrome.alarms.create('heartbeat', { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'heartbeat') lastActive.timestamp = Date.now();
});
