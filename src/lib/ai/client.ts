import OpenAI from "openai";
import { useSettingsStore } from "@/store/useSettingsStore";
import { isSameOriginAsApp, normalizeBaseUrl } from "./normalizeBaseUrl";
import { cleanAndParseJSON } from "./parser";
import type { EvaluateAnswerResponse, GenerateQuestionResponse } from "./prompts";
import { buildEvaluateAnswerMessages, buildGenerateQuestionMessages } from "./prompts";

function getThinkingBody(model: string) {
    const lower = model.toLowerCase();
    if (!lower.includes("gemini")) return {};
    return { thinking_budget: 1024 };
}

function getClient() {
    const { apiKey, baseUrl } = useSettingsStore.getState();
    if (!apiKey) throw new Error("未配置 API Key，请先在 Settings 页面完成配置");
    const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
    if (isSameOriginAsApp(normalizedBaseUrl)) {
        throw new Error("Base URL 指向了当前前端站点，请填写真实的 API Host（例如 https://api.openai.com/v1）");
    }
    return new OpenAI({ apiKey, baseURL: normalizedBaseUrl, dangerouslyAllowBrowser: true });
}

function formatClientError(err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (/You need to enable JavaScript/i.test(message) || /Unexpected token\s*</i.test(message)) {
        return "API 返回了 HTML（通常是 Base URL 配错，指向了网页而不是 OpenAI 兼容 API）。请检查 Base URL 是否为 https://.../v1";
    }
    return message;
}

async function withTimeout<T>(promise: Promise<T>, ms: number, controller: AbortController) {
    const timeoutId = window.setTimeout(() => controller.abort(), ms);
    try {
        return await promise;
    } finally {
        window.clearTimeout(timeoutId);
    }
}

export async function generateQuestion(topic: string, opts?: { timeoutMs?: number }) {
    const { model } = useSettingsStore.getState();
    const client = getClient();
    const controller = new AbortController();
    try {
        const request = client.chat.completions.create(
            {
                model,
                messages: buildGenerateQuestionMessages(topic),
                temperature: 0.7,
                max_tokens: 800,
                ...(getThinkingBody(model) as Record<string, unknown>),
            },
            { signal: controller.signal },
        );

        const result = await withTimeout(request, opts?.timeoutMs ?? 45_000, controller);
        const text = result.choices?.[0]?.message?.content ?? "";
        if (!text) throw new Error("AI 未返回内容");
        return cleanAndParseJSON<GenerateQuestionResponse>(text);
    } catch (err) {
        throw new Error(formatClientError(err));
    }
}

export async function evaluateAnswer(
    args: { topic: string; question: string; userAnswer: string },
    opts?: { timeoutMs?: number },
) {
    const { model } = useSettingsStore.getState();
    const client = getClient();
    const controller = new AbortController();
    try {
        const request = client.chat.completions.create(
            {
                model,
                messages: buildEvaluateAnswerMessages(args),
                temperature: 0.2,
                max_tokens: 1200,
                ...(getThinkingBody(model) as Record<string, unknown>),
            },
            { signal: controller.signal },
        );

        const result = await withTimeout(request, opts?.timeoutMs ?? 60_000, controller);
        const text = result.choices?.[0]?.message?.content ?? "";
        if (!text) throw new Error("AI 未返回内容");
        return cleanAndParseJSON<EvaluateAnswerResponse>(text);
    } catch (err) {
        throw new Error(formatClientError(err));
    }
}

