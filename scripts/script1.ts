import { WEBHOOK_URL } from "../config";

// Webhook simulado de Gong con el formato real de la API
const mockGongWebhook = [
    {
        "metaData": {
            "id": "5599332235511222779",
            "url": "https://app.gong.io/call?id=5599332235511222779",
            "title": "Demo - Acme Corp",
            "scheduled": "2025-12-13T14:00:00-05:00",
            "started": "2025-12-13T14:03:37.041977-05:00",
            "duration": 1845,
            "primaryUserId": "7744111777663220493",
            "direction": "Conference",
            "system": "Zoom",
            "scope": "External",
            "media": "Video",
            "language": "spa"
        },
        "context": [
            {
                "system": "Salesforce",
                "objects": [
                    {
                        "objectType": "Opportunity",
                        "objectId": "0061Q00000mkU1fQAE",
                        "fields": [
                            {
                                "name": "StageName",
                                "value": "Qualification"
                            },
                            {
                                "name": "Number_of_seats__c",
                                "value": 45
                            },
                            {
                                "name": "Amount",
                                "value": 85000
                            },
                            {
                                "name": "Probability",
                                "value": 60
                            },
                            {
                                "name": "CloseDate",
                                "value": "2026-02-28"
                            },
                            {
                                "name": "ARR_impact_rollup__c",
                                "value": "true"
                            },
                            {
                                "name": "Name",
                                "value": "Acme Corp - New Business (45)"
                            },
                            {
                                "name": "Type",
                                "value": "New Business"
                            },
                            {
                                "name": "Primary_contact_persona__c",
                                "value": "VP of Sales"
                            },
                            {
                                "name": "ARR_future_impact__c",
                                "value": "true"
                            },
                            {
                                "name": "MRR__c",
                                "value": 7083.33
                            },
                            {
                                "name": "Must_Win__c",
                                "value": "true"
                            }
                        ]
                    },
                    {
                        "objectType": "Account",
                        "objectId": "0011630000vmLBaEEN",
                        "fields": [
                            {
                                "name": "Industry",
                                "value": "Technology"
                            },
                            {
                                "name": "Employees__c",
                                "value": 850
                            },
                            {
                                "name": "ARR__c",
                                "value": 0
                            },
                            {
                                "name": "CS_Tier__c",
                                "value": "1. Platinum"
                            },
                            {
                                "name": "Account_Behavior_Score__c",
                                "value": 8750
                            },
                            {
                                "name": "Website",
                                "value": "acmecorp.com"
                            },
                            {
                                "name": "Sales_Team_Size__c",
                                "value": "45"
                            },
                            {
                                "name": "Score__c",
                                "value": 145
                            },
                            {
                                "name": "Size_Category__c",
                                "value": "2. Enterprise"
                            },
                            {
                                "name": "Name",
                                "value": "Acme Corp"
                            }
                        ]
                    }
                ]
            }
        ],
        "parties": [
            {
                "id": "7409609343412403343",
                "emailAddress": "maria.garcia@acmecorp.com",
                "name": "María García",
                "title": "VP of Sales",
                "speakerId": "1177336688551133887",
                "context": [
                    {
                        "system": "Salesforce",
                        "objects": [
                            {
                                "objectType": "Contact",
                                "objectId": "0331Z0000571AdPQDU",
                                "fields": [
                                    {
                                        "name": "AccountOwnerId__c",
                                        "value": "0551Z00000KdYa3"
                                    },
                                    {
                                        "name": "Account_Name__c",
                                        "value": "Acme Corp"
                                    },
                                    {
                                        "name": "Account_Status__c",
                                        "value": "Prospect"
                                    }
                                ]
                            }
                        ]
                    }
                ],
                "affiliation": "External",
                "methods": [
                    "Invitee",
                    "Attendee"
                ]
            },
            {
                "id": "8822440055511333991",
                "emailAddress": "carlos.mendez@acmecorp.com",
                "name": "Carlos Méndez",
                "title": "Director of Sales Operations",
                "speakerId": "2288447799662244998",
                "context": [
                    {
                        "system": "Salesforce",
                        "objects": [
                            {
                                "objectType": "Contact",
                                "objectId": "0331Z0000571BePRTY",
                                "fields": [
                                    {
                                        "name": "AccountOwnerId__c",
                                        "value": "0551Z00000KdYa3"
                                    },
                                    {
                                        "name": "Account_Name__c",
                                        "value": "Acme Corp"
                                    },
                                    {
                                        "name": "Account_Status__c",
                                        "value": "Prospect"
                                    }
                                ]
                            }
                        ]
                    }
                ],
                "affiliation": "External",
                "methods": [
                    "Attendee"
                ]
            },
            {
                "id": "9048546196233268852",
                "emailAddress": "juan.perez@miempresa.com",
                "name": "Juan Pérez",
                "title": "Senior Account Executive",
                "userId": "3022101605611220443",
                "speakerId": "7265406288145283521",
                "context": [
                    {
                        "system": "Salesforce",
                        "objects": [
                            {
                                "objectType": "User",
                                "objectId": "00557000007AJB1DDO",
                                "fields": [
                                    {
                                        "name": "PlayGongVoicePrompt__c",
                                        "value": "false"
                                    }
                                ]
                            }
                        ]
                    }
                ],
                "affiliation": "Internal",
                "methods": [
                    "Attendee"
                ]
            }
        ],
        "content": {
            "trackers": [
                {
                    "name": "Pricing",
                    "count": 5
                },
                {
                    "name": "Demo Request",
                    "count": 2
                },
                {
                    "name": "Competitors",
                    "count": 1,
                    "phrases": [
                        {
                            "count": 1,
                            "phrase": "Salesforce"
                        }
                    ]
                },
                {
                    "name": "AI/Machine Learning",
                    "count": 8,
                    "phrases": [
                        {
                            "count": 5,
                            "phrase": "inteligencia artificial"
                        },
                        {
                            "count": 3,
                            "phrase": "personalización"
                        }
                    ]
                },
                {
                    "name": "Implementation",
                    "count": 4,
                    "phrases": [
                        {
                            "count": 2,
                            "phrase": "implementación"
                        },
                        {
                            "count": 2,
                            "phrase": "integración"
                        }
                    ]
                },
                {
                    "name": "Budget",
                    "count": 3
                },
                {
                    "name": "Decision Process",
                    "count": 2
                },
                {
                    "name": "Timeline",
                    "count": 4,
                    "phrases": [
                        {
                            "count": 4,
                            "phrase": "próxima semana"
                        }
                    ]
                },
                {
                    "name": "CRM",
                    "count": 6,
                    "phrases": [
                        {
                            "count": 6,
                            "phrase": "Salesforce"
                        }
                    ]
                }
            ],
            "topics": [
                {
                    "name": "Product Features",
                    "duration": 420
                },
                {
                    "name": "Pricing & ROI",
                    "duration": 310
                },
                {
                    "name": "Implementation",
                    "duration": 180
                },
                {
                    "name": "Integrations",
                    "duration": 245
                },
                {
                    "name": "Customer Success",
                    "duration": 155
                },
                {
                    "name": "Next Steps",
                    "duration": 120
                },
                {
                    "name": "Competition",
                    "duration": 90
                },
                {
                    "name": "Use Cases",
                    "duration": 325
                }
            ]
        },
        "interaction": {
            "speakers": [
                {
                    "id": "9048546196233268852",
                    "userId": "7041101707613290443",
                    "talkTime": 945
                },
                {
                    "id": "7409609343412403343",
                    "userId": null,
                    "talkTime": 620
                },
                {
                    "id": "8822440055511333991",
                    "userId": null,
                    "talkTime": 280
                }
            ],
            "interactionStats": [
                {
                    "name": "Talk Ratio",
                    "value": 0.49
                },
                {
                    "name": "Longest Monologue",
                    "value": 125
                },
                {
                    "name": "Longest Customer Story",
                    "value": 95
                },
                {
                    "name": "Interactivity",
                    "value": 6.2
                },
                {
                    "name": "Patience",
                    "value": 0.92
                },
                {
                    "name": "Questions Asked",
                    "value": 14
                }
            ],
            "video": [
                {
                    "name": "Browser",
                    "duration": 0
                },
                {
                    "name": "Presentation",
                    "duration": 580.5
                },
                {
                    "name": "Webcam",
                    "duration": 1264.5
                }
            ]
        },
        "collaboration": {
            "publicComments": [
                {
                    "id": "2255211009900224213",
                    "audioStartTime": 1200.5,
                    "audioEndTime": 1200.5,
                    "commenterUserId": "7041101707613290443",
                    "comment": "Gran momento para mencionar el caso de éxito de cliente similar",
                    "posted": "2025-12-13T14:23:39.113071-05:00",
                    "inReplyTo": null,
                    "duringCall": true
                },
                {
                    "id": "2255211009900224214",
                    "audioStartTime": 1650.8,
                    "audioEndTime": 1650.8,
                    "commenterUserId": "3022101605611220443",
                    "comment": "Recordar enviar material técnico después de la llamada",
                    "posted": "2025-12-13T14:30:15.445223-05:00",
                    "inReplyTo": null,
                    "duringCall": true
                }
            ]
        },
        // Resumen claro de la reunión (Yuno vs merchant)
        "meetingSummary": "Primera reunión de contacto entre Yuno y un posible merchant. El equipo de Yuno presentó la plataforma, destacando cómo permite aceptar todos los métodos de pago y gestionar la prevención de fraude desde una sola integración. Se discutieron los principales retos del merchant: bajas tasas de aprobación, procesos de pago complicados, y gestión ineficiente del fraude. Yuno explicó los beneficios clave: integración única con todos los ecosistemas de pago y anti-fraude, flujos personalizables sin código, centralización de datos y soporte dedicado. Se abordaron temas como integraciones actuales, países de operación, volumen de transacciones, situación de fraude, tasas de aprobación, proveedores actuales y la posibilidad de operar como Merchant of Record. El merchant mostró interés en explorar una integración y se acordó una segunda reunión para revisar detalles técnicos y casos de uso específicos."
    },
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
