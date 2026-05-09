import { createClient } from "@/utils/supabase/server";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { ChatSidebarMenu } from "@/components/chat-sidebar-menu";

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
        <ChatSidebarMenu chats={chats ?? []} />

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
