if (process.env.NODE_ENV === "development") {
  new EventSource("http://localhost:8000/esbuild").addEventListener("change", () => {
    chrome.runtime.reload();
  });
}

function isCesrResponse(contentType: string) {
  return contentType.startsWith("application/json+cesr") || contentType.startsWith("application/cesr");
}

chrome.webRequest.onHeadersReceived.addListener(
  (details) => {
    const contentType = details.responseHeaders?.find((h) => h.name.toLowerCase() === "content-type");

    if (contentType && contentType.value && isCesrResponse(contentType.value)) {
      chrome.action.setBadgeText({ text: "CESR" });

      chrome.scripting.executeScript({
        target: { tabId: details.tabId },
        files: ["main.js"],
      });
    }
  },
  { urls: ["<all_urls>"], types: ["main_frame"] },
  ["responseHeaders"]
);
