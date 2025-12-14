import { relations } from "drizzle-orm/relations";
import { merchantProfile, inboundEvent, scopeInDoc, paymentProcessors, countryProcessorFeatures, aiExtraction, auditLog, attachment } from "./schema";

export const inboundEventRelations = relations(inboundEvent, ({one, many}) => ({
	merchantProfile: one(merchantProfile, {
		fields: [inboundEvent.merchantId],
		references: [merchantProfile.id]
	}),
	aiExtractions: many(aiExtraction),
}));

export const merchantProfileRelations = relations(merchantProfile, ({many}) => ({
	inboundEvents: many(inboundEvent),
	scopeInDocs: many(scopeInDoc),
	auditLogs: many(auditLog),
	aiExtractions: many(aiExtraction),
	attachments: many(attachment),
}));

export const scopeInDocRelations = relations(scopeInDoc, ({one}) => ({
	merchantProfile: one(merchantProfile, {
		fields: [scopeInDoc.merchantId],
		references: [merchantProfile.id]
	}),
}));

export const countryProcessorFeaturesRelations = relations(countryProcessorFeatures, ({one}) => ({
	paymentProcessor: one(paymentProcessors, {
		fields: [countryProcessorFeatures.processorId],
		references: [paymentProcessors.id]
	}),
}));

export const paymentProcessorsRelations = relations(paymentProcessors, ({many}) => ({
	countryProcessorFeatures: many(countryProcessorFeatures),
}));

export const auditLogRelations = relations(auditLog, ({one}) => ({
	aiExtraction: one(aiExtraction, {
		fields: [auditLog.aiExtractionId],
		references: [aiExtraction.id]
	}),
	merchantProfile: one(merchantProfile, {
		fields: [auditLog.merchantId],
		references: [merchantProfile.id]
	}),
}));

export const aiExtractionRelations = relations(aiExtraction, ({one, many}) => ({
	auditLogs: many(auditLog),
	inboundEvent: one(inboundEvent, {
		fields: [aiExtraction.inboundEventId],
		references: [inboundEvent.id]
	}),
	merchantProfile: one(merchantProfile, {
		fields: [aiExtraction.merchantId],
		references: [merchantProfile.id]
	}),
}));

export const attachmentRelations = relations(attachment, ({one}) => ({
	merchantProfile: one(merchantProfile, {
		fields: [attachment.merchantId],
		references: [merchantProfile.id]
	}),
}));