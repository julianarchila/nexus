"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Mail, MessageCircle, Slack, CheckCircle, ArrowUpRight, Info, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface Integration {
    id: string;
    name: string;
    description: string;
    icon: React.ElementType;
    connected: boolean;
    reminders: boolean;
    accountId?: string;
    accountEmail?: string;
}

// User ID for Composio - in production, this should come from your auth system
const CURRENT_USER_ID = "default-user";

export default function SettingsPage() {
    const [integrations, setIntegrations] = useState<Integration[]>([
        {
            id: "slack",
            name: "Slack",
            description: "Recibe notificaciones y centraliza tu información en Slack",
            icon: Slack,
            connected: false,
            reminders: false,
        },
        {
            id: "gmail",
            name: "Gmail",
            description: "Conecta tu correo para centralizar comunicaciones importantes",
            icon: Mail,
            connected: false,
            reminders: false,
        },
        {
            id: "whatsapp",
            name: "WhatsApp",
            description: "Envía audios y mensajes, Nexus centraliza tu información",
            icon: MessageCircle,
            connected: false,
            reminders: false,
        },
    ]);
    const [loading, setLoading] = useState<string | null>(null);
    const [initialLoading, setInitialLoading] = useState(true);

    // Check Gmail connection status on mount
    useEffect(() => {
        checkGmailConnection();
    }, []);

    const checkGmailConnection = async () => {
        try {
            const response = await fetch(`/api/composio/connect-gmail?userId=${CURRENT_USER_ID}`);
            const data = await response.json();

            if (data.connected) {
                setIntegrations((prev) =>
                    prev.map((integration) =>
                        integration.id === "gmail"
                            ? {
                                ...integration,
                                connected: true,
                                reminders: data.hasReminders,
                                accountId: data.accountId,
                                accountEmail: data.accountEmail,
                            }
                            : integration
                    )
                );
            }
        } catch (error) {
            console.error("Error checking Gmail connection:", error);
        } finally {
            setInitialLoading(false);
        }
    };

    const handleConnect = async (id: string) => {
        if (id !== "gmail") {
            // For other integrations, show "coming soon"
            return;
        }

        setLoading(id);
        try {
            const response = await fetch("/api/composio/connect-gmail", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: CURRENT_USER_ID,
                    callbackUrl: `${window.location.origin}/settings?connected=gmail`,
                }),
            });

            const data = await response.json();

            if (data.success && data.redirectUrl) {
                // Redirect to Composio OAuth flow
                window.location.href = data.redirectUrl;
            } else {
                throw new Error(data.error || "Failed to initiate connection");
            }
        } catch (error: any) {
            console.error("Error connecting Gmail:", error);
            toast.error(error.message || "Error al conectar Gmail");
        } finally {
            setLoading(null);
        }
    };

    const handleRemindersToggle = async (id: string) => {
        const integration = integrations.find((i) => i.id === id);
        if (!integration) return;

        setLoading(id);
        try {
            if (id === "gmail") {
                if (!integration.reminders) {
                    // Enable trigger
                    const response = await fetch("/api/composio/setup-trigger", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            connectedAccountId: integration.accountId,
                        }),
                    });

                    const data = await response.json();
                    if (!data.success) {
                        throw new Error(data.error || "Failed to enable trigger");
                    }

                    toast.success("Recordatorios de Gmail activados");
                } else {
                    // Disable trigger
                    const response = await fetch(
                        `/api/composio/setup-trigger?connectedAccountId=${integration.accountId}`,
                        { method: "DELETE" }
                    );

                    const data = await response.json();
                    if (!data.success) {
                        throw new Error(data.error || "Failed to disable trigger");
                    }

                    toast.success("Recordatorios de Gmail desactivados");
                }

                // Update state
                setIntegrations((prev) =>
                    prev.map((i) =>
                        i.id === id ? { ...i, reminders: !i.reminders } : i
                    )
                );
            }
        } catch (error: any) {
            console.error("Error toggling reminders:", error);
            toast.error(error.message || "Error al cambiar recordatorios");
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Configuración</h1>
                    <p className="text-gray-600">
                        Gestiona tus integraciones y preferencias de notificación
                    </p>
                </div>

                {initialLoading ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3].map((i) => (
                            <Card key={i} className="border-2">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3 flex-1">
                                            <Skeleton className="h-10 w-10 rounded-lg" />
                                            <div className="flex-1 space-y-2">
                                                <Skeleton className="h-4 w-20" />
                                                <Skeleton className="h-3 w-full" />
                                            </div>
                                        </div>
                                        <Skeleton className="h-8 w-20" />
                                    </div>
                                </CardHeader>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {integrations.map((integration) => {
                        const Icon = integration.icon;
                        return (
                            <Card
                                key={integration.id}
                                className={`group hover:shadow-md transition-shadow border-2 ${integration.connected
                                    ? "border-green-200 bg-green-50/50"
                                    : "border-border/50 hover:border-primary/20"
                                    }`}
                            >
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3 flex-1">
                                            <div className="p-2 rounded-lg bg-muted">
                                                <Icon className="h-6 w-6" />
                                            </div>
                                            <div className="flex-1">
                                                <CardTitle className="text-base font-medium">
                                                    {integration.name}
                                                </CardTitle>
                                                <p className="text-sm text-muted-foreground line-clamp-2">
                                                    {integration.description}
                                                </p>
                                            </div>
                                        </div>

                                        {integration.connected ? (
                                            <div className="flex items-center space-x-1 text-green-600">
                                                <CheckCircle className="h-4 w-4" />
                                                <span className="text-sm">Conectado</span>
                                            </div>
                                        ) : integration.id === "slack" || integration.id === "whatsapp" ? (
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        size="sm"
                                                        variant="secondary"
                                                        className="cursor-pointer opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity flex items-center space-x-1"
                                                    >
                                                        <span>Conectar</span>
                                                        <ArrowUpRight className="h-3 w-3" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-64">
                                                    <div className="space-y-2">
                                                        <h4 className="font-medium">Próximamente disponible</h4>
                                                        <p className="text-sm text-muted-foreground">
                                                            Esta integración estará disponible en futuras actualizaciones.
                                                        </p>
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        ) : (
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                className="cursor-pointer opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity flex items-center space-x-1"
                                                onClick={() => handleConnect(integration.id)}
                                                disabled={loading === integration.id}
                                            >
                                                {loading === integration.id ? (
                                                    <>
                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                        <span>Conectando...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span>Conectar</span>
                                                        <ArrowUpRight className="h-3 w-3" />
                                                    </>
                                                )}
                                            </Button>
                                        )}
                                    </div>

                                    {integration.connected && (
                                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <div className="flex items-center gap-1 cursor-help">
                                                        <Label
                                                            htmlFor={`reminders-${integration.id}`}
                                                            className="text-sm font-medium cursor-help"
                                                        >
                                                            Recordatorios automáticos
                                                        </Label>
                                                        <Info className="h-3 w-3 text-muted-foreground" />
                                                    </div>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-64 text-sm">
                                                    <p className="text-muted-foreground">
                                                        Activa esta opción para procesar automáticamente nuevos mensajes de Gmail y extraer información relevante para los merchants.
                                                    </p>
                                                </PopoverContent>
                                            </Popover>
                                            <Switch
                                                id={`reminders-${integration.id}`}
                                                checked={integration.reminders}
                                                onCheckedChange={() => handleRemindersToggle(integration.id)}
                                                disabled={loading === integration.id}
                                            />
                                        </div>
                                    )}

                                    {integration.connected && integration.accountEmail && (
                                        <p className="text-xs text-muted-foreground mt-2">
                                            Cuenta: {integration.accountEmail}
                                        </p>
                                    )}
                                </CardHeader>
                            </Card>
                        );
                    })}
                    </div>
                )}
            </div>
        </div>
    );
}
