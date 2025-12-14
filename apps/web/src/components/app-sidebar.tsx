import { CreditCard, Store } from "lucide-react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";

// Menu items.
const items = [
  {
    title: "Merchants",
    url: "/",
    icon: Store,
  },
  {
    title: "Payments",
    url: "/payment-processors",
    icon: CreditCard,
  },
];

export function AppSidebar() {
  return (
    <Sidebar className="border-r border-gray-100 bg-white" collapsible="icon">
      <SidebarHeader className="h-16 flex items-center justify-center border-b border-gray-50">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-lg">Y</span>
        </div>
      </SidebarHeader>
      <SidebarContent className="bg-white pt-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    className="h-12 w-12 justify-center rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all mx-auto mb-2"
                  >
                    <Link href={item.url}>
                      <item.icon className="!h-6 !w-6" />
                      <span className="sr-only">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-gray-50">
        <div className="flex items-center justify-center">
          <UserButton
            appearance={{
              elements: {
                avatarBox: "w-8 h-8",
              },
            }}
          />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
