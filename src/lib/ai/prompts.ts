export type QuestionType = "Code" | "Theory" | "SystemDesign";

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

export function buildGenerateQuestionMessages(topic: string) {
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
                "Prefer Theory questions unless the topic is algorithmic.",
                "",
                "Output JSON schema (strict):",
                '{ "type": "Code" | "Theory" | "SystemDesign", "difficulty": "Simple" | "Medium" | "Hard", "question": "Markdown formatted question content here." }',
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

