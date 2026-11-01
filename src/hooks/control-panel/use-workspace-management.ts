"use client";

import { useRef, useState } from "react";
import type { EditableFile, FileEditorState } from "@/lib/control-panel/types";
import { readWorkspaceFile, saveWorkspaceFile, uploadWorkspaceCv } from "@/lib/control-panel/services/workspace-service";
import type { OperationExecutor } from "./use-dashboard-operations";

export function useWorkspaceManagement(execute: OperationExecutor) {
  const [fileEditor, setFileEditor] = useState<FileEditorState | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openFileEditor = async (type: EditableFile) => {
    const result = await execute(`read-${type}`, () => readWorkspaceFile(type));
    if (!result.ok) return;
    setFileEditor({
      type,
      title: type === "agents" ? "AGENTS.md" : "context/PROFILE.md",
      content: result.value.content,
    });
  };

  const saveFileEditor = async (): Promise<boolean> => {
    if (!fileEditor) return false;
    const { type, title, content } = fileEditor;
    const result = await execute(`save-${type}`, () => saveWorkspaceFile(type, content), {
      successMessage: `${title} saved.`,
    });
    if (result.ok) setFileEditor(null);
    return result.ok;
  };

  const uploadCv = async (file?: File) => {
    if (!file) return;
    await execute("upload-cv", () => uploadWorkspaceCv(file), {
      successMessage: "CV uploaded to your workspace.",
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return { fileInputRef, fileEditor, setFileEditor, openFileEditor, saveFileEditor, uploadCv };
}