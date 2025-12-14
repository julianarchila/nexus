"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Mail, MessageCircle, Slack, CheckCircle, ArrowUpRight, Info } from "lucide-react";

interface Integration {
    id: string;
    name: string;
    description: string;
    icon: React.ElementType;
    connected: boolean;
    reminders: boolean;
}

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
            connected: true,
            reminders: true,
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

    const handleConnect = (id: string) => {
        setIntegrations((prev) =>
            prev.map((integration) =>
                integration.id === id
                    ? { ...integration, connected: !integration.connected }
                    : integration
            )
        );
    };

    const handleRemindersToggle = (id: string) => {
        setIntegrations((prev) =>
            prev.map((integration) =>
                integration.id === id
                    ? { ...integration, reminders: !integration.reminders }
                    : integration
            )
        );
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
                                            >
                                                <span>Conectar</span>
                                                <ArrowUpRight className="h-3 w-3" />
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
                                                            Recordatorios
                                                        </Label>
                                                        <Info className="h-3 w-3 text-muted-foreground" />
                                                    </div>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-64 text-sm">
                                                    <p className="text-muted-foreground">
                                                        Activa esta opción para recibir notificaciones y recordatorios importantes directamente en {integration.name}.
                                                    </p>
                                                </PopoverContent>
                                            </Popover>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <div>
                                                        <Switch
                                                            id={`reminders-${integration.id}`}
                                                            checked={integration.reminders}
                                                            onCheckedChange={() => handleRemindersToggle(integration.id)}
                                                        />
                                                    </div>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-64 text-sm">
                                                    <p className="text-muted-foreground">
                                                        Activa esta opción para recibir notificaciones y recordatorios importantes directamente en {integration.name}.
                                                    </p>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    )}
                                </CardHeader>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
