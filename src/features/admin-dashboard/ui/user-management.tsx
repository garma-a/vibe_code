"use client";

import { useTransition, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { KeyRound, ShieldAlert, UserCheck, Loader2, PlusCircle } from "lucide-react";
import { toggleViewAllOverride, addDelegation } from "../actions";

type Profile = { id: string; employee_id: string; full_name: string; role: string; override_view_all: boolean };
type Delegation = { id: string; delegator_id: string; substitute_id: string; start_date: string; end_date: string; delegator: { full_name: string } | null; substitute: { full_name: string } | null };

export function UserManagement({ users, delegations }: { users: Profile[]; delegations: Delegation[] }) {
  const [isPending, startTransition] = useTransition();
  const [delegationError, setDelegationError] = useState('');
  const [showDelegationForm, setShowDelegationForm] = useState(false);

  const handleToggleOverride = (id: string, current: boolean) => {
    startTransition(async () => {
      await toggleViewAllOverride(id, !current);
    });
  };

  const handleAddDelegation = (formData: FormData) => {
    setDelegationError('');
    startTransition(async () => {
      const result = await addDelegation(formData);
      if (result?.error) setDelegationError(result.error);
      else setShowDelegationForm(false);
    });
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-[#0C2340]">User Management</h2>
        <p className="text-muted-foreground mt-2">Manage visibility overrides and temporary access delegations.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Personnel Directory</CardTitle>
              <CardDescription>Manage per-user role overrides.</CardDescription>
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">No users found. Users appear here after they sign up and their profile is created.</div>
              ) : (
                <div className="rounded-md border">
                  <div className="bg-slate-50 grid grid-cols-4 p-3 border-b text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    <div>Employee</div>
                    <div>Role</div>
                    <div>View Availability</div>
                    <div className="text-right">Override</div>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {users.map((u) => (
                      <div key={u.id} className="grid grid-cols-4 p-3 items-center text-sm">
                        <div>
                          <p className="font-semibold text-slate-800">{u.full_name}</p>
                          <p className="text-xs text-slate-500">{u.employee_id}</p>
                        </div>
                        <div>
                          <Badge variant="secondary" className="bg-slate-100 text-slate-700 capitalize">{u.role.replace('_', ' ')}</Badge>
                        </div>
                        <div>
                          {u.override_view_all ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-medium bg-emerald-50 px-2 py-1 rounded-md">
                              <KeyRound className="w-3 h-3" /> Enabled
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">Default (Hidden)</span>
                          )}
                        </div>
                        <div className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isPending}
                            onClick={() => handleToggleOverride(u.id, u.override_view_all)}
                            className={u.override_view_all ? 'text-red-500 hover:text-red-600' : 'text-blue-600 hover:text-blue-700'}
                          >
                            {u.override_view_all ? 'Revoke' : 'Grant'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="bg-[#0C2340] text-white border-none shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#F1C400]" />
                Visibility Override
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-blue-100 space-y-2">
              <p>Employees and Secretaries <strong>cannot</strong> view available rooms by default.</p>
              <p>Granting "View Availability" lets them see the schedule without changing their role.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-indigo-500" />
                Delegation
              </CardTitle>
              <CardDescription className="text-xs">Assign a substitute during leave periods. Access is revoked automatically after end date.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {!showDelegationForm ? (
                <Button variant="outline" className="w-full" onClick={() => setShowDelegationForm(true)}>
                  <PlusCircle className="w-4 h-4 mr-2" /> Create Delegation
                </Button>
              ) : (
                <form action={handleAddDelegation} className="space-y-3">
                  {delegationError && <p className="text-xs text-red-500">{delegationError}</p>}
                  <div className="space-y-1">
                    <Label className="text-xs">Primary Employee</Label>
                    <select name="delegator_id" required className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
                      <option value="">Select…</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Substitute</Label>
                    <select name="substitute_id" required className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
                      <option value="">Select…</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">From</Label>
                      <Input name="start_date" type="date" min={today} required />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">To</Label>
                      <Input name="end_date" type="date" min={today} required />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={isPending} className="flex-1 bg-[#0C2340]">
                      {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => setShowDelegationForm(false)}>Cancel</Button>
                  </div>
                </form>
              )}

              {delegations.length > 0 && (
                <div className="pt-3 border-t space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Active Delegations</p>
                  {delegations.map(d => (
                    <div key={d.id} className="text-xs bg-slate-50 p-2 rounded-md border">
                      <p><span className="font-medium">{d.delegator?.full_name}</span> → <span className="font-medium">{d.substitute?.full_name}</span></p>
                      <p className="text-slate-500">{d.start_date} to {d.end_date}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
