import { WEBHOOK_URL } from "../config";

// Segunda reunión: Profundización técnica y casos de uso
const mockGongWebhook = [
    {
        metaData: {
            id: "5599332235511222780",
            url: "https://app.gong.io/call?id=5599332235511222780",
            title: "Demo técnica - Yuno & Merchant",
            scheduled: "2025-12-20T14:00:00-05:00",
            started: "2025-12-20T14:05:00-05:00",
            duration: 1920,
            primaryUserId: "7744111777663220493",
            direction: "Conference",
            system: "Google Meet",
            scope: "External",
            media: "Video",
            language: "spa"
        },
        context: [
            {
                system: "Salesforce",
                objects: [
                    {
                        objectType: "Opportunity",
                        objectId: "0061Q00000mkU1fQAE",
                        fields: [
                            { name: "StageName", value: "Technical Review" },
                            { name: "Number_of_seats__c", value: 45 },
                            { name: "Amount", value: 85000 },
                            { name: "Probability", value: 70 },
                            { name: "CloseDate", value: "2026-02-28" },
                            { name: "Name", value: "Acme Corp - New Business (45)" },
                            { name: "Type", value: "New Business" }
                        ]
                    }
                ]
            }
        ],
        parties: [
            { id: "7409609343412403343", emailAddress: "maria.garcia@acmecorp.com", name: "María García", title: "VP of Sales", affiliation: "External", methods: ["Invitee", "Attendee"] },
            { id: "9048546196233268852", emailAddress: "juan.perez@yuno.com", name: "Juan Pérez", title: "Sales Engineer", userId: "3022101605611220443", affiliation: "Internal", methods: ["Attendee"] }
        ],
        content: {
            trackers: [
                { name: "Integraciones", count: 3 },
                { name: "Paises", count: 2 },
                { name: "Fraude actual", count: 2 },
                { name: "Tasas de aprobación", count: 2 },
                { name: "Proveedores actuales", count: 2 },
                { name: "Merchant of Record", count: 1 }
            ],
            topics: [
                { name: "Integraciones técnicas", duration: 400 },
                { name: "Fraude y prevención", duration: 300 },
                { name: "Volumen y países", duration: 250 },
                { name: "Merchant of Record", duration: 120 }
            ]
        },
        interaction: {
            speakers: [
                { id: "9048546196233268852", userId: "7041101707613290443", talkTime: 1000 },
                { id: "7409609343412403343", userId: null, talkTime: 920 }
            ],
            interactionStats: [
                { name: "Talk Ratio", value: 0.52 },
                { name: "Questions Asked", value: 10 }
            ],
            video: [
                { name: "Presentation", duration: 900 },
                { name: "Webcam", duration: 1020 }
            ]
        },
        collaboration: {
            publicComments: [
                { id: "2255211009900224215", audioStartTime: 1100, audioEndTime: 1100, commenterUserId: "7041101707613290443", comment: "El merchant tiene dudas sobre integración con su proveedor actual.", posted: "2025-12-20T14:30:00-05:00", inReplyTo: null, duringCall: true }
            ]
        },
        meetingSummary: "Segunda reunión enfocada en detalles técnicos y casos de uso. Se revisaron las integraciones posibles con los sistemas actuales del merchant, los países donde opera y el volumen de transacciones esperado. Se discutió la situación actual de fraude y cómo Yuno puede mejorar la detección y prevención. Se resolvieron dudas sobre tasas de aprobación y la flexibilidad de la plataforma para adaptarse a distintos proveedores y modelos como Merchant of Record. El merchant solicitó una propuesta formal y referencias de clientes similares."
    }
];

async function sendWebhook() {
    console.log("Enviando webhook a:", WEBHOOK_URL);
    console.log("Payload:", JSON.stringify(mockGongWebhook, null, 2));

    try {
        const response = await fetch(WEBHOOK_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Gong-Signature": "mock_signature_123",
            },
            body: JSON.stringify(mockGongWebhook),
        });

        console.log("\n✅ Webhook enviado exitosamente");
        console.log("Status:", response.status);
        console.log("Response:", await response.text());
    } catch (error) {
        console.error("\n❌ Error enviando webhook:", error);
    }
}

sendWebhook();
