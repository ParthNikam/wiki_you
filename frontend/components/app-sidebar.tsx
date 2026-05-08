import { createClient } from "@/utils/supabase/server";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import Link from "next/link";

export async function AppSidebar() {

  const supabase = await createClient();

  const {data: { user },} = await supabase.auth.getUser();

  const { data: chats, error } = await supabase
    .from("chats")
    .select("*")
    .eq("creator", user?.id)
    .order('created_at', {ascending: false});

  if (error) {
    console.error(error.message);
  }

  return (  
    <Sidebar>
      <SidebarHeader>
        <span className="text-xl font-bold">Wiki You</span>
    </SidebarHeader>
    
      <SidebarContent>
        <SidebarGroup>
            <SidebarGroupLabel className="text-md">Chats</SidebarGroupLabel>
            <SidebarMenu>
              {chats?.map((chat) => (
                <SidebarMenuItem key={chat.id}>
                  <SidebarMenuButton asChild>
                    <Link href={`/dashboard/chat/${chat.id}`}>
                      <span className="text-black text-bold">{chat.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {chats?.length === 0 && (
                <div className="px-2 py-1.5 text-xs text-muted-foreground">
                  No chats found
                </div>
              )}
            </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
            <SidebarGroupLabel className="text-md">Files</SidebarGroupLabel>
            <SidebarMenu></SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
       <SidebarFooter>

        <SidebarMenu>
        <SidebarMenuItem>
            <SidebarMenuButton>
                User 1
            {/* <User2 /> Username */}
            </SidebarMenuButton>
        </SidebarMenuItem>
        </SidebarMenu>
    </SidebarFooter>
    </Sidebar>
  )
}