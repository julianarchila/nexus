"use client";

import React, { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useMerchantProfile } from "@/hooks/use-merchant-profile";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Building,
  CreditCard,
  Globe,
  BarChart3,
  User,
  Server,
  Settings,
  FileText,
  Activity,
  History,
  MoreVertical,
  Check,
  Shield,
  Zap,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function MerchantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data, isLoading, error, updateStatus } = useMerchantProfile(id);

  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        <div className="space-y-4">
          <Skeleton className="h-4 w-48" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <Skeleton className="h-8 w-24 rounded-full" />
          </div>
        </div>
        <div className="space-y-6">
          <Skeleton className="h-10 w-full max-w-md" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <Skeleton className="h-64 w-full rounded-xl" />
              <Skeleton className="h-48 w-full rounded-xl" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-48 w-full rounded-xl" />
              <Skeleton className="h-96 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 max-w-7xl mx-auto text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
        <h3 className="text-lg font-medium text-slate-900">Failed to load merchant</h3>
        <p className="text-slate-500">{error?.message || "Merchant not found"}</p>
        <Link href="/">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const { profile, scoping, attachments, activityLog } = data;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Breadcrumb & Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Link href="/" className="hover:text-blue-600 transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/" className="hover:text-blue-600 transition-colors">
            Merchants
          </Link>
          <span>/</span>
          <span>{profile.name}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center text-3xl border border-blue-100 shadow-sm">
              {profile.logo}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                {profile.name}
              </h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  {profile.accountOwner.name}
                </span>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span>{profile.industry}</span>
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all cursor-pointer hover:shadow-sm flex items-center gap-2 ${
                  profile.status === "Live"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                    : profile.status === "Onboarding"
                    ? "bg-amber-50 text-amber-700 border-amber-100"
                    : profile.status === "Prospect"
                    ? "bg-slate-50 text-slate-700 border-slate-100"
                    : "bg-rose-50 text-rose-700 border-rose-100"
                }`}
              >
                {profile.status === "Live" && <CheckCircle2 className="h-4 w-4" />}
                {profile.status === "Onboarding" && <Activity className="h-4 w-4" />}
                {profile.status === "Prospect" && <FileText className="h-4 w-4" />}
                {profile.status === "Churned" && <AlertCircle className="h-4 w-4" />}
                {profile.status}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Change Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {["Prospect", "Onboarding", "Live", "Churned"].map((s) => (
                <DropdownMenuItem 
                  key={s} 
                  onClick={() => updateStatus(s as any)}
                  className="flex items-center justify-between"
                >
                  {s}
                  {profile.status === s && <Check className="h-4 w-4 text-blue-600" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start bg-transparent border-b border-gray-200 rounded-none h-auto p-0 mb-8 gap-6">
          {["Overview", "Scoping & Specs", "Documents", "Activity"].map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab.toLowerCase().split(' ')[0]}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent px-1 py-3 font-medium text-slate-500 hover:text-slate-700 transition-colors"
            >
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Overview Content */}
        <TabsContent
          value="overview"
          className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300"
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 text-slate-500 mb-2">
                    <BarChart3 className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Annual TPV</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">
                    ${(profile.metrics.tpv / 1000000).toFixed(1)}M
                  </p>
                  <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                    <Zap className="h-3 w-3" /> +12% vs last year
                  </p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 text-slate-500 mb-2">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Approval Rate</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">
                    {profile.metrics.approvalRate}%
                  </p>
                  <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                    <Zap className="h-3 w-3" /> +0.5% this month
                  </p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 text-slate-500 mb-2">
                    <Shield className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Chargeback Rate</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">
                    {profile.metrics.chargebackRate}%
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Within healthy limits
                  </p>
                </div>
              </div>

              {/* Company Details */}
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    <Building className="h-4 w-4 text-slate-500" />
                    Company Profile
                  </h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                  <div>
                    <label className="text-xs font-medium text-slate-500 block mb-1">Legal Name</label>
                    <p className="text-sm font-medium text-slate-900">{profile.legalName}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 block mb-1">Tax ID</label>
                    <p className="text-sm font-medium text-slate-900 font-mono">{profile.taxId}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 block mb-1">Website</label>
                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:underline">
                      {profile.website}
                    </a>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-slate-500 block mb-1">Description</label>
                    <p className="text-sm text-slate-600 leading-relaxed">{profile.description}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar (Activity Log) */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm flex flex-col h-[500px]">
                <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    <History className="h-4 w-4 text-slate-500" />
                    Live Activity
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs text-emerald-600 font-medium">Live</span>
                  </div>
                </div>
                <ScrollArea className="flex-1 p-6">
                  <div className="space-y-6">
                    {activityLog.map((log) => (
                      <div key={log.id} className="relative pl-6 border-l border-slate-100 last:border-0">
                        <div className={`absolute left-[-5px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white ${
                          log.type === 'AI' ? 'bg-purple-500 shadow-purple-200' :
                          log.type === 'System' ? 'bg-slate-300' : 'bg-blue-500'
                        } shadow-sm`} />
                        <div className="space-y-1">
                          <p className="text-sm text-slate-700 leading-snug">
                            {log.message}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <span className={`font-medium ${
                              log.type === 'AI' ? 'text-purple-600' : 'text-slate-500'
                            }`}>
                              {log.type}
                            </span>
                            <span>•</span>
                            <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Scoping Content */}
        <TabsContent value="scoping" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Server className="h-4 w-4 text-slate-500" />
                Technical Specifications
              </h3>
            </div>
            <div className="divide-y divide-gray-50">
              {scoping.map((spec) => (
                <div key={spec.id} className="p-6 flex items-start justify-between hover:bg-slate-50/50 transition-colors group">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-white group-hover:shadow-sm transition-all">
                      {spec.category === 'PSP' ? <CreditCard className="h-5 w-5" /> :
                       spec.category === 'Payment Method' ? <Zap className="h-5 w-5" /> :
                       spec.category === 'Fraud' ? <Shield className="h-5 w-5" /> :
                       <Globe className="h-5 w-5" />}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">{spec.name}</h4>
                      <p className="text-sm text-slate-500">{spec.category} • {spec.region.join(', ')}</p>
                      {spec.notes && (
                        <p className="text-xs text-amber-600 mt-1 bg-amber-50 inline-block px-2 py-0.5 rounded-md border border-amber-100">
                          Note: {spec.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant={spec.status === 'Integrated' ? 'success' : spec.status === 'Required' ? 'warning' : 'outline'}>
                    {spec.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Attachments Content */}
        <TabsContent value="documents" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {attachments.map((doc) => (
              <div key={doc.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                    <FileText className="h-5 w-5" />
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 group-hover:text-slate-600">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
                <h4 className="font-medium text-slate-900 truncate mb-1">{doc.name}</h4>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="bg-slate-100 px-2 py-0.5 rounded-md text-slate-600">{doc.type}</span>
                  <span>•</span>
                  <span>{doc.size}</span>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
