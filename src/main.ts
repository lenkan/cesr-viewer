import "./main.css";
import { parseMessages } from "cesr/__unstable__";

async function render(reader: ReadableStream<Uint8Array>) {
  const list = document.createElement("ul");
  list.className = "message_list";

  for await (const message of parseMessages(reader)) {
    const code = document.createElement("pre");
    code.className = "message_code";
    code.innerText = JSON.stringify(message, null, 2);
    list.appendChild(code);
  }

  const original = document.body.getElementsByTagName("pre");
  for (const element of original) {
    element.style.display = "none";
    element.classList.add("original_text");
  }

  document.body.appendChild(list);
}

async function run() {
  const decoder = new TextEncoderStream();

  const writer = decoder.writable.getWriter();
  render(decoder.readable);

  await writer.write(document.body.innerText);
  await writer.close();
}

if (document.readyState === "complete") {
  run();
} else {
  window.addEventListener("load", run);
}
