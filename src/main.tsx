import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";

function render() {
  const text = document.body.innerText;

  const original = document.body.getElementsByTagName("pre");
  for (const element of original) {
    element.style.display = "none";
    element.classList.add("original_text");
  }

  const root = document.createElement("div");
  createRoot(root).render(<App text={text} />);
  document.body.appendChild(root);
}

if (document.readyState === "complete") {
  render();
} else {
  window.addEventListener("load", render);
}
