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

  if (original[0]) {
    document.body.replaceChild(list, original[0]);
  }
}

async function run() {
  const decoder = new TextEncoderStream();

  const writer = decoder.writable.getWriter();
  render(decoder.readable);

  await writer.write(document.body.innerText);
  await writer.close();
}

run();
