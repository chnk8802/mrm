import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Building2 } from "lucide-react";
import toast from "react-hot-toast";
import organizationService from "@/api/organizationService";
import planService from "@/api/planService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const OrganizationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [org, setOrg] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    contactEmail: "",
    contactPhone: "",
    planId: "",
    capsOverride: false,
    isActive: true,
  });

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [orgRes, plansRes] = await Promise.all([
          organizationService.getOrganizationById(id),
          planService.getPlans(),
        ]);
        setOrg(orgRes.data);
        setPlans(plansRes.data);
        setForm({
          name: orgRes.data.name || "",
          contactEmail: orgRes.data.contactEmail || "",
          contactPhone: orgRes.data.contactPhone || "",
          planId: orgRes.data.subscription.planId?._id || "",
          capsOverride: orgRes.data.subscription.capsOverride,
          isActive: orgRes.data.isActive,
        });
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load organization");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await organizationService.updateOrganization(id, form);
      setOrg(res.data);
      toast.success("Organization updated successfully");
    } catch (err) {
      const errorData = err.response?.data;
      if (errorData?.errors?.length) toast.error(errorData.errors[0].message);
      else toast.error(errorData?.message || "Failed to update organization");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
        Loading organization...
      </div>
    );
  }

  if (!org) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
        Organization not found
      </div>
    );
  }

  return (
    <div className="p-4 pb-24 md:pb-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/app/organizations")} className="p-2 hover:bg-muted rounded-lg transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-muted-foreground" />
          <h1 className="text-lg font-semibold text-foreground">{org.name}</h1>
        </div>
      </div>

      {/* Usage snapshot — read-only */}
      <div className="rounded-xl border border-border bg-card p-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-muted-foreground">Records used</p>
          <p className="text-lg font-semibold text-foreground">
            {org.subscription.capsOverride ? `${org.subscription.recordCount} / Unlimited` : `${org.subscription.recordCount} / ${org.subscription.planId?.recordCap ?? "—"}`}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Current Plan</p>
          <p className="text-lg font-semibold text-foreground">{org.subscription.planId?.name || "—"}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Trial Ends</p>
          <p className="text-lg font-semibold text-foreground">
            {org.subscription.expiresAt ? new Date(org.subscription.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
          </p>
        </div>
      </div>

      {/* Editable fields */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        <div className="space-y-1.5">
          <Label>Name</Label>
          <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </div>

        <div className="space-y-1.5">
          <Label>Contact Email</Label>
          <Input value={form.contactEmail} onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))} />
        </div>

        <div className="space-y-1.5">
          <Label>Contact Phone</Label>
          <Input value={form.contactPhone} onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))} />
        </div>

        <div className="space-y-1.5">
          <Label>Plan</Label>
          <Select value={form.planId} onValueChange={(v) => setForm((f) => ({ ...f, planId: v }))}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a plan" />
            </SelectTrigger>
            <SelectContent>
              {plans.map((plan) => (
                <SelectItem key={plan._id} value={plan._id}>
                  {plan.name} — {plan.userCap} users, {plan.recordCap} records
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Caps Override (Beta / Unlimited)</Label>
          <Select
            value={form.capsOverride ? "enabled" : "disabled"}
            onValueChange={(v) => setForm((f) => ({ ...f, capsOverride: v === "enabled" }))}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="disabled">Disabled — enforce plan caps</SelectItem>
              <SelectItem value="enabled">Enabled — unlimited (manual grant)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select
            value={form.isActive ? "active" : "inactive"}
            onValueChange={(v) => setForm((f) => ({ ...f, isActive: v === "active" }))}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
};

export default OrganizationDetails;