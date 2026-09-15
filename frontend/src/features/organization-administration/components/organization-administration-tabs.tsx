import { Users } from 'lucide-react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { MemberManagement } from './member-management'

export function OrganizationAdministrationTabs() {
  return (
    <Tabs defaultValue="users" className="min-h-0 flex-1 gap-5 overflow-hidden">
      <TabsList variant="line" className="h-10 shrink-0">
        <TabsTrigger value="users" className="px-3"><Users />Utilisateurs</TabsTrigger>
      </TabsList>
      <TabsContent value="users" className="min-h-0 overflow-hidden">
        <MemberManagement />
      </TabsContent>
    </Tabs>
  )
}
