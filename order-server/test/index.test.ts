import { test, expect, describe } from "bun:test";

const BACKEND_URL_1 = "ws://localhost:8080";
const BACKEND_URL_2 = "ws://localhost:8081";

describe("Chat application", () => {
  test("Message sent from room 1 reaches another participant in room 1", async () => {
    const ws1 = new WebSocket(BACKEND_URL_1);
    const ws2 = new WebSocket(BACKEND_URL_2);

    await new Promise<void>((resolve) => {
      let count = 0;
      ws1.onopen = () => { count++; if (count === 2) resolve(); };
      ws2.onopen = () => { count++; if (count === 2) resolve(); };
    });

    ws1.send(JSON.stringify({ type: "join-room", room: "Room-1" }));
    ws2.send(JSON.stringify({ type: "join-room", room: "Room-1" }));

    await new Promise<void>((resolve) => {
      ws2.onmessage = (event) => {
        const parsedData = JSON.parse(event.data);
        expect(parsedData.type).toBe("chat");
        expect(parsedData.message).toBe("Hi there");
        resolve();
      };

      ws1.send(JSON.stringify({
        type: "chat",
        room: "Room-1",
        message: "Hi there"
      }));
    });
  });
});
