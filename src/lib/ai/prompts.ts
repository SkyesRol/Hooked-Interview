export type QuestionType = "Coding" | "Concept" | "Design" | "Scenario";

export type GenerateQuestionResponse = {
    type: QuestionType;
    difficulty: "Simple" | "Medium" | "Hard";
    question: string;
};

export type EvaluateAnswerResponse = {
    score: number;
    dimensions: {
        accuracy: number;
        completeness: number;
        logic: number;
        codeQuality: number;
    };
    techTags: string[];
    comment: string;
    referenceAnswer: string;
};

export type FollowUpMode = "remedial" | "deepen";

export type GenerateFollowUpQuestionResponse = {
    mode: FollowUpMode;
    focus: string;
    question: string;
    stopAfterThis: boolean;
    stopReason: string;
};

export function buildGenerateQuestionMessages(
    topic: string,
    opts?: { difficulty?: GenerateQuestionResponse["difficulty"]; type?: GenerateQuestionResponse["type"] },
) {
    return [
        {
            role: "system" as const,
            content:
                "You are a senior frontend interviewer from a top tech company. You must output RAW JSON only, no markdown, no extra text.",
        },
        {
            role: "user" as const,
            content: [
                `Goal: Generate one interview question for topic: ${topic}.`,
                `Required difficulty: ${opts?.difficulty ?? "Any"}.`,
                `Required type: ${opts?.type ?? "Any"}.`,
                "Prefer Theory questions unless the topic is algorithmic.",
                "",
                "Output JSON schema (strict):",
                '{ "type": "Coding" | "Concept" | "Design" | "Scenario", "difficulty": "Simple" | "Medium" | "Hard", "question": "Markdown formatted question content here." }',
                "",
                "Constraint: Return RAW JSON ONLY. Do NOT wrap with ```json.",
            ].join("\n"),
        },
    ];
}

export function buildEvaluateAnswerMessages(args: { topic: string; question: string; userAnswer: string }) {
    const { topic, question, userAnswer } = args;
    return [
        {
            role: "system" as const,
            content: "You are a strict technical interviewer. Return RAW JSON only.",
        },
        {
            role: "user" as const,
            content: [
                "Context:",
                `- Topic: ${topic}`,
                `- Question: ${question}`,
                `- Candidate Answer: ${userAnswer}`,
                "",
                "Task: Evaluate the answer and return a JSON object.",
                "",
                "JSON schema requirements:",
                "1. score: 0-100 integer",
                "2. dimensions: { accuracy, completeness, logic, codeQuality } each 0-10",
                '3. techTags: 2-4 key concepts array, e.g. ["Event Loop","Promise"]',
                "4. comment: brief feedback string",
                "5. referenceAnswer: optimal solution in Markdown",
                "",
                "Constraint: Return RAW JSON ONLY. No extra text. No markdown formatting.",
            ].join("\n"),
        },
    ];
}

export function buildGenerateFollowUpQuestionMessages(args: {
    topic: string;
    parentQuestion: string;
    parentAnswer: string;
    evaluation: EvaluateAnswerResponse;
    mode: FollowUpMode;
    focus: string;
    depth: number;
    maxDepth: number;
}) {
    return [
        {
            role: "system" as const,
            content: "You are a senior technical interviewer. Return RAW JSON only.",
        },
        {
            role: "user" as const,
            content: [
                "Goal: Generate ONE follow-up question based on the previous Q&A and evaluation.",
                "",
                `Topic: ${args.topic}`,
                `Mode: ${args.mode}`,
                `Focus: ${args.focus}`,
                `Follow-up depth: ${args.depth}/${args.maxDepth}`,
                "",
                "Previous question (Markdown):",
                args.parentQuestion,
                "",
                "Candidate answer:",
                args.parentAnswer,
                "",
                "Evaluation JSON:",
                JSON.stringify(args.evaluation),
                "",
                "Rules:",
                "- Ask ONE precise follow-up question.",
                "- If mode=remedial: target the key gap; avoid adding too much scope.",
                "- If mode=deepen: push one level deeper with constraints or trade-offs.",
                "- Keep it answerable within 3-6 minutes.",
                "- Prefer Scenario/Design/Concept style unless clearly a coding follow-up.",
                "",
                "Output JSON schema (strict):",
                '{ "mode": "remedial" | "deepen", "focus": "string", "question": "Markdown question", "stopAfterThis": boolean, "stopReason": "string" }',
                "",
                "Constraint: Return RAW JSON ONLY. No extra text. No markdown fences.",
            ].join("\n"),
        },
    ];
}

