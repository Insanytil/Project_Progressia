import { BookOpen, GraduationCap, ListTree, Users } from 'lucide-react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { MemberManagement } from './member-management'
import { ClassManagement } from './class-management'
import { CourseManagement } from './course-management'
import { StudyOptionManagement } from './study-option-management'

export function OrganizationAdministrationTabs() {
  return (
    <Tabs defaultValue="users" className="min-h-0 flex-1 gap-5 overflow-hidden">
      <TabsList variant="line" className="h-10 shrink-0">
        <TabsTrigger value="users" className="px-3"><Users />Utilisateurs</TabsTrigger>
        <TabsTrigger value="classes" className="px-3"><GraduationCap />Classes</TabsTrigger>
        <TabsTrigger value="courses" className="px-3"><BookOpen />Cours</TabsTrigger>
        <TabsTrigger value="options" className="px-3"><ListTree />Options</TabsTrigger>
      </TabsList>
      <TabsContent value="users" className="min-h-0 overflow-hidden">
        <MemberManagement />
      </TabsContent>
      <TabsContent value="classes" className="min-h-0 overflow-hidden">
        <ClassManagement />
      </TabsContent>
      <TabsContent value="courses" className="min-h-0 overflow-hidden">
        <CourseManagement />
      </TabsContent>
      <TabsContent value="options" className="min-h-0 overflow-hidden">
        <StudyOptionManagement />
      </TabsContent>
    </Tabs>
  )
}
