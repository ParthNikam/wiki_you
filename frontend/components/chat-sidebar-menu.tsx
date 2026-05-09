"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SubmitEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

type ChatSummary = {
  id: string;
  name: string | null;
};

type ChatSidebarMenuProps = {
  chats: ChatSummary[];
};

export function ChatSidebarMenu({ chats }: ChatSidebarMenuProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [isSavingRename, setIsSavingRename] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingChatId) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editingChatId]);

  const handleCreateChat = async () => {
    const response = await fetch("/api/chats", {
      method: "POST",
    });

    if (!response.ok) {
      console.error("Failed to create chat");
      return;
    }

    const result = await response.json();
    if (result.chat?.id) {
      router.push(`/dashboard/chat/${result.chat.id}`);
      router.refresh();
    }
  };

  const startRenamingChat = (chat: ChatSummary) => {
    setEditingChatId(chat.id);
    setDraftName(chat.name || "Untitled chat");
  };

  const cancelRenamingChat = () => {
    setEditingChatId(null);
    setDraftName("");
  };

  const handleRenameChat = async (chat: ChatSummary) => {
    const trimmedName = draftName.trim();

    if (!trimmedName || trimmedName === chat.name) {
      cancelRenamingChat();
      return;
    }

    setIsSavingRename(true);

    const response = await fetch(`/api/chats/${chat.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: trimmedName }),
    });

    if (!response.ok) {
      console.error("Failed to rename chat");
      setIsSavingRename(false);
      return;
    }

    setIsSavingRename(false);
    cancelRenamingChat();
    router.refresh();
  };

  const handleRenameKeyDown = (
    event: KeyboardEvent<HTMLInputElement>,
    chat: ChatSummary
  ) => {
    if (event.key === "Escape") {
      event.preventDefault();
      cancelRenamingChat();
    }

    if (event.key === "Enter") {
      event.preventDefault();
      void handleRenameChat(chat);
    }
  };

  const handleRenameSubmit = async (
    event: SubmitEvent<HTMLFormElement>,
    chat: ChatSummary
  ) => {
    event.preventDefault();
    await handleRenameChat(chat);
  };

  const handleDeleteChat = async (chat: ChatSummary) => {
    const confirmed = window.confirm(
      `Delete "${chat.name || "Untitled chat"}"?`
    );

    if (!confirmed) {
      return;
    }

    const response = await fetch(`/api/chats/${chat.id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      console.error("Failed to delete chat");
      return;
    }

    if (pathname === `/dashboard/chat/${chat.id}`) {
      router.push("/dashboard");
    }

    router.refresh();
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-md">Chats</SidebarGroupLabel>

      <SidebarMenu>
        {chats.map((chat) => (
          <SidebarMenuItem key={chat.id}>
            {editingChatId === chat.id ? (
              <form
                className="pr-14"
                onSubmit={(event) => void handleRenameSubmit(event, chat)}
              >
                <Input
                  ref={inputRef}
                  aria-label="Chat name"
                  className="h-9 rounded-xl bg-white text-sm text-black"
                  disabled={isSavingRename}
                  onBlur={() => void handleRenameChat(chat)}
                  onChange={(event) => setDraftName(event.target.value)}
                  onKeyDown={(event) => handleRenameKeyDown(event, chat)}
                  value={draftName}
                />
              </form>
            ) : (
              <SidebarMenuButton
                asChild
                isActive={pathname === `/dashboard/chat/${chat.id}`}
              >
                <Link href={`/dashboard/chat/${chat.id}`}>
                  <span className="truncate font-medium text-black">
                    {chat.name || "Untitled chat"}
                  </span>
                </Link>
              </SidebarMenuButton>
            )}

            <SidebarMenuAction
              aria-label={`Rename ${chat.name || "chat"}`}
              onClick={() => startRenamingChat(chat)}
              showOnHover
              title="Rename chat"
            >
              <Pencil />
            </SidebarMenuAction>

            <SidebarMenuAction
              aria-label={`Delete ${chat.name || "chat"}`}
              className="right-7"
              onClick={() => handleDeleteChat(chat)}
              showOnHover
              title="Delete chat"
            >
              <Trash2 />
            </SidebarMenuAction>
          </SidebarMenuItem>
        ))}

        {chats.length === 0 && (
          <div className="px-2 py-1.5 text-xs text-muted-foreground">
            No chats found
          </div>
        )}

        <SidebarMenuItem className="pt-2">
          <Button
            className="w-full justify-start rounded-xl"
            onClick={handleCreateChat}
            size="sm"
            variant="outline"
          >
            <Plus />
            New chat
          </Button>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
