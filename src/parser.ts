import { parse } from "cesr";

export interface Message {
  payload: Record<string, unknown>;
  attachments: string[];
}

export async function* parseMessages(text: string) {
  let message: Message | null = null;

  const data = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(text));
      controller.close();
    },
  });

  for await (const frame of parse(data)) {
    if (frame.type === "message") {
      if (message) {
        yield message;
      }

      message = { payload: JSON.parse(frame.text), attachments: [] };
    } else {
      message = message ?? { payload: {}, attachments: [] };
      message.attachments.push(frame.text);
    }
  }

  if (message) {
    yield message;
  }
}
