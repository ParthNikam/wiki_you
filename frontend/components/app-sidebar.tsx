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

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader>
        <span className="text-xl font-bold">Wiki You</span>
    </SidebarHeader>
    
      <SidebarContent>
        <SidebarGroup>
            <SidebarGroupLabel className="text-md">Chats</SidebarGroupLabel>
            <SidebarMenu>
                
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