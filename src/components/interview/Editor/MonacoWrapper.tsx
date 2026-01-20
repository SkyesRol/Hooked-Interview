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
            }}
        />
    );
}

