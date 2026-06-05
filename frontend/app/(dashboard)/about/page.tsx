"use client";

import * as React from "react";
import { Users, Info } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdministratorsTab } from "./_components/administrators-tab";
import { AboutContentTab } from "./_components/about-content-tab";

export default function AboutPage() {
  return (
    <div className="flex flex-col gap-8 p-8">
      <PageHeader
        title="About Page Management"
        description="Manage administrators and about page content"
      />

      <Tabs defaultValue="administrators" className="w-full">
        <TabsList className="bg-[#121212] p-1 h-auto gap-1 rounded-xl border border-gray-800">
          <TabsTrigger
            value="administrators"
            className="rounded-lg py-2 px-4 data-[state=active]:bg-[#1e1e1e] data-[state=active]:text-white text-gray-400"
          >
            <Users className="size-4 mr-2" />
            Administrators
          </TabsTrigger>
          <TabsTrigger
            value="content"
            className="rounded-lg py-2 px-4 data-[state=active]:bg-[#1e1e1e] data-[state=active]:text-white text-gray-400"
          >
            <Info className="size-4 mr-2" />
            About Content
          </TabsTrigger>
        </TabsList>

        <div className="mt-8">
          <TabsContent value="administrators" className="mt-0 outline-none">
            <AdministratorsTab />
          </TabsContent>
          <TabsContent value="content" className="mt-0 outline-none">
            <AboutContentTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
