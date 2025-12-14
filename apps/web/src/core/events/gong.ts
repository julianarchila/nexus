import { inngest } from "@/lib/inngest";

export const gongTranscrib = inngest.createFunction(
  { id: "gong-transcrib" },
  { event: "gong/transcribe.received" },
  async ({ event, step }) => {
    console.log(event.data.meetingSummary);
    return { message: `Hello ${event.data.email}!` };
  },
);
