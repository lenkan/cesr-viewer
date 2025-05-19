import "./main.css";
import { parseMessages } from "cesr/__unstable__";

async function render(reader: ReadableStream<Uint8Array>) {
  const list = document.createElement("ul");
  list.className = "message_list";

  for await (const message of parseMessages(reader)) {
    const li = document.createElement("li");
    li.className = "message_body";
    li.innerText = JSON.stringify(message.payload);
    list.appendChild(li);

    const sublist = document.createElement("ul");
    sublist.className = "message_attachments";
    for (const [group, attachments] of Object.entries(message.attachments)) {
      const subli = document.createElement("li");
      subli.innerText = group;

      const subsublist = document.createElement("ul");
      for (const attachment of attachments) {
        const subsubli = document.createElement("li");
        subsubli.innerText = attachment;
        subsublist.appendChild(subsubli);
      }

      subli.appendChild(subsublist);
      sublist.appendChild(subli);
    }
    li.appendChild(sublist);
  }

  const original = document.body.getElementsByTagName("pre");

  if (original[0]) {
    document.body.replaceChild(list, original[0]);
  }
}

(async function () {
  const decoder = new TextEncoderStream();

  const writer = decoder.writable.getWriter();
  render(decoder.readable);
  await writer.write(document.body.innerText);
  await writer.close();
})();
