"use server";

import { db } from "@/core/db/client";
import {
    paymentProcessors,
    countryProcessorFeatures,
} from "@/core/db/schema";
import { eq, like, or, count, sql } from "drizzle-orm";

interface PaginationParams {
    page?: number;
    pageSize?: number;
}

interface ProcessorFilters extends PaginationParams {
    status?: string;
    search?: string;
}

interface FeatureFilters extends PaginationParams {
    processorId?: string;
    country?: string;
    status?: string;
}

export async function getPaymentProcessors(filters: ProcessorFilters = {}) {
    try {
        const { page = 1, pageSize = 10, status, search } = filters;
        const offset = (page - 1) * pageSize;

        // Build where conditions
        const conditions = [];
        if (status) {
            conditions.push(eq(paymentProcessors.status, status));
        }
        if (search) {
            conditions.push(
                or(
                    like(paymentProcessors.name, `%${search}%`),
                    like(paymentProcessors.id, `%${search}%`)
                )
            );
        }

        // Execute queries based on whether we have filters
        let processors;
        let totalResult;

        if (conditions.length > 0) {
            const whereClause = sql`${sql.join(conditions, sql` AND `)}`;
            [processors, totalResult] = await Promise.all([
                db.select().from(paymentProcessors).where(whereClause).limit(pageSize).offset(offset),
                db.select({ count: count() }).from(paymentProcessors).where(whereClause),
            ]);
        } else {
            [processors, totalResult] = await Promise.all([
                db.select().from(paymentProcessors).limit(pageSize).offset(offset),
                db.select({ count: count() }).from(paymentProcessors),
            ]);
        }

        const total = totalResult[0]?.count || 0;
        const totalPages = Math.ceil(Number(total) / pageSize);

        return {
            success: true,
            data: processors,
            pagination: {
                page,
                pageSize,
                total: Number(total),
                totalPages,
            },
        };
    } catch (error) {
        console.error("Error fetching payment processors:", error);
        return { success: false, error: "Failed to fetch payment processors" };
    }
}

export async function getCountryProcessorFeatures(filters: FeatureFilters = {}) {
    try {
        const { page = 1, pageSize = 10, processorId, country, status } = filters;
        const offset = (page - 1) * pageSize;

        // Build where conditions
        const conditions = [];
        if (processorId) {
            conditions.push(eq(countryProcessorFeatures.processor_id, processorId));
        }
        if (country) {
            conditions.push(like(countryProcessorFeatures.country, `%${country}%`));
        }
        if (status) {
            conditions.push(eq(countryProcessorFeatures.status, status));
        }

        // Execute queries based on whether we have filters
        let features;
        let totalResult;

        if (conditions.length > 0) {
            const whereClause = sql`${sql.join(conditions, sql` AND `)}`;
            [features, totalResult] = await Promise.all([
                db.select().from(countryProcessorFeatures).where(whereClause).limit(pageSize).offset(offset),
                db.select({ count: count() }).from(countryProcessorFeatures).where(whereClause),
            ]);
        } else {
            [features, totalResult] = await Promise.all([
                db.select().from(countryProcessorFeatures).limit(pageSize).offset(offset),
                db.select({ count: count() }).from(countryProcessorFeatures),
            ]);
        }

        const total = totalResult[0]?.count || 0;
        const totalPages = Math.ceil(Number(total) / pageSize);

        return {
            success: true,
            data: features,
            pagination: {
                page,
                pageSize,
                total: Number(total),
                totalPages,
            },
        };
    } catch (error) {
        console.error("Error fetching country processor features:", error);
        return {
            success: false,
            error: "Failed to fetch country processor features",
        };
    }
}

export async function getProcessorWithFeatures(processorId: string) {
    try {
        const processor = await db
            .select()
            .from(paymentProcessors)
            .where(eq(paymentProcessors.id, processorId))
            .limit(1);

        if (processor.length === 0) {
            return { success: false, error: "Processor not found" };
        }

        const features = await db
            .select()
            .from(countryProcessorFeatures)
            .where(eq(countryProcessorFeatures.processor_id, processorId));

        return {
            success: true,
            data: {
                processor: processor[0],
                features,
            },
        };
    } catch (error) {
        console.error("Error fetching processor with features:", error);
        return { success: false, error: "Failed to fetch processor details" };
    }
}