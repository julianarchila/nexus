## 1. Context: Who we are & the problem

We are **Yuno**, a payments orchestration platform.
Yuno connects merchants to multiple PSPs (payment service providers), payment methods, and countries, and helps route, retry, and optimize payments across providers.

### The problem we are solving

From the very first interaction with a merchant, critical information is generated:

* Technical requirements (PSPs, countries, payment methods)
* Operational constraints (compliance, data storage limits, onboarding exceptions)
* Commercial agreements
* Key dates and commitments
* Special integration flows

This information currently lives scattered across:

* Sales calls
* Slack conversations
* Meeting recordings
* Salesforce notes
* Docs and spreadsheets

As merchants move through their lifecycle (Sales → Integration → Support → Live), this context:

* Gets lost
* Gets duplicated
* Gets contradicted

This causes:

* Internal rework
* Broken handoffs between Sales, PM, and Support
* Merchants discovering blockers too late (e.g., unsupported PSPs)

### Example problems

* A merchant mentions during a call that they require **Adyen + Brazil + Pix**, Sales agrees verbally, but Yuno does **not support Adyen yet** → blocker discovered weeks later.
* Operational constraints (e.g., “we cannot store any card data”) are mentioned in Slack but never reflected in Salesforce.
* Go-live dates are mentioned verbally but never tracked or validated.

---

## 2. Proposed solution

We are building a **real-time desktop Copilot** (Electron app) for Sales, PM, and Support, similar in UX to tools like *Cluely*.

### Core idea

* The user opens the Copilot before joining a call.
* The user selects the **merchant** they are speaking with.
* The Copilot listens to the meeting audio in real time.
* Audio is transcribed using **Whisper**.
* Transcribed text is analyzed to extract structured “claims” such as:

  * PSP requirements
  * Countries
  * Payment methods
  * Restrictions
  * Dates
  * Risks
* These claims are compared against:

  * Salesforce (source of truth)
  * Internal capability data (supported PSPs, methods, countries)

### Real-time assistance

While the call is happening, the Copilot can:

* Alert the user if the merchant mentions something unsupported
* Surface relevant context from Salesforce
* Suggest follow-up questions
* Allow the user to trigger actions with one click:

  * Create a Linear ticket
  * Update Salesforce fields
  * Add structured notes linked to the original conversation

### Design principles

* Salesforce remains the **source of truth**
* The Copilot assists humans; it does not make irreversible decisions autonomously
* Every extracted insight is traceable to its source (timestamp + transcript)
* Real-time, low-latency feedback is critical

---

## 3. What you need to do


1. **Analyze the existing repository** (structure, tech stack, patterns).
2. Design a **concrete implementation plan** for this system.

### The implementation should include:

* Proposed high-level architecture
* Clear separation of:

  * Electron client responsibilities
  * Backend responsibilities
* Audio capture and streaming approach
* Whisper integration strategy (chunking, latency considerations)
* NLP / insight extraction flow
* Data models for:

  * Transcriptions
  * Extracted claims
  * Suggestions / alerts
* API design:

  * WebSocket vs REST
  * Key endpoints
* How actions (Salesforce updates, Linear tickets) are invoked
* Security considerations (auth, data handling)
* A suggested **MVP scope** vs future extensions

### Constraints & assumptions

* Electron is mandatory for the client
* Whisper is the speech-to-text engine
* Salesforce is the source of truth (We will use a notion crm for the mvp)
* Linear is the ticketing system
* Real-time feedback matters more than perfect accuracy

---

### Output format

Please structure your answer as:

1. **System Architecture Overview**
2. **Client (Electron) Design**
3. **Backend Design**
4. **Data Models**
5. **API Contracts**
6. **Whisper Integration Details**
7. **MVP Implementation Plan**
8. **Key Risks & Tradeoffs**

Be explicit and pragmatic.
Assume this system will be built and used in production.

