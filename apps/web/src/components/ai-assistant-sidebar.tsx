"use client";

import React, { useRef, useEffect, useState } from "react";
import { Sparkles, Send, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";

type Message = {
    id: string;
    role: "user" | "assistant";
    content: string;
};

const SUGGESTED_PROMPTS = [
    {
        title: "Merchant Status",
        question: "What merchants are currently in implementation stage?",
    },
    {
        title: "Payment Processors",
        question: "Which payment processors support recurring payments?",
    },
    {
        title: "Country Coverage",
        question: "Show me all processors that work in Brazil",
    },
    {
        title: "Integration Readiness",
        question: "Which merchants are ready for go-live this month?",
    },
];

export function AIAssistantSidebar() {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: input,
        };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const response = await fetch("/api/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: [...messages, userMessage] }),
            });

            if (!response.ok) throw new Error("Failed to get response");
            if (!response.body) throw new Error("No response body");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let assistantMessage = "";
            const assistantId = (Date.now() + 1).toString();
            let buffer = "";

            setMessages((prev) => [
                ...prev,
                { id: assistantId, role: "assistant", content: "" },
            ]);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() || "";

                for (const line of lines) {
                    if (!line.trim() || !line.startsWith("0:")) continue;

                    try {
                        const jsonStr = line.slice(2);
                        const data = JSON.parse(jsonStr);

                        // Solo procesar deltas de texto, ignorar tool calls
                        if (data.type === "text-delta" && data.textDelta) {
                            assistantMessage += data.textDelta;

                            setMessages((prev) => {
                                const newMessages = [...prev];
                                newMessages[newMessages.length - 1] = {
                                    id: assistantId,
                                    role: "assistant",
                                    content: assistantMessage,
                                };
                                return newMessages;
                            });
                        }
                    } catch (e) {
                        // Ignorar errores de parsing
                    }
                }
            }
        } catch (error) {
            console.error("Error:", error);
            setMessages((prev) => [
                ...prev,
                {
                    id: (Date.now() + 2).toString(),
                    role: "assistant",
                    content: "Sorry, I encountered an error. Please try again.",
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSuggestedPrompt = (question: string) => {
        setInput(question);
        setTimeout(() => {
            const form = document.querySelector('form[data-chat-form]') as HTMLFormElement;
            if (form) form.requestSubmit();
        }, 0);
    };

    return (
        <>
            {/* Floating Button */}
            <Button
                onClick={() => setOpen(true)}
                size="lg"
                className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
                <Sparkles className="h-6 w-6" />
                <span className="sr-only">Open AI Assistant</span>
            </Button>

            {/* Sidebar */}
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent
                    side="right"
                    className="w-[400px] sm:w-[540px] flex flex-col p-0"
                >
                    <SheetHeader className="px-6 pt-6 pb-4 border-b">
                        <SheetTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-blue-600" />
                            AI Assistant
                        </SheetTitle>
                    </SheetHeader>

                    {/* Chat Area */}
                    <div className="flex-1 flex flex-col min-h-0">
                        <ScrollArea className="flex-1 px-6 py-4" ref={scrollRef}>
                            {messages.length === 0 ? (
                                <div className="space-y-6 py-8">
                                    <div className="text-center space-y-2">
                                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-purple-100">
                                            <Lightbulb className="h-6 w-6 text-blue-600" />
                                        </div>
                                        <h3 className="font-medium text-slate-900">
                                            How can I help you today?
                                        </h3>
                                        <p className="text-sm text-slate-500">
                                            Try asking about merchants, processors, or integrations
                                        </p>
                                    </div>

                                    <div className="grid gap-2">
                                        {SUGGESTED_PROMPTS.map((prompt, index) => (
                                            <button
                                                key={index}
                                                onClick={() =>
                                                    handleSuggestedPrompt(prompt.question)
                                                }
                                                className="text-left p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all group"
                                            >
                                                <p className="text-xs font-medium text-slate-500 mb-1">
                                                    {prompt.title}
                                                </p>
                                                <p className="text-sm text-slate-700 group-hover:text-blue-700">
                                                    {prompt.question}
                                                </p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {messages.map((message: Message) => (
                                        <div
                                            key={message.id}
                                            className={`flex ${message.role === "user"
                                                ? "justify-end"
                                                : "justify-start"
                                                }`}
                                        >
                                            <div
                                                className={`max-w-[85%] rounded-lg px-4 py-2 ${message.role === "user"
                                                    ? "bg-gradient-to-br from-blue-600 to-purple-600 text-white"
                                                    : "bg-slate-100 text-slate-900"
                                                    }`}
                                            >
                                                <p className="text-sm whitespace-pre-wrap">
                                                    {message.content}
                                                </p>
                                                <p
                                                    className={`text-xs mt-1 ${message.role === "user"
                                                        ? "text-blue-100"
                                                        : "text-slate-500"
                                                        }`}
                                                >
                                                    {new Date(Number(message.id)).toLocaleTimeString([], {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    {isLoading && (
                                        <div className="flex justify-start">
                                            <div className="max-w-[85%] rounded-lg px-4 py-2 bg-slate-100">
                                                <div className="flex gap-1">
                                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </ScrollArea>

                        {/* Input Area */}
                        <div className="border-t p-4">
                            <form
                                onSubmit={handleSubmit}
                                className="flex gap-2"
                            >
                                <Input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask me anything..."
                                    className="flex-1"
                                    disabled={isLoading}
                                />
                                <Button
                                    type="submit"
                                    size="icon"
                                    disabled={!input.trim() || isLoading}
                                    className="bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                                >
                                    <Send className="h-4 w-4" />
                                </Button>
                            </form>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}
