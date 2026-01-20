export function cleanAndParseJSON<T>(text: string): T {
    try {
        return JSON.parse(text) as T;
    } catch {
        const fenced = text
            .replace(/```(?:json)?/gi, "")
            .replace(/```/g, "")
            .trim();

        try {
            return JSON.parse(fenced) as T;
        } catch {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    return JSON.parse(jsonMatch[0]) as T;
                } catch {
                    throw new Error("AI output structure invalid");
                }
            }
            throw new Error("No JSON object found in AI response");
        }
    }
}

