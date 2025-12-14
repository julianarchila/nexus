import { MONG_WEBHOOK_URL } from "../config";

// Tercera reunión: Cierre del deal
const mockGongWebhook = [
  {
    metaData: {
      id: "5599332235511222781",
      url: "https://app.gong.io/call?id=5599332235511222781",
      title: "Cierre - Yuno & Merchant",
      scheduled: "2025-12-27T14:00:00-05:00",
      started: "2025-12-27T14:02:00-05:00",
      duration: 1600,
      primaryUserId: "7744111777663220493",
      direction: "Conference",
      system: "Zoom",
      scope: "External",
      media: "Video",
      language: "spa",
    },
    context: [
      {
        system: "Salesforce",
        objects: [
          {
            objectType: "Opportunity",
            objectId: "0061Q00000mkU1fQAE",
            fields: [
              { name: "StageName", value: "Closed Won" },
              { name: "Number_of_seats__c", value: 45 },
              { name: "Amount", value: 85000 },
              { name: "Probability", value: 100 },
              { name: "CloseDate", value: "2026-02-28" },
              { name: "Name", value: "Acme Corp - New Business (45)" },
              { name: "Type", value: "New Business" },
            ],
          },
        ],
      },
    ],
    parties: [
      {
        id: "7409609343412403343",
        emailAddress: "maria.garcia@acmecorp.com",
        name: "María García",
        title: "VP of Sales",
        affiliation: "External",
        methods: ["Invitee", "Attendee"],
      },
      {
        id: "9048546196233268852",
        emailAddress: "juan.perez@yuno.com",
        name: "Juan Pérez",
        title: "Sales Director",
        userId: "3022101605611220443",
        affiliation: "Internal",
        methods: ["Attendee"],
      },
    ],
    content: {
      trackers: [
        { name: "Integraciones", count: 2 },
        { name: "Paises", count: 1 },
        { name: "Fraude actual", count: 1 },
        { name: "Tasas de aprobación", count: 1 },
        { name: "Proveedores actuales", count: 1 },
        { name: "Merchant of Record", count: 1 },
      ],
      topics: [
        { name: "Cierre comercial", duration: 400 },
        { name: "Onboarding", duration: 300 },
        { name: "Integraciones finales", duration: 200 },
        { name: "Siguientes pasos", duration: 100 },
      ],
    },
    interaction: {
      speakers: [
        {
          id: "9048546196233268852",
          userId: "7041101707613290443",
          talkTime: 800,
        },
        { id: "7409609343412403343", userId: null, talkTime: 800 },
      ],
      interactionStats: [
        { name: "Talk Ratio", value: 0.5 },
        { name: "Questions Asked", value: 6 },
      ],
      video: [
        { name: "Presentation", duration: 400 },
        { name: "Webcam", duration: 1200 },
      ],
    },
    collaboration: {
      publicComments: [
        {
          id: "2255211009900224216",
          audioStartTime: 900,
          audioEndTime: 900,
          commenterUserId: "7041101707613290443",
          comment:
            "El merchant confirma interés y solicita cronograma de onboarding.",
          posted: "2025-12-27T14:30:00-05:00",
          inReplyTo: null,
          duringCall: true,
        },
      ],
    },
    meetingSummary:
      "Tercera reunión y cierre del deal entre Yuno y el merchant. Se resolvieron las últimas dudas sobre integraciones, países y modelo de Merchant of Record. El merchant confirmó su interés y se acordó el inicio del proceso de onboarding. Se establecieron los siguientes pasos para la integración técnica y se asignaron responsables de ambos lados. El deal quedó oficialmente cerrado y ambas partes celebraron el inicio de la colaboración.",
  },
];

async function sendWebhook() {
  console.log("Enviando webhook a:", MONG_WEBHOOK_URL);
  console.log("Payload:", JSON.stringify(mockGongWebhook, null, 2));

  try {
    const response = await fetch(MONG_WEBHOOK_URL, {
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
