import { inngest } from "@/lib/inngest";

export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({ event, step }) => {
    await step.sleep("wait-a-moment", "1s");
    console.log("Hello, world!", event.data);
    return { message: `Hello ${event.data.email}!` };
  },
);
