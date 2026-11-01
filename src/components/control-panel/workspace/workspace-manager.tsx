"use client";

import { useEffect, useRef, useState } from "react";
import { getWorkspaceFile, saveWorkspaceFile, uploadWorkspaceCv } from "@/lib/admin-services/workspace-service";
import type { EditableFile, FileEditorState } from "@/types/control-panel/control-panel.types";
import { WorkspacePanel } from "./workspace-panel";
import FileEditorDialog from "./file-editor-dialog";

// This manager contains only workspace file actions, matching Coffee Shop's admin managers.
export default function WorkspaceManager({ editProfileOpen, closeEditProfile, uploadCvOpen, closeUploadCv, notify }: {
  editProfileOpen: boolean;
  closeEditProfile: () => void;
  uploadCvOpen: boolean;
  closeUploadCv: () => void;
  notify: (text: string, kind: "ok" | "error") => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [editor, setEditor] = useState<FileEditorState | null>(null);

  async function openFileEditor(type: EditableFile) {
    setBusy(true);
    try {
      const file = await getWorkspaceFile(type);
      setEditor({ type, content: file.content,
        title: type === "agents" ? "AGENTS.md" : "context/PROFILE.md" });
    } catch (error) { notify(error instanceof Error ? error.message : "Unable to read file", "error"); }
    finally { setBusy(false); }
  }

  function closeEditor() {
    setEditor(null);
    closeEditProfile();
  }

  useEffect(() => {
    if (editProfileOpen) void openFileEditor("profile");
    // The request flag is only changed by Quick Actions; a manual editor is independent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editProfileOpen]);

  useEffect(() => {
    if (uploadCvOpen) {
      fileInputRef.current?.click();
      closeUploadCv();
    }
  }, [uploadCvOpen, closeUploadCv]);

  async function handleSaveFile() {
    if (!editor) return;
    setBusy(true);
    try {
      await saveWorkspaceFile(editor.type, editor.content);
      notify(`${editor.title} saved.`, "ok");
      closeEditor();
    } catch (error) { notify(error instanceof Error ? error.message : "Unable to save file", "error"); }
    finally { setBusy(false); }
  }

  async function handleUpload(file?: File) {
    if (!file) return;
    setBusy(true);
    try { await uploadWorkspaceCv(file); notify("CV uploaded.", "ok"); }
    catch (error) { notify(error instanceof Error ? error.message : "Unable to upload CV", "error"); }
    finally { setBusy(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
  }

  return <>
    <WorkspacePanel fileInputRef={fileInputRef} uploadCv={handleUpload} openFileEditor={openFileEditor} busy={busy}/>
    {editor && <FileEditorDialog file={editor} busy={busy}
      onChange={content => setEditor(current => current ? { ...current, content } : null)}
      onClose={closeEditor} onSave={handleSaveFile}/>}
  </>;
}