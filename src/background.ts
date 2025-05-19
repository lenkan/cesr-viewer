console.log("Background script running!");

new EventSource("http://localhost:8000/esbuild").addEventListener("change", () => {
  chrome.runtime.reload();
});
