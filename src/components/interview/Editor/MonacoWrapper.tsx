import { Editor } from "@monaco-editor/react";

export function MonacoWrapper({
    value,
    onChange,
    readOnly,
}: {
    value: string;
    onChange?: (value: string) => void;
    readOnly?: boolean;
}) {
    return (
        <div className="monaco-sketch h-full w-full">
            <Editor
                height="100%"
                defaultLanguage="typescript"
                value={value}
                onChange={(v) => onChange?.(v ?? "")}
                options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    wordWrap: "on",
                    scrollBeyondLastLine: false,
                    readOnly: Boolean(readOnly),
                    scrollbar: {
                        vertical: "visible",
                        horizontal: "visible",
                        useShadows: false,
                        verticalScrollbarSize: 10,
                        horizontalScrollbarSize: 10,
                    },
                    overviewRulerLanes: 0,
                    hideCursorInOverviewRuler: true,
                    overviewRulerBorder: false,
                }}
            />
        </div>
    );
}

