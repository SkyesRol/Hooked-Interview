import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownRenderer({ content, className }: { content: string; className?: string }) {
    const processedContent = useMemo(() => {
        if (!content) return "";
        // Replace literal "\n" sequence with actual newline character
        // This handles cases where data comes from JSON with escaped newlines
        return content.replace(/\\n/g, "\n");
    }, [content]);

    return (
        <div className={className}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    a: ({ href, children, ...props }) => (
                        <a href={href} target="_blank" rel="noreferrer" {...props}>
                            {children}
                        </a>
                    ),
                }}
            >
                {processedContent}
            </ReactMarkdown>
        </div>
    );
}

