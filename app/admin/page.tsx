"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  Tag,
  Building2,
  ShieldCheck,
  RefreshCw,
  LogOut,
  Search,
  Plus,
  Calendar,
  AlertTriangle,
  ArrowUpRight,
  Sparkles,
  Receipt,
  UserCheck,
  TrendingUp,
  CreditCard,
  Gift,
  ExternalLink,
  ChevronRight,
  Filter,
  CheckCircle2,
  Clock,
  Menu,
  X,
  Store,
  Layers,
  Percent,
  Settings,
  Edit2,
  Trash2,
  Power,
  Sliders,
  Phone,
  MapPin,
  HelpCircle,
  Save,
  RotateCcw,
  Check,
  AlertCircle,
  Hash,
  Calculator,
  ArrowRight,
  Coins,
  DollarSign,
  Wallet,
  Zap,
  Lock,
  KeyRound,
  Key,
} from "lucide-react";

function formatRelativeTime(iso?: string | null): string {
  if (!iso) return "—";
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

function formatMoney(cur: string, n: number): string {
  return `${cur} ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export default function AdminPage() {
  const [session, setSession] = useState<any>(null);
  const [login, setLogin] = useState({ username: "", pin: "" });
  const [tab, setTab] = useState<"overview" | "customers" | "offers" | "branches" | "staff" | "audit" | "settings">("overview");
  const [data, setData] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Customers tab
  const [cust, setCust] = useState<any>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);

  // Audit tab
  const [audit, setAudit] = useState<any>(null);

  // Offers tab
  const [offers, setOffers] = useState<any>(null);
  const [showCreateOfferModal, setShowCreateOfferModal] = useState(false);
  const [newOffer, setNewOffer] = useState<{
    name: string;
    description: string;
    value: string;
    isPercent: boolean;
    branchIds: string[];
    startsAt: string;
    endsAt: string;
  }>({
    name: "",
    description: "",
    value: "",
    isPercent: true,
    branchIds: [],
    startsAt: "",
    endsAt: "",
  });
  const [offerMsg, setOfferMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Branches tab & CRUD
  const [branchesData, setBranchesData] = useState<any>(null);
  const [branchSearch, setBranchSearch] = useState("");
  const [branchCityFilter, setBranchCityFilter] = useState("all");
  const [showCreateBranchModal, setShowCreateBranchModal] = useState(false);
  const [showEditBranchModal, setShowEditBranchModal] = useState(false);
  const [showDeleteBranchModal, setShowDeleteBranchModal] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState<any>(null);
  const [branchForm, setBranchForm] = useState<{
    id?: string;
    code: string;
    name: string;
    nameAr: string;
    city: string;
    address: string;
    addressAr: string;
    phone: string;
    hours: string;
    isActive: boolean;
  }>({
    code: "",
    name: "",
    nameAr: "",
    city: "Dubai",
    address: "",
    addressAr: "",
    phone: "",
    hours: "10:00 AM – 11:00 PM",
    isActive: true,
  });
  const [branchMsg, setBranchMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Settings tab & Calculator Simulator
  const [settingsList, setSettingsList] = useState<any[]>([]);
  const [settingsForm, setSettingsForm] = useState<Record<string, string>>({
    spend_aed_for_points: "10",
    points_earned_per_spend: "1",
    points_required_for_redemption: "100",
    currency_value_per_redemption_points: "5",
    currency: "AED",
  });
  const [settingsCategory, setSettingsCategory] = useState<"general" | "loyalty" | "security" | "password">("general");
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Admin PIN change states
  const [pinForm, setPinForm] = useState({
    currentPin: "",
    newPin: "",
    confirmPin: "",
  });
  const [pinSaving, setPinSaving] = useState(false);
  const [pinMsg, setPinMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Simulator Test Inputs
  const [simBillAmount, setSimBillAmount] = useState("250");
  const [simPointsBalance, setSimPointsBalance] = useState("500");

  const loadOverview = useCallback(async () => {
    setErr("");
    setRefreshing(true);
    try {
      const r = await fetch("/api/admin/overview");
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Could not load admin overview.");
      setData(d);
      setSession(d.scope);
    } catch (e: any) {
      setErr(String(e.message || e));
    } finally {
      setRefreshing(false);
    }
  }, []);

  const loadCustomers = useCallback(async () => {
    try {
      const r = await fetch(
        `/api/admin/customers?q=${encodeURIComponent(q)}&page=${page}&filter=${filter}`
      );
      const d = await r.json();
      if (r.ok) setCust(d);
    } catch { }
  }, [q, page, filter]);

  const loadAudit = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/audit");
      const d = await r.json();
      if (r.ok) setAudit(d);
    } catch { }
  }, []);

  const loadOffers = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/offers");
      const d = await r.json();
      if (r.ok) setOffers(d);
    } catch { }
  }, []);

  const loadBranches = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/branches");
      const d = await r.json();
      if (r.ok) setBranchesData(d);
    } catch { }
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/settings");
      const d = await r.json();
      if (r.ok && d.settings) {
        setSettingsList(d.settings);
        const map: Record<string, string> = {};
        d.settings.forEach((s: any) => {
          map[s.key] = s.value;
        });
        setSettingsForm((prev) => ({ ...prev, ...map }));
      }
    } catch { }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    if (session && tab === "customers") loadCustomers();
    if (session && tab === "audit") loadAudit();
    if (session && tab === "offers") loadOffers();
    if (session && tab === "branches") loadBranches();
    if (session && tab === "settings") loadSettings();
  }, [session, tab, loadCustomers, loadAudit, loadOffers, loadBranches, loadSettings]);

  // Branch CRUD Handlers
  async function handleCreateBranch(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setBranchMsg(null);
    try {
      const r = await fetch("/api/admin/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(branchForm),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed to create branch.");
      setBranchMsg({ type: "ok", text: `Branch '${d.branch.name}' created successfully!` });
      setShowCreateBranchModal(false);
      setBranchForm({
        code: "",
        name: "",
        nameAr: "",
        city: "Dubai",
        address: "",
        addressAr: "",
        phone: "",
        hours: "10:00 AM – 11:00 PM",
        isActive: true,
      });
      loadBranches();
      loadOverview();
    } catch (err2: any) {
      setBranchMsg({ type: "err", text: String(err2.message || err2) });
    } finally {
      setBusy(false);
    }
  }

  async function handleUpdateBranch(e: React.FormEvent) {
    e.preventDefault();
    if (!branchForm.id) return;
    setBusy(true);
    setBranchMsg(null);
    try {
      const r = await fetch("/api/admin/branches", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(branchForm),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed to update branch.");
      setBranchMsg({ type: "ok", text: `Branch '${d.branch.name}' updated successfully!` });
      setShowEditBranchModal(false);
      loadBranches();
      loadOverview();
    } catch (err2: any) {
      setBranchMsg({ type: "err", text: String(err2.message || err2) });
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteBranch() {
    if (!branchToDelete) return;
    setBusy(true);
    setBranchMsg(null);
    try {
      const r = await fetch(`/api/admin/branches?id=${branchToDelete.id}`, {
        method: "DELETE",
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed to delete branch.");
      setBranchMsg({ type: "ok", text: d.message || "Branch deleted successfully." });
      setShowDeleteBranchModal(false);
      setBranchToDelete(null);
      loadBranches();
      loadOverview();
    } catch (err2: any) {
      setBranchMsg({ type: "err", text: String(err2.message || err2) });
    } finally {
      setBusy(false);
    }
  }

  async function handleToggleBranch(branch: any) {
    try {
      const r = await fetch("/api/admin/branches", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: branch.id,
          isActive: !branch.isActive,
        }),
      });
      if (r.ok) {
        loadBranches();
        loadOverview();
      }
    } catch { }
  }

  function openEditBranch(b: any) {
    setBranchForm({
      id: b.id,
      code: b.code || "",
      name: b.name || "",
      nameAr: b.nameAr || "",
      city: b.city || "Dubai",
      address: b.address || "",
      addressAr: b.addressAr || "",
      phone: b.phone || "",
      hours: b.hours || "",
      isActive: b.isActive,
    });
    setBranchMsg(null);
    setShowEditBranchModal(true);
  }

  function openDeleteBranch(b: any) {
    setBranchToDelete(b);
    setBranchMsg(null);
    setShowDeleteBranchModal(true);
  }

  // Settings Handlers
  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSettingsSaving(true);
    setSettingsMsg(null);
    try {
      const r = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: settingsForm }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed to update configuration.");
      setSettingsMsg({ type: "ok", text: "Loyalty conversion rules and system configuration saved live!" });
      loadSettings();
      loadOverview();
    } catch (err2: any) {
      setSettingsMsg({ type: "err", text: String(err2.message || err2) });
    } finally {
      setSettingsSaving(false);
    }
  }

  async function handleUpdatePin(e: React.FormEvent) {
    e.preventDefault();
    setPinSaving(true);
    setPinMsg(null);
    try {
      const r = await fetch("/api/admin/change-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pinForm),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed to update admin security PIN.");
      setPinMsg({ type: "ok", text: d.message || "Admin security PIN updated successfully!" });
      setPinForm({ currentPin: "", newPin: "", confirmPin: "" });
    } catch (err2: any) {
      setPinMsg({ type: "err", text: String(err2.message || err2) });
    } finally {
      setPinSaving(false);
    }
  }

  async function createOffer(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setOfferMsg(null);
    try {
      const r = await fetch("/api/admin/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newOffer),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Could not create offer.");
      setOfferMsg({ type: "ok", text: "Campaign offer created successfully." });
      setNewOffer({ name: "", description: "", value: "", isPercent: true, branchIds: [], startsAt: "", endsAt: "" });
      setShowCreateOfferModal(false);
      loadOffers();
    } catch (e2: any) {
      setOfferMsg({ type: "err", text: String(e2.message || e2) });
    } finally {
      setBusy(false);
    }
  }

  async function toggleOffer(id: string, isActive: boolean) {
    try {
      const r = await fetch("/api/admin/offers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive }),
      });
      if (r.ok) loadOffers();
    } catch { }
  }

  async function doLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const r = await fetch("/api/staff/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(login),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Could not sign in.");
      if (d.staff.role === "CASHIER") {
        throw new Error("Cashier accounts cannot access the admin management dashboard.");
      }
      await loadOverview();
    } catch (e2: any) {
      setErr(String(e2.message || e2));
    } finally {
      setBusy(false);
    }
  }

  // ===================== SIGNED OUT LOGIN VIEW =====================
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#120F0E] via-[#1B1716] to-[#251D1A] text-white">
        <div className="w-full max-w-md bg-[#1B1716]/95 border border-[#3E3430] backdrop-blur-xl rounded-3xl p-7 sm:p-8 shadow-2xl shadow-black/60">
          <div className="flex items-center gap-3.5 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#C0392B] to-[#96291D] flex items-center justify-center text-white font-black text-lg shadow-lg shadow-[#C0392B]/30">
              LC
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white leading-none">Loyalty Club</h1>
              <p className="text-xs font-semibold text-[#B8ADA6] uppercase tracking-wider mt-1">
                Executive Portal
              </p>
            </div>
          </div>

          <h2 className="text-2xl font-black tracking-tight text-white mb-2">Management Sign In</h2>
          <p className="text-sm text-[#B8ADA6] mb-6">Enter your administrative username and PIN.</p>

          <form onSubmit={doLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#B8ADA6] mb-1.5" htmlFor="au">
                Username
              </label>
              <input
                id="au"
                className="w-full px-4 py-3 text-base bg-[#241F1D] border border-[#3E3430] rounded-xl text-white placeholder-[#8C7F78] focus:outline-none focus:border-[#C0392B] transition-colors"
                value={login.username}
                onChange={(e) => setLogin({ ...login, username: e.target.value })}
                autoComplete="username"
                placeholder="e.g. admin or manager"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#B8ADA6] mb-1.5" htmlFor="ap">
                Security PIN Code
              </label>
              <input
                id="ap"
                type="password"
                inputMode="numeric"
                className="w-full px-4 py-3 text-base bg-[#241F1D] border border-[#3E3430] rounded-xl text-white focus:outline-none focus:border-[#C0392B] font-mono tracking-widest transition-colors"
                value={login.pin}
                onChange={(e) => setLogin({ ...login, pin: e.target.value })}
                placeholder="••••••"
                required
              />
            </div>

            {err && (
              <div className="p-3 bg-[#C0392B]/20 border border-[#C0392B]/40 rounded-xl text-xs text-[#F87171] font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{err}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#C0392B] to-[#96291D] hover:from-[#A83226] hover:to-[#822319] text-white font-bold text-sm tracking-wide shadow-lg shadow-[#C0392B]/30 hover:shadow-xl transition-all disabled:opacity-50 cursor-pointer"
            >
              {busy ? "Authenticating…" : "Open Dashboard"}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-[#2F2724] text-center text-xs text-[#8C7F78]">
            Super Admin Demo: <span className="text-white font-mono font-bold">admin / 246810</span>
          </div>
        </div>
      </div>
    );
  }

  // ===================== SIGNED IN EXECUTIVE DASHBOARD =====================
  const cur = settingsForm.currency || data?.currency || "AED";
  const metrics = data?.metrics || {};

  // Filtered branches for Branches Tab
  const allBranches = branchesData?.branches || data?.branchLeaderboard || [];
  const cities: string[] = Array.from(
    new Set(allBranches.map((b: any) => String(b.city || "").trim()).filter(Boolean))
  );
  const filteredBranches = allBranches.filter((b: any) => {
    const matchQ =
      !branchSearch ||
      b.name.toLowerCase().includes(branchSearch.toLowerCase()) ||
      b.code.toLowerCase().includes(branchSearch.toLowerCase()) ||
      (b.city && b.city.toLowerCase().includes(branchSearch.toLowerCase()));
    const matchCity = branchCityFilter === "all" || b.city === branchCityFilter;
    return matchQ && matchCity;
  });

  // Conversion keys configured in top calculator widget
  const conversionKeys = [
    "spend_aed_for_points",
    "points_earned_per_spend",
    "points_required_for_redemption",
    "currency_value_per_redemption_points",
  ];

  // Filtered settings for Settings Tab (exclude conversion keys from bottom cards)
  const filteredSettings = settingsList.filter((s) => {
    if (conversionKeys.includes(s.key)) return false;
    return s.category === settingsCategory;
  });

  // Calculator Math Calculations
  const spendStep = Number(settingsForm.spend_aed_for_points) || 10;
  const pointsPerSpend = Number(settingsForm.points_earned_per_spend) || 1;
  const reqPoints = Number(settingsForm.points_required_for_redemption) || 100;
  const aedRedemptionVal = Number(settingsForm.currency_value_per_redemption_points) || 5;

  // Simulator results
  const testBill = Number(simBillAmount) || 0;
  const calculatedPointsEarned = spendStep > 0 ? Math.floor((testBill / spendStep) * pointsPerSpend) : 0;
  const testPts = Number(simPointsBalance) || 0;
  const calculatedAedValue = reqPoints > 0 ? ((testPts / reqPoints) * aedRedemptionVal).toFixed(2) : "0.00";
  const singlePointAedVal = reqPoints > 0 ? (aedRedemptionVal / reqPoints).toFixed(4) : "0.0000";
  const singlePointFils = reqPoints > 0 ? ((aedRedemptionVal / reqPoints) * 100).toFixed(1) : "0.0";
  const cashbackPercent =
    spendStep > 0 && reqPoints > 0
      ? (((pointsPerSpend * (aedRedemptionVal / reqPoints)) / spendStep) * 100).toFixed(1)
      : "0.0";

  return (
    <div className="min-h-screen bg-[#F8F5F2] text-[#221C1A] flex flex-col md:flex-row">
      {/* ===================== SIDEBAR NAVIGATION ===================== */}
      <aside className="w-full md:w-64 bg-[#181312] text-white flex-shrink-0 flex flex-col border-r border-[#2A2320]">
        {/* Brand Header */}
        <div className="p-5 flex items-center justify-between border-b border-[#2A2320]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C0392B] to-[#96291D] flex items-center justify-center font-black text-base shadow-md shadow-[#C0392B]/40">
              LC
            </div>
            <div>
              <div className="font-extrabold text-base tracking-tight leading-tight">Loyalty Club</div>
              <div className="text-[11px] text-[#A69B95] uppercase tracking-wider font-semibold">
                Admin Control
              </div>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-[#2A2320] text-[#D8CDC6]"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation Items */}
        <div className={`p-3 space-y-1 flex-1 ${mobileMenuOpen ? "block" : "hidden md:block"}`}>
          <button
            onClick={() => {
              setTab("overview");
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${tab === "overview"
                ? "bg-gradient-to-r from-[#C0392B] to-[#96291D] text-white shadow-lg shadow-[#C0392B]/30"
                : "text-[#C8BCB5] hover:bg-[#251E1C] hover:text-white"
              }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Overview & KPIs</span>
          </button>

          <button
            onClick={() => {
              setTab("customers");
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${tab === "customers"
                ? "bg-gradient-to-r from-[#C0392B] to-[#96291D] text-white shadow-lg shadow-[#C0392B]/30"
                : "text-[#C8BCB5] hover:bg-[#251E1C] hover:text-white"
              }`}
          >
            <Users className="w-4 h-4" />
            <span>Member Directory</span>
          </button>

          <button
            onClick={() => {
              setTab("offers");
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${tab === "offers"
                ? "bg-gradient-to-r from-[#C0392B] to-[#96291D] text-white shadow-lg shadow-[#C0392B]/30"
                : "text-[#C8BCB5] hover:bg-[#251E1C] hover:text-white"
              }`}
          >
            <Tag className="w-4 h-4" />
            <span>Promotions & Offers</span>
          </button>

          <button
            onClick={() => {
              setTab("branches");
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${tab === "branches"
                ? "bg-gradient-to-r from-[#C0392B] to-[#96291D] text-white shadow-lg shadow-[#C0392B]/30"
                : "text-[#C8BCB5] hover:bg-[#251E1C] hover:text-white"
              }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Branches & Outlets</span>
          </button>

          <button
            onClick={() => {
              setTab("staff");
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${tab === "staff"
                ? "bg-gradient-to-r from-[#C0392B] to-[#96291D] text-white shadow-lg shadow-[#C0392B]/30"
                : "text-[#C8BCB5] hover:bg-[#251E1C] hover:text-white"
              }`}
          >
            <Store className="w-4 h-4" />
            <span>Staff & Tills</span>
          </button>

          <button
            onClick={() => {
              setTab("settings");
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${tab === "settings"
                ? "bg-gradient-to-r from-[#C0392B] to-[#96291D] text-white shadow-lg shadow-[#C0392B]/30"
                : "text-[#C8BCB5] hover:bg-[#251E1C] hover:text-white"
              }`}
          >
            <Settings className="w-4 h-4" />
            <span>Program Settings</span>
          </button>

          <button
            onClick={() => {
              setTab("audit");
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${tab === "audit"
                ? "bg-gradient-to-r from-[#C0392B] to-[#96291D] text-white shadow-lg shadow-[#C0392B]/30"
                : "text-[#C8BCB5] hover:bg-[#251E1C] hover:text-white"
              }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Security & Audit</span>
          </button>
        </div>

        {/* User Card & Sign Out */}
        <div className="p-4 border-t border-[#2A2320] bg-[#140F0E]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#362A26] border border-[#52413C] flex items-center justify-center font-bold text-xs text-[#E5D7D0]">
              {session.name ? session.name.slice(0, 2).toUpperCase() : "AD"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-xs text-white truncate">{session.name}</div>
              <div className="text-[10px] text-[#A69B95] truncate font-medium">{session.role}</div>
            </div>
            <a
              href="/api/staff/logout"
              title="Sign Out"
              className="p-1.5 rounded-lg text-[#A69B95] hover:text-white hover:bg-[#2A2320] transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </a>
          </div>
        </div>
      </aside>

      {/* ===================== MAIN CONTENT AREA ===================== */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Navbar */}
        <header className="bg-white border-b border-[#EAE3DC] px-6 py-4 flex items-center justify-between sticky top-0 z-20">
          <div>
            <h1 className="text-xl font-black tracking-tight text-[#1E1815] capitalize flex items-center gap-2">
              {tab === "overview" && "Executive Overview"}
              {tab === "customers" && "Member Directory"}
              {tab === "offers" && "Promotions & Campaign Engine"}
              {tab === "branches" && "Branch Outlets & Performance"}
              {tab === "staff" && "Staff POS Accounts & Tills"}
              {tab === "settings" && "System & Loyalty Points Engine"}
              {tab === "audit" && "Security & Activity Audit Log"}
            </h1>
            <p className="text-xs text-[#7A6E67] mt-0.5">
              {session.branchName ? `${session.branchName} • ` : "All 14 UAE Locations • "}
              Live sync active
            </p>
          </div>

          <div className="flex items-center gap-3">
            {tab === "branches" && (
              <button
                onClick={() => {
                  setBranchForm({
                    code: "",
                    name: "",
                    nameAr: "",
                    city: "Dubai",
                    address: "",
                    addressAr: "",
                    phone: "",
                    hours: "10:00 AM – 11:00 PM",
                    isActive: true,
                  });
                  setBranchMsg(null);
                  setShowCreateBranchModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#C0392B] to-[#96291D] hover:from-[#A83226] text-white font-bold text-xs shadow-md shadow-[#C0392B]/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Branch</span>
              </button>
            )}

            {tab === "offers" && (
              <button
                onClick={() => {
                  setOfferMsg(null);
                  setShowCreateOfferModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#C0392B] to-[#96291D] hover:from-[#A83226] text-white font-bold text-xs shadow-md shadow-[#C0392B]/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>New Campaign</span>
              </button>
            )}

            <button
              onClick={() => {
                loadOverview();
                if (tab === "customers") loadCustomers();
                if (tab === "audit") loadAudit();
                if (tab === "offers") loadOffers();
                if (tab === "branches") loadBranches();
                if (tab === "settings") loadSettings();
              }}
              disabled={refreshing}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#DCD3CB] bg-white hover:bg-[#FAF7F4] text-xs font-bold text-[#4A3F39] shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-[#C0392B]" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </header>

        {/* Global Error Banner */}
        {err && (
          <div className="mx-6 mt-4 p-4 bg-[#C0392B]/10 border border-[#C0392B]/30 rounded-2xl text-xs font-semibold text-[#C0392B] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4" />
              <span>{err}</span>
            </div>
            <button onClick={() => setErr("")} className="hover:opacity-75">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* ============================================================== */}
          {/* TAB 1: OVERVIEW & KPIS                                          */}
          {/* ============================================================== */}
          {tab === "overview" && (
            <>
              {/* Top Executive KPI Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Metric 1: Total Revenue */}
                <div className="bg-white border border-[#EAE3DC] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#C0392B]/10 to-transparent rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
                  <div className="flex items-center justify-between text-[#7A6E67] mb-2 text-xs font-bold uppercase tracking-wider">
                    <span>Tracked Revenue</span>
                    <Receipt className="w-4 h-4 text-[#C0392B]" />
                  </div>
                  <div className="text-2xl font-black text-[#1E1815] tracking-tight">
                    {formatMoney(cur, metrics.totalRevenue || 0)}
                  </div>
                  <div className="mt-2 text-xs font-semibold text-[#1E7A4D] flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Avg Bill: {formatMoney(cur, metrics.avgBill || 0)}</span>
                  </div>
                </div>

                {/* Metric 2: Total Members */}
                <div className="bg-white border border-[#EAE3DC] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#C68A1E]/10 to-transparent rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
                  <div className="flex items-center justify-between text-[#7A6E67] mb-2 text-xs font-bold uppercase tracking-wider">
                    <span>Total Members</span>
                    <Users className="w-4 h-4 text-[#C68A1E]" />
                  </div>
                  <div className="text-2xl font-black text-[#1E1815] tracking-tight">
                    {metrics.totalMembers ?? 0}
                  </div>
                  <div className="mt-2 text-xs font-semibold text-[#1E7A4D] flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>+{metrics.newMembersLast30Days ?? 0} new (last 30d)</span>
                  </div>
                </div>

                {/* Metric 3: Total Store Visits */}
                <div className="bg-white border border-[#EAE3DC] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#1E7A4D]/10 to-transparent rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
                  <div className="flex items-center justify-between text-[#7A6E67] mb-2 text-xs font-bold uppercase tracking-wider">
                    <span>Total Visits</span>
                    <UserCheck className="w-4 h-4 text-[#1E7A4D]" />
                  </div>
                  <div className="text-2xl font-black text-[#1E1815] tracking-tight">
                    {metrics.totalVisits ?? 0}
                  </div>
                  <div className="mt-2 text-xs font-semibold text-[#7A6E67]">
                    Repeat Customer Rate:{" "}
                    <span className="font-bold text-[#1E1815]">
                      {metrics.repeatRate ?? 0}%
                    </span>
                  </div>
                </div>

                {/* Metric 4: Rewards Claimed */}
                <div className="bg-white border border-[#EAE3DC] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#8B5CF6]/10 to-transparent rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
                  <div className="flex items-center justify-between text-[#7A6E67] mb-2 text-xs font-bold uppercase tracking-wider">
                    <span>Rewards Claimed</span>
                    <Gift className="w-4 h-4 text-[#8B5CF6]" />
                  </div>
                  <div className="text-2xl font-black text-[#1E1815] tracking-tight">
                    {metrics.rewardsClaimed ?? 0}
                    <span className="text-xs font-normal text-[#7A6E67] ml-1">
                      / {metrics.rewardsIssued ?? 0} issued
                    </span>
                  </div>
                  <div className="mt-2 text-xs font-semibold text-[#1E7A4D] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      {metrics.rewardsIssued ? Math.round((metrics.rewardsClaimed / metrics.rewardsIssued) * 100) : 0}% claim rate
                    </span>
                  </div>
                </div>
              </div>

              {/* Middle Section: Economy & Quick Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Points Economy Breakdown */}
                <div className="bg-white border border-[#EAE3DC] rounded-3xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="font-extrabold text-base text-[#1E1815] flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-[#C0392B]" />
                      Points Economy
                    </h2>
                    <span className="text-xs font-semibold text-[#7A6E67]">Live Ledger</span>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAF7F4] border border-[#EFE8E1]">
                      <div>
                        <div className="text-xs font-bold text-[#7A6E67] uppercase">Awarded (All Time)</div>
                        <div className="text-xl font-black text-[#1E7A4D] mt-0.5">
                          +{Number(metrics.pointsAwarded || 0).toLocaleString()}
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-[#1E7A4D]/10 text-[#1E7A4D] flex items-center justify-center font-bold">
                        pts
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAF7F4] border border-[#EFE8E1]">
                      <div>
                        <div className="text-xs font-bold text-[#7A6E67] uppercase">Redeemed / Spent</div>
                        <div className="text-xl font-black text-[#C0392B] mt-0.5">
                          -{Number(metrics.pointsRedeemed || 0).toLocaleString()}
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-[#C0392B]/10 text-[#C0392B] flex items-center justify-center font-bold">
                        pts
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-[#C68A1E]/10 to-[#FAF7F4] border border-[#C68A1E]/20">
                      <div>
                        <div className="text-xs font-bold text-[#7A6E67] uppercase">Active Member Wallet Float</div>
                        <div className="text-xl font-black text-[#C68A1E] mt-0.5">
                          {Number(metrics.activePointsFloat || 0).toLocaleString()}
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-[#C68A1E]/20 text-[#C68A1E] flex items-center justify-center font-bold">
                        pts
                      </div>
                    </div>
                  </div>
                </div>

                {/* Popular Rewards Distribution */}
                <div className="bg-white border border-[#EAE3DC] rounded-3xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="font-extrabold text-base text-[#1E1815] flex items-center gap-2">
                      <Gift className="w-4 h-4 text-[#C68A1E]" />
                      Top Reward Redemptions
                    </h2>
                    <span className="text-xs font-semibold text-[#7A6E67]">Campaigns</span>
                  </div>
                  <div className="space-y-3">
                    {data?.rewardBreakdown && data.rewardBreakdown.length > 0 ? (
                      data.rewardBreakdown.map((r: any) => (
                        <div
                          key={r.id}
                          className="p-3 rounded-2xl border border-[#EAE3DC] bg-[#FAF7F4] flex items-center justify-between hover:border-[#D0C6BE] transition-colors"
                        >
                          <div className="min-w-0 flex-1 mr-3">
                            <div className="font-bold text-xs text-[#1E1815] truncate">{r.name}</div>
                            <div className="text-[11px] text-[#7A6E67] uppercase tracking-wider font-semibold">
                              {r.type} • {r.threshold ? `${r.threshold} pts` : "Automatic"}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-black text-sm text-[#1E1815]">{r.claimedCount} claims</div>
                            <div className="text-[10px] text-[#7A6E67] font-semibold">{r.issuedCount} issued</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-[#7A6E67] text-center py-8">No reward redemptions yet.</div>
                    )}
                  </div>
                </div>

                {/* Birthday Spotlight */}
                <div className="bg-gradient-to-br from-[#1F1917] to-[#2B221E] text-white rounded-3xl p-6 shadow-md flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-2.5 py-1 rounded-lg bg-[#C0392B] text-white font-black text-[10px] uppercase tracking-wider">
                        Automated Loyalty
                      </span>
                      <Calendar className="w-4 h-4 text-[#C68A1E]" />
                    </div>
                    <h3 className="font-black text-lg text-white">This Month's Birthdays</h3>
                    <p className="text-xs text-[#B8ADA6] mt-1">
                      VIP members receiving complimentary birthday dining gifts and vouchers.
                    </p>
                    <div className="mt-6 flex items-baseline gap-2">
                      <span className="text-4xl font-black text-white">{data?.birthdaysThisMonth ?? 0}</span>
                      <span className="text-xs text-[#C68A1E] font-bold">Celebrations this month</span>
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-[#3E3430] flex items-center justify-between text-xs text-[#B8ADA6]">
                    <span>Automated Trigger: Active</span>
                    <span className="text-white font-bold">VIP Tier 1</span>
                  </div>
                </div>
              </div>

              {/* Branch Leaderboard & Live Stream */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Branch Leaderboard */}
                <div className="bg-white border border-[#EAE3DC] rounded-3xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="font-extrabold text-base text-[#1E1815] flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-[#C0392B]" />
                      Branch Revenue & Performance
                    </h2>
                    <button
                      onClick={() => setTab("branches")}
                      className="text-xs font-bold text-[#C0392B] hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <span>Manage All</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="divide-y divide-[#EFE8E1]">
                    {data?.branchLeaderboard && data.branchLeaderboard.length > 0 ? (
                      data.branchLeaderboard.slice(0, 7).map((b: any, idx: number) => {
                        const maxRev = Math.max(...data.branchLeaderboard.map((x: any) => x.revenue || 1));
                        const pct = Math.min(100, Math.round(((b.revenue || 0) / maxRev) * 100));
                        return (
                          <div key={b.id} className="py-3 flex items-center gap-4">
                            <div className="w-6 text-center font-black text-xs text-[#7A6E67]">
                              #{idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-xs text-[#1E1815] truncate">{b.name}</span>
                                <span className="font-black text-xs text-[#C0392B]">
                                  {formatMoney(cur, b.revenue || 0)}
                                </span>
                              </div>
                              <div className="w-full bg-[#EAE3DC] h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-gradient-to-r from-[#C0392B] to-[#C68A1E] h-full rounded-full transition-all duration-500"
                                  style={{ width: `${Math.max(pct, 4)}%` }}
                                />
                              </div>
                              <div className="flex items-center justify-between text-[10px] text-[#7A6E67] mt-1">
                                <span>{b.city}</span>
                                <span>
                                  {b.visits} visits • +{b.pointsAwarded} pts
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-xs text-[#7A6E67] text-center py-8">No branch data available.</div>
                    )}
                  </div>
                </div>

                {/* Recent Live Transactions */}
                <div className="bg-white border border-[#EAE3DC] rounded-3xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="font-extrabold text-base text-[#1E1815] flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#1E7A4D]" />
                      Live Sales & Points Stream
                    </h2>
                    <span className="text-[11px] font-semibold text-[#1E7A4D] flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#1E7A4D] animate-ping" />
                      Live
                    </span>
                  </div>
                  <div className="space-y-3">
                    {data?.recentTransactions && data.recentTransactions.length > 0 ? (
                      data.recentTransactions.slice(0, 6).map((t: any) => (
                        <div
                          key={t.id}
                          className="p-3 rounded-2xl border border-[#EAE3DC] bg-[#FAF7F4] flex items-center justify-between hover:border-[#D0C6BE] transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-white border border-[#E5DDD5] flex items-center justify-center font-bold text-xs text-[#C0392B] shrink-0">
                              <Receipt className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-xs text-[#1E1815] truncate">
                                {t.customer?.name || "Member"} • Inv #{t.invoiceNumber}
                              </div>
                              <div className="text-[11px] text-[#7A6E67] truncate">
                                {t.branch?.name || "Branch"} • {formatRelativeTime(t.createdAt)}
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-black text-xs text-[#1E1815]">
                              {formatMoney(cur, t.amount)}
                            </div>
                            <div className="text-[10px] font-bold text-[#1E7A4D]">
                              +{t.pointsEarned} pts
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-[#7A6E67] text-center py-8">
                        No transactions registered yet. Scan cards at the staff POS till!
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ============================================================== */}
          {/* TAB 2: MEMBER DIRECTORY (CUSTOMERS)                            */}
          {/* ============================================================== */}
          {tab === "customers" && (
            <div className="bg-white border border-[#EAE3DC] rounded-3xl p-6 shadow-sm space-y-5">
              {/* Filter & Search Bar */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-[#7A6E67] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search by name, mobile, email…"
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] placeholder-[#8C7F78] focus:outline-none focus:border-[#C0392B]"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Filter className="w-4 h-4 text-[#7A6E67]" />
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] font-semibold focus:outline-none focus:border-[#C0392B]"
                  >
                    <option value="all">All Members</option>
                    <option value="recent">Active Recently</option>
                    <option value="highSpend">Top Spenders</option>
                    <option value="highPoints">Top Points Balance</option>
                  </select>
                </div>
              </div>

              {/* Members Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[#EAE3DC] text-[#7A6E67] uppercase tracking-wider font-bold">
                    <tr>
                      <th className="pb-3 px-3">Member</th>
                      <th className="pb-3 px-3">Mobile & Email</th>
                      <th className="pb-3 px-3">Home Branch</th>
                      <th className="pb-3 px-3">Points</th>
                      <th className="pb-3 px-3">Visits</th>
                      <th className="pb-3 px-3">Total Spend</th>
                      <th className="pb-3 px-3">Last Visit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EFE8E1]">
                    {cust?.customers && cust.customers.length > 0 ? (
                      cust.customers.map((c: any) => (
                        <tr key={c.id} className="hover:bg-[#FAF7F4] transition-colors">
                          <td className="py-3 px-3">
                            <div className="font-bold text-[#1E1815]">{c.name}</div>
                            <div className="text-[10px] text-[#7A6E67]">
                              Joined {new Date(c.createdAt).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="py-3 px-3 font-mono text-[#4A3F39]">
                            <div>{c.mobile}</div>
                            {c.email && <div className="text-[10px] text-[#7A6E67]">{c.email}</div>}
                          </td>
                          <td className="py-3 px-3 text-[#7A6E67]">{c.homeBranch?.name || "—"}</td>
                          <td className="py-3 px-3 font-black text-[#C0392B]">{c.pointsBalance}</td>
                          <td className="py-3 px-3 font-bold text-[#1E1815]">{c.visitCount}</td>
                          <td className="py-3 px-3 font-bold text-[#1E1815]">
                            {formatMoney(cur, c.totalSpend)}
                          </td>
                          <td className="py-3 px-3 text-[#7A6E67]">{formatRelativeTime(c.lastVisitAt)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-xs text-[#7A6E67]">
                          No members matching query.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 3: PROMOTIONS & OFFERS                                     */}
          {/* ============================================================== */}
          {tab === "offers" && (
            <div className="space-y-6">
              {offerMsg && (
                <div
                  className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between ${offerMsg.type === "ok"
                      ? "bg-[#1E7A4D]/10 text-[#1E7A4D] border border-[#1E7A4D]/30"
                      : "bg-[#C0392B]/10 text-[#C0392B] border border-[#C0392B]/30"
                    }`}
                >
                  <span>{offerMsg.text}</span>
                  <button onClick={() => setOfferMsg(null)}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {offers?.offers && offers.offers.length > 0 ? (
                  offers.offers.map((o: any) => (
                    <div
                      key={o.id}
                      className="bg-white border border-[#EAE3DC] rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-[#C0392B]/10 to-transparent rounded-bl-full pointer-events-none" />
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${o.isActive
                                ? "bg-[#1E7A4D]/10 text-[#1E7A4D] border border-[#1E7A4D]/30"
                                : "bg-[#7A6E67]/10 text-[#7A6E67]"
                              }`}
                          >
                            {o.isActive ? "Active Campaign" : "Disabled"}
                          </span>
                          <div className="font-black text-lg text-[#C0392B]">
                            {o.isPercent ? `${o.value}% OFF` : `AED ${o.value} OFF`}
                          </div>
                        </div>

                        <h3 className="font-black text-base text-[#1E1815]">{o.name}</h3>
                        <p className="text-xs text-[#7A6E67] mt-1 leading-relaxed">
                          {o.description || "Applicable on eligible menu items across UAE branches."}
                        </p>

                        <div className="mt-4 pt-3 border-t border-[#EFE8E1] space-y-1.5 text-xs text-[#7A6E67]">
                          <div className="flex items-center justify-between">
                            <span>Locations:</span>
                            <span className="font-bold text-[#1E1815]">
                              {o.branches?.length ? `${o.branches.length} Branches` : "All Branches"}
                            </span>
                          </div>
                          {(o.startsAt || o.endsAt) && (
                            <div className="flex items-center justify-between">
                              <span>Schedule:</span>
                              <span className="font-medium text-[#1E1815]">
                                {o.startsAt ? new Date(o.startsAt).toLocaleDateString() : "Now"} –{" "}
                                {o.endsAt ? new Date(o.endsAt).toLocaleDateString() : "Ongoing"}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-5 pt-4 border-t border-[#EFE8E1] flex items-center justify-between">
                        <span className="text-[10px] text-[#7A6E67]">
                          Created {new Date(o.createdAt).toLocaleDateString()}
                        </span>
                        {offers.canEdit && (
                          <button
                            onClick={() => toggleOffer(o.id, !o.isActive)}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${o.isActive
                                ? "bg-[#C0392B]/10 hover:bg-[#C0392B]/20 text-[#C0392B]"
                                : "bg-[#1E7A4D]/10 hover:bg-[#1E7A4D]/20 text-[#1E7A4D]"
                              }`}
                          >
                            {o.isActive ? "Pause Campaign" : "Activate Campaign"}
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full bg-white border border-[#EAE3DC] rounded-3xl p-12 text-center text-xs text-[#7A6E67]">
                    No active offers configured. Click "+ New Campaign" to launch a promotion.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 4: BRANCH OUTLETS & CRUD                                   */}
          {/* ============================================================== */}
          {tab === "branches" && (
            <div className="space-y-6">
              {branchMsg && (
                <div
                  className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between ${branchMsg.type === "ok"
                      ? "bg-[#1E7A4D]/10 text-[#1E7A4D] border border-[#1E7A4D]/30"
                      : "bg-[#C0392B]/10 text-[#C0392B] border border-[#C0392B]/30"
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{branchMsg.text}</span>
                  </div>
                  <button onClick={() => setBranchMsg(null)}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Branch Quick Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-[#EAE3DC] rounded-2xl p-4 shadow-sm">
                  <div className="text-xs font-bold text-[#7A6E67] uppercase">Total Outlets</div>
                  <div className="text-2xl font-black text-[#1E1815] mt-1">{allBranches.length}</div>
                </div>
                <div className="bg-white border border-[#EAE3DC] rounded-2xl p-4 shadow-sm">
                  <div className="text-xs font-bold text-[#7A6E67] uppercase">Active Locations</div>
                  <div className="text-2xl font-black text-[#1E7A4D] mt-1">
                    {allBranches.filter((b: any) => b.isActive !== false).length}
                  </div>
                </div>
                <div className="bg-white border border-[#EAE3DC] rounded-2xl p-4 shadow-sm">
                  <div className="text-xs font-bold text-[#7A6E67] uppercase">Cities Covered</div>
                  <div className="text-2xl font-black text-[#C68A1E] mt-1">{cities.length || 3}</div>
                </div>
                <div className="bg-white border border-[#EAE3DC] rounded-2xl p-4 shadow-sm">
                  <div className="text-xs font-bold text-[#7A6E67] uppercase">Total Network Revenue</div>
                  <div className="text-2xl font-black text-[#C0392B] mt-1">
                    {formatMoney(cur, allBranches.reduce((acc: number, b: any) => acc + (b.totalRevenue || b.revenue || 0), 0))}
                  </div>
                </div>
              </div>

              {/* Search and City Filter */}
              <div className="bg-white border border-[#EAE3DC] rounded-3xl p-6 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                  <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 text-[#7A6E67] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={branchSearch}
                      onChange={(e) => setBranchSearch(e.target.value)}
                      placeholder="Search branches by code, name, city…"
                      className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] placeholder-[#8C7F78] focus:outline-none focus:border-[#C0392B]"
                    />
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Filter className="w-4 h-4 text-[#7A6E67]" />
                    <select
                      value={branchCityFilter}
                      onChange={(e) => setBranchCityFilter(e.target.value)}
                      className="px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] font-semibold focus:outline-none focus:border-[#C0392B]"
                    >
                      <option value="all">All Cities</option>
                      {cities.map((city: string) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Branches Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-[#EAE3DC] text-[#7A6E67] uppercase tracking-wider font-bold">
                      <tr>
                        <th className="pb-3 px-3">Code</th>
                        <th className="pb-3 px-3">Branch Name</th>
                        <th className="pb-3 px-3">City & Address</th>
                        <th className="pb-3 px-3">Contact & Hours</th>
                        <th className="pb-3 px-3">Status</th>
                        <th className="pb-3 px-3">Staff / Visits</th>
                        <th className="pb-3 px-3">Revenue</th>
                        <th className="pb-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EFE8E1]">
                      {filteredBranches.length > 0 ? (
                        filteredBranches.map((b: any) => (
                          <tr key={b.id || b.code} className="hover:bg-[#FAF7F4] transition-colors">
                            <td className="py-3 px-3 font-mono font-bold text-[#C0392B]">
                              <span className="px-2 py-1 rounded-lg bg-[#C0392B]/10 border border-[#C0392B]/20">
                                {b.code}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <div className="font-extrabold text-[#1E1815]">{b.name}</div>
                              {b.nameAr && <div className="text-[11px] text-[#7A6E67]">{b.nameAr}</div>}
                            </td>
                            <td className="py-3 px-3">
                              <div className="font-semibold text-[#1E1815] flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-[#C68A1E]" />
                                <span>{b.city || "Dubai"}</span>
                              </div>
                              <div className="text-[11px] text-[#7A6E67] truncate max-w-[200px]">
                                {b.address || "—"}
                              </div>
                            </td>
                            <td className="py-3 px-3 text-[11px] text-[#7A6E67]">
                              {b.phone && (
                                <div className="flex items-center gap-1 font-mono">
                                  <Phone className="w-3 h-3 text-[#7A6E67]" />
                                  <span>{b.phone}</span>
                                </div>
                              )}
                              <div>{b.hours || "10:00 AM – 11:00 PM"}</div>
                            </td>
                            <td className="py-3 px-3">
                              <button
                                onClick={() => handleToggleBranch(b)}
                                className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer transition-all ${b.isActive !== false
                                    ? "bg-[#1E7A4D]/10 text-[#1E7A4D] border border-[#1E7A4D]/30 hover:bg-[#1E7A4D]/20"
                                    : "bg-[#7A6E67]/10 text-[#7A6E67] border border-[#7A6E67]/30 hover:bg-[#7A6E67]/20"
                                  }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${b.isActive !== false ? "bg-[#1E7A4D]" : "bg-[#7A6E67]"
                                    }`}
                                />
                                <span>{b.isActive !== false ? "Active" : "Inactive"}</span>
                              </button>
                            </td>
                            <td className="py-3 px-3 text-[#7A6E67]">
                              <div className="font-semibold text-[#1E1815]">
                                {b.staffCount ?? b.staff ?? 0} Staff
                              </div>
                              <div className="text-[10px]">
                                {b.transactionCount ?? b.visits ?? 0} Transactions
                              </div>
                            </td>
                            <td className="py-3 px-3 font-black text-[#C0392B]">
                              {formatMoney(cur, b.totalRevenue || b.revenue || 0)}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  onClick={() => openEditBranch(b)}
                                  title="Edit Branch Details"
                                  className="p-1.5 rounded-lg border border-[#EAE3DC] bg-white hover:bg-[#FAF7F4] text-[#4A3F39] hover:text-[#C0392B] transition-colors cursor-pointer"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => openDeleteBranch(b)}
                                  title="Delete / Deactivate Branch"
                                  className="p-1.5 rounded-lg border border-[#EAE3DC] bg-white hover:bg-[#C0392B]/10 text-[#4A3F39] hover:text-[#C0392B] transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="text-center py-8 text-xs text-[#7A6E67]">
                            No branches found matching search criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 5: STAFF & TILLS                                           */}
          {/* ============================================================== */}
          {tab === "staff" && (
            <div className="bg-white border border-[#EAE3DC] rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-extrabold text-base text-[#1E1815]">Staff POS Accounts</h2>
                  <p className="text-xs text-[#7A6E67]">
                    Cashier & Manager credentials configured for terminal tills.
                  </p>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-[#FAF7F4] border border-[#EAE3DC] text-xs font-bold text-[#4A3F39]">
                  {data?.staffCount ?? "14"} Active Tills
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-2xl border border-[#EAE3DC] bg-[#FAF7F4]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-bold text-xs text-[#C0392B]">admin</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#C0392B]/10 text-[#C0392B] text-[10px] font-black">
                      SUPER_ADMIN
                    </span>
                  </div>
                  <div className="font-extrabold text-sm text-[#1E1815]">Corporate Head Office</div>
                  <div className="text-xs text-[#7A6E67] mt-1">PIN: 246810</div>
                </div>

                <div className="p-4 rounded-2xl border border-[#EAE3DC] bg-[#FAF7F4]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-bold text-xs text-[#C68A1E]">manager</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#C68A1E]/10 text-[#C68A1E] text-[10px] font-black">
                      BRANCH_MANAGER
                    </span>
                  </div>
                  <div className="font-extrabold text-sm text-[#1E1815]">The Dubai Mall</div>
                  <div className="text-xs text-[#7A6E67] mt-1">PIN: 135790</div>
                </div>

                <div className="p-4 rounded-2xl border border-[#EAE3DC] bg-[#FAF7F4]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-bold text-xs text-[#1E7A4D]">cashier</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#1E7A4D]/10 text-[#1E7A4D] text-[10px] font-black">
                      CASHIER
                    </span>
                  </div>
                  <div className="font-extrabold text-sm text-[#1E1815]">Front Desk POS Till 1</div>
                  <div className="text-xs text-[#7A6E67] mt-1">PIN: 112233</div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 6: PROGRAM SETTINGS & CONVERSION CALCULATOR                */}
          {/* ============================================================== */}
          {tab === "settings" && (
            <div className="space-y-6">
              {settingsMsg && (
                <div
                  className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between ${settingsMsg.type === "ok"
                      ? "bg-[#1E7A4D]/10 text-[#1E7A4D] border border-[#1E7A4D]/30"
                      : "bg-[#C0392B]/10 text-[#C0392B] border border-[#C0392B]/30"
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>{settingsMsg.text}</span>
                  </div>
                  <button onClick={() => setSettingsMsg(null)}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Settings Category Tabs */}
              <div className="flex flex-wrap items-center gap-2 border-b border-[#EAE3DC] pb-3">
                <button
                  type="button"
                  onClick={() => setSettingsCategory("general")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${settingsCategory === "general"
                      ? "bg-[#C0392B] text-white shadow-md shadow-[#C0392B]/20"
                      : "bg-white border border-[#EAE3DC] text-[#4A3F39] hover:bg-[#FAF7F4]"
                    }`}
                >
                  ⚙️ General Settings
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsCategory("loyalty")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${settingsCategory === "loyalty"
                      ? "bg-[#C0392B] text-white shadow-md shadow-[#C0392B]/20"
                      : "bg-white border border-[#EAE3DC] text-[#4A3F39] hover:bg-[#FAF7F4]"
                    }`}
                >
                  🪙 Loyalty & Points Engine
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsCategory("security")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${settingsCategory === "security"
                      ? "bg-[#C0392B] text-white shadow-md shadow-[#C0392B]/20"
                      : "bg-white border border-[#EAE3DC] text-[#4A3F39] hover:bg-[#FAF7F4]"
                    }`}
                >
                  🛡️ Security & Anti-Fraud
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsCategory("password")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${settingsCategory === "password"
                      ? "bg-[#C0392B] text-white shadow-md shadow-[#C0392B]/20"
                      : "bg-white border border-[#EAE3DC] text-[#4A3F39] hover:bg-[#FAF7F4]"
                    }`}
                >
                  🔑 Admin PIN & Password
                </button>
              </div>

              {/* ========================================================= */}
              {/* TAB CONTENT: ADMIN PIN / PASSWORD UPDATE                 */}
              {/* ========================================================= */}
              {settingsCategory === "password" && (
                <div className="bg-white border border-[#EAE3DC] rounded-3xl p-6 sm:p-7 shadow-sm space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EAE3DC] pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#C0392B] to-[#96291D] flex items-center justify-center font-bold text-white shadow-md shadow-[#C0392B]/30 shrink-0">
                        <KeyRound className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-black tracking-tight text-[#1E1815] flex items-center gap-2">
                          <span>Admin Security PIN & Login Access</span>
                          <span className="px-2.5 py-0.5 rounded-full bg-[#1E7A4D]/10 text-[#1E7A4D] border border-[#1E7A4D]/20 text-[10px] font-black uppercase tracking-wider">
                            scrypt Hashed
                          </span>
                        </h3>
                        <p className="text-xs text-[#7A6E67] mt-0.5">
                          Update the master administrative PIN code used to access the executive dashboard.
                        </p>
                      </div>
                    </div>
                  </div>

                  {pinMsg && (
                    <div
                      className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between ${pinMsg.type === "ok"
                          ? "bg-[#1E7A4D]/10 text-[#1E7A4D] border border-[#1E7A4D]/30"
                          : "bg-[#C0392B]/10 text-[#C0392B] border border-[#C0392B]/30"
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        {pinMsg.type === "ok" ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                        <span>{pinMsg.text}</span>
                      </div>
                      <button onClick={() => setPinMsg(null)}>
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <form onSubmit={handleUpdatePin} className="max-w-xl space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-[#1E1815] uppercase tracking-wider mb-1.5" htmlFor="currPin">
                        Current Master PIN *
                      </label>
                      <div className="relative">
                        <input
                          id="currPin"
                          type="password"
                          inputMode="numeric"
                          required
                          value={pinForm.currentPin}
                          onChange={(e) => setPinForm({ ...pinForm, currentPin: e.target.value })}
                          placeholder="Enter your current 6-digit PIN"
                          className="w-full px-4 py-3 bg-[#FAF7F4] border border-[#DCD3CB] rounded-xl text-[#1E1815] font-mono tracking-widest text-sm focus:outline-none focus:border-[#C0392B]"
                        />
                        <Lock className="w-4 h-4 text-[#8C7F78] absolute right-3.5 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#1E1815] uppercase tracking-wider mb-1.5" htmlFor="nPin">
                          New Security PIN *
                        </label>
                        <div className="relative">
                          <input
                            id="nPin"
                            type="password"
                            inputMode="numeric"
                            required
                            minLength={4}
                            value={pinForm.newPin}
                            onChange={(e) => setPinForm({ ...pinForm, newPin: e.target.value })}
                            placeholder="Min 4 digits"
                            className="w-full px-4 py-3 bg-[#FAF7F4] border border-[#DCD3CB] rounded-xl text-[#1E1815] font-mono tracking-widest text-sm focus:outline-none focus:border-[#C0392B]"
                          />
                          <Key className="w-4 h-4 text-[#8C7F78] absolute right-3.5 top-1/2 -translate-y-1/2" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#1E1815] uppercase tracking-wider mb-1.5" htmlFor="cPin">
                          Confirm New PIN *
                        </label>
                        <div className="relative">
                          <input
                            id="cPin"
                            type="password"
                            inputMode="numeric"
                            required
                            minLength={4}
                            value={pinForm.confirmPin}
                            onChange={(e) => setPinForm({ ...pinForm, confirmPin: e.target.value })}
                            placeholder="Re-enter new PIN"
                            className="w-full px-4 py-3 bg-[#FAF7F4] border border-[#DCD3CB] rounded-xl text-[#1E1815] font-mono tracking-widest text-sm focus:outline-none focus:border-[#C0392B]"
                          />
                          <Key className="w-4 h-4 text-[#8C7F78] absolute right-3.5 top-1/2 -translate-y-1/2" />
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-[#FAF7F4] border border-[#EFE8E1] rounded-2xl text-xs text-[#7A6E67] leading-relaxed space-y-1">
                      <div className="font-bold text-[#1E1815] flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-[#1E7A4D]" />
                        <span>Security Policy & Audit Protection</span>
                      </div>
                      <p>
                        Your PIN is protected with high-workfactor cryptographic hashing. Changing your PIN will create an immutable audit record and require this new PIN for future executive logins.
                      </p>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="submit"
                        disabled={pinSaving}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#C0392B] to-[#96291D] hover:from-[#A83226] text-white font-bold text-xs shadow-md shadow-[#C0392B]/20 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        <span>{pinSaving ? "Updating PIN…" : "Update Security PIN"}</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* ========================================================= */}
              {/* HERO: INTERACTIVE LOYALTY POINTS & AED CONVERSION CALCULATOR */}
              {/* ========================================================= */}
              {settingsCategory === "loyalty" && (
                <div className="bg-white text-[#1E1815] rounded-3xl p-6 sm:p-7 border border-[#EAE3DC] shadow-sm relative overflow-hidden space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EAE3DC] pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#C0392B] to-[#96291D] flex items-center justify-center font-bold text-white shadow-md shadow-[#C0392B]/30 shrink-0">
                        <Calculator className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-black tracking-tight text-[#1E1815] flex items-center gap-2">
                          <span>Loyalty Points & AED Conversion Engine</span>
                          <span className="px-2.5 py-0.5 rounded-full bg-[#C68A1E]/15 text-[#9E690B] border border-[#C68A1E]/30 text-[10px] font-black uppercase tracking-wider">
                            Live Calculator
                          </span>
                        </h3>
                        <p className="text-xs text-[#7A6E67] mt-0.5">
                          Configure how many AED earn loyalty points and how many points equal AED cash discount value.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-3.5 py-1.5 rounded-xl bg-[#FAF7F4] border border-[#EAE3DC] font-mono text-[#4A3F39]">
                        Effective Cashback: <strong className="text-[#1E7A4D] font-black text-sm">{cashbackPercent}%</strong>
                      </span>
                    </div>
                  </div>

                  {/* Dual Rules Configuration Panel */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Rule 1: AED to Points (Earning) */}
                    <div className="bg-[#FAF7F4] border border-[#EAE3DC] rounded-2xl p-5 space-y-4 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Coins className="w-4 h-4 text-[#C68A1E]" />
                          <h4 className="font-extrabold text-sm text-[#1E1815]">1. Earning Rule (AED ➔ Points)</h4>
                        </div>
                        <span className="text-[10px] font-black text-[#C68A1E] uppercase tracking-wider bg-[#C68A1E]/10 px-2.5 py-0.5 rounded-full border border-[#C68A1E]/20">
                          Bill Checkout
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 items-center">
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#7A6E67] mb-1">
                            Every (Spend Amount)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0.1"
                              step="0.1"
                              value={settingsForm.spend_aed_for_points ?? "10"}
                              onChange={(e) =>
                                setSettingsForm({ ...settingsForm, spend_aed_for_points: e.target.value })
                              }
                              className="w-full px-3 py-2.5 bg-white border border-[#DCD3CB] rounded-xl text-[#1E1815] font-black text-sm focus:outline-none focus:border-[#C0392B]"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8C7F78]">
                              {cur}
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#7A6E67] mb-1">
                            Awards (Points)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={settingsForm.points_earned_per_spend ?? "1"}
                              onChange={(e) =>
                                setSettingsForm({ ...settingsForm, points_earned_per_spend: e.target.value })
                              }
                              className="w-full px-3 py-2.5 bg-white border border-[#DCD3CB] rounded-xl text-[#1E1815] font-black text-sm focus:outline-none focus:border-[#C0392B]"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8C7F78]">
                              pts
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Rule Summary & Quick Presets */}
                      <div className="pt-2 border-t border-[#EAE3DC] flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="text-[#7A6E67] text-[11px]">
                          Rate: <strong className="text-[#1E1815]">{(pointsPerSpend / spendStep).toFixed(2)} pts per 1 {cur}</strong>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              setSettingsForm({ ...settingsForm, spend_aed_for_points: "10", points_earned_per_spend: "1" })
                            }
                            className="px-2.5 py-1 rounded-lg bg-white border border-[#DCD3CB] hover:bg-[#FAF7F4] text-[10px] text-[#4A3F39] font-bold transition-colors cursor-pointer shadow-2xs"
                          >
                            10 AED = 1 pt
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setSettingsForm({ ...settingsForm, spend_aed_for_points: "1", points_earned_per_spend: "1" })
                            }
                            className="px-2.5 py-1 rounded-lg bg-white border border-[#DCD3CB] hover:bg-[#FAF7F4] text-[10px] text-[#4A3F39] font-bold transition-colors cursor-pointer shadow-2xs"
                          >
                            1 AED = 1 pt
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Rule 2: Points to AED (Redemption) */}
                    <div className="bg-[#FAF7F4] border border-[#EAE3DC] rounded-2xl p-5 space-y-4 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Wallet className="w-4 h-4 text-[#1E7A4D]" />
                          <h4 className="font-extrabold text-sm text-[#1E1815]">2. Redemption Rule (Points ➔ AED)</h4>
                        </div>
                        <span className="text-[10px] font-black text-[#1E7A4D] uppercase tracking-wider bg-[#1E7A4D]/10 px-2.5 py-0.5 rounded-full border border-[#1E7A4D]/20">
                          Wallet Discount
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 items-center">
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#7A6E67] mb-1">
                            Every (Points)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={settingsForm.points_required_for_redemption ?? "100"}
                              onChange={(e) =>
                                setSettingsForm({ ...settingsForm, points_required_for_redemption: e.target.value })
                              }
                              className="w-full px-3 py-2.5 bg-white border border-[#DCD3CB] rounded-xl text-[#1E1815] font-black text-sm focus:outline-none focus:border-[#C0392B]"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8C7F78]">
                              pts
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#7A6E67] mb-1">
                            Is Worth ({cur} Discount)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0.1"
                              step="0.5"
                              value={settingsForm.currency_value_per_redemption_points ?? "5"}
                              onChange={(e) =>
                                setSettingsForm({ ...settingsForm, currency_value_per_redemption_points: e.target.value })
                              }
                              className="w-full px-3 py-2.5 bg-white border border-[#DCD3CB] rounded-xl text-[#1E1815] font-black text-sm focus:outline-none focus:border-[#C0392B]"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8C7F78]">
                              {cur}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Rule Summary & Quick Presets */}
                      <div className="pt-2 border-t border-[#EAE3DC] flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="text-[#7A6E67] text-[11px]">
                          Unit Value: <strong className="text-[#1E1815]">1 pt = {singlePointAedVal} {cur} ({singlePointFils} Fils)</strong>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              setSettingsForm({ ...settingsForm, points_required_for_redemption: "100", currency_value_per_redemption_points: "5" })
                            }
                            className="px-2.5 py-1 rounded-lg bg-white border border-[#DCD3CB] hover:bg-[#FAF7F4] text-[10px] text-[#4A3F39] font-bold transition-colors cursor-pointer shadow-2xs"
                          >
                            100 pts = 5 AED
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setSettingsForm({ ...settingsForm, points_required_for_redemption: "100", currency_value_per_redemption_points: "10" })
                            }
                            className="px-2.5 py-1 rounded-lg bg-white border border-[#DCD3CB] hover:bg-[#FAF7F4] text-[10px] text-[#4A3F39] font-bold transition-colors cursor-pointer shadow-2xs"
                          >
                            100 pts = 10 AED
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ========================================================= */}
                  {/* LIVE SIMULATOR SANDBOX TESTER                             */}
                  {/* ========================================================= */}
                  <div className="bg-[#FAF7F4] border border-[#EAE3DC] rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Zap className="w-4 h-4 text-[#C0392B]" />
                      <h4 className="font-extrabold text-xs uppercase tracking-wider text-[#1E1815]">
                        Live Calculator Simulator & Scenario Tester
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Simulator 1: Spend Bill Test */}
                      <div className="p-4 rounded-xl bg-white border border-[#EAE3DC] flex flex-col justify-between space-y-3 shadow-2xs">
                        <div>
                          <label className="block text-[11px] font-bold text-[#7A6E67] uppercase mb-1">
                            Test Bill Amount:
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              value={simBillAmount}
                              onChange={(e) => setSimBillAmount(e.target.value)}
                              className="w-full px-3 py-2 bg-[#FAF7F4] border border-[#DCD3CB] rounded-xl text-[#1E1815] font-bold text-sm focus:outline-none focus:border-[#C0392B]"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8C7F78]">
                              {cur}
                            </span>
                          </div>
                        </div>

                        <div className="p-3 rounded-lg bg-[#FAF7F4] border border-[#EAE3DC] flex items-center justify-between">
                          <span className="text-xs font-semibold text-[#7A6E67]">Customer Receives:</span>
                          <span className="text-base font-black text-[#1E7A4D]">
                            +{calculatedPointsEarned} Points
                          </span>
                        </div>
                      </div>

                      {/* Simulator 2: Wallet Redemption Test */}
                      <div className="p-4 rounded-xl bg-white border border-[#EAE3DC] flex flex-col justify-between space-y-3 shadow-2xs">
                        <div>
                          <label className="block text-[11px] font-bold text-[#7A6E67] uppercase mb-1">
                            Test Member Points Balance:
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              value={simPointsBalance}
                              onChange={(e) => setSimPointsBalance(e.target.value)}
                              className="w-full px-3 py-2 bg-[#FAF7F4] border border-[#DCD3CB] rounded-xl text-[#1E1815] font-bold text-sm focus:outline-none focus:border-[#C0392B]"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8C7F78]">
                              pts
                            </span>
                          </div>
                        </div>

                        <div className="p-3 rounded-lg bg-[#FAF7F4] border border-[#EAE3DC] flex items-center justify-between">
                          <span className="text-xs font-semibold text-[#7A6E67]">Wallet Cash Discount:</span>
                          <span className="text-base font-black text-[#C68A1E]">
                            {cur} {calculatedAedValue}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* General / Category Settings Form */}
              {settingsCategory !== "password" && (
                <form onSubmit={handleSaveSettings} className="bg-white border border-[#EAE3DC] rounded-3xl p-6 shadow-sm space-y-6">
                  <div className="flex items-center justify-between border-b border-[#EAE3DC] pb-3">
                    <h3 className="font-extrabold text-base text-[#1E1815]">
                      {settingsCategory === "general" && "⚙️ General App & Brand Parameters"}
                      {settingsCategory === "loyalty" && "🪙 Additional Loyalty Rules & Policies"}
                      {settingsCategory === "security" && "🛡️ Security & Anti-Fraud Thresholds"}
                    </h3>
                    <span className="text-xs text-[#7A6E67] font-semibold">{filteredSettings.length} Parameters</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredSettings.map((item) => (
                      <div
                        key={item.key}
                        className="p-4 rounded-2xl border border-[#EFE8E1] bg-[#FAF7F4] flex flex-col justify-between"
                      >
                        <div className="mb-3">
                          <label className="block text-xs font-bold text-[#1E1815] mb-1" htmlFor={item.key}>
                            {item.label}
                          </label>
                          <p className="text-[11px] text-[#7A6E67] leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                        <div>
                          <input
                            id={item.key}
                            type={item.type === "number" ? "number" : "text"}
                            value={settingsForm[item.key] ?? ""}
                            onChange={(e) =>
                              setSettingsForm({ ...settingsForm, [item.key]: e.target.value })
                            }
                            className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#DCD3CB] rounded-xl text-[#1E1815] font-semibold focus:outline-none focus:border-[#C0392B]"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-[#EAE3DC] flex items-center justify-between">
                    <div className="text-xs text-[#7A6E67]">
                      Changes will take effect immediately across all customer and staff apps.
                    </div>
                    <button
                      type="submit"
                      disabled={settingsSaving}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#C0392B] to-[#96291D] hover:from-[#A83226] text-white font-bold text-xs shadow-md shadow-[#C0392B]/20 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      <span>{settingsSaving ? "Saving Config…" : "Save Settings"}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 7: SECURITY & AUDIT LOG                                    */}
          {/* ============================================================== */}
          {tab === "audit" && (
            <div className="bg-white border border-[#EAE3DC] rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-extrabold text-base text-[#1E1815]">Security Audit Log</h2>
                  <p className="text-xs text-[#7A6E67]">
                    Immutable audit trail of management logins, billings, reverse transactions, and branch updates.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-[#1E7A4D]/10 text-[#1E7A4D] font-bold text-xs">
                  Encrypted Ledger
                </span>
              </div>

              <div className="divide-y divide-[#EFE8E1]">
                {audit?.logs && audit.logs.length > 0 ? (
                  audit.logs.map((l: any) => (
                    <div key={l.id} className="py-3 flex items-start justify-between gap-4">
                      <div>
                        <div className="font-bold text-xs text-[#1E1815] flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-[#FAF7F4] border border-[#EAE3DC] font-mono text-[10px]">
                            {l.action}
                          </span>
                          <span>{l.staff?.name || "System"}</span>
                        </div>
                        {l.reason && (
                          <div className="text-[11px] text-[#C0392B] font-medium mt-0.5">
                            Reason: {l.reason}
                          </div>
                        )}
                        {l.metadata && (
                          <pre className="text-[10px] text-[#7A6E67] font-mono mt-1 bg-[#FAF7F4] p-1.5 rounded-lg max-w-lg overflow-x-auto">
                            {JSON.stringify(l.metadata)}
                          </pre>
                        )}
                      </div>
                      <div className="text-[10px] text-[#7A6E67] font-mono whitespace-nowrap">
                        {new Date(l.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-xs text-[#7A6E67]">No security events logged yet.</div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ============================================================== */}
      {/* MODAL: CREATE BRANCH                                            */}
      {/* ============================================================== */}
      {showCreateBranchModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#EAE3DC] rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-lg text-[#1E1815] flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#C0392B]" />
                Add New Outlet Branch
              </h3>
              <button
                onClick={() => setShowCreateBranchModal(false)}
                className="p-1 rounded-lg text-[#7A6E67] hover:bg-[#FAF7F4]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {branchMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold mb-4 ${branchMsg.type === "ok" ? "bg-[#1E7A4D]/10 text-[#1E7A4D]" : "bg-[#C0392B]/10 text-[#C0392B]"
                  }`}
              >
                {branchMsg.text}
              </div>
            )}

            <form onSubmit={handleCreateBranch} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                    Branch Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1015"
                    value={branchForm.code}
                    onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl font-mono text-[#1E1815] focus:outline-none focus:border-[#C0392B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">City *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dubai, Abu Dhabi"
                    value={branchForm.city}
                    onChange={(e) => setBranchForm({ ...branchForm, city: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#C0392B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                  Branch Name (English) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dubai Marina Mall"
                  value={branchForm.name}
                  onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#C0392B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                  Branch Name (Arabic)
                </label>
                <input
                  type="text"
                  placeholder="e.g. دبي مارينا مول"
                  dir="rtl"
                  value={branchForm.nameAr}
                  onChange={(e) => setBranchForm({ ...branchForm, nameAr: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#C0392B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">Address</label>
                <input
                  type="text"
                  placeholder="e.g. Level 1, Near Food Court"
                  value={branchForm.address}
                  onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#C0392B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">Phone</label>
                  <input
                    type="text"
                    placeholder="+971 4 123 4567"
                    value={branchForm.phone}
                    onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl font-mono text-[#1E1815] focus:outline-none focus:border-[#C0392B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                    Operating Hours
                  </label>
                  <input
                    type="text"
                    placeholder="10:00 AM – 11:00 PM"
                    value={branchForm.hours}
                    onChange={(e) => setBranchForm({ ...branchForm, hours: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#C0392B]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="bActive"
                  checked={branchForm.isActive}
                  onChange={(e) => setBranchForm({ ...branchForm, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-[#C0392B] focus:ring-[#C0392B]"
                />
                <label htmlFor="bActive" className="text-xs font-bold text-[#1E1815] cursor-pointer">
                  Activate Outlet Immediately for POS Tills & Customer Cards
                </label>
              </div>

              <div className="pt-3 border-t border-[#EAE3DC] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateBranchModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#EAE3DC] text-xs font-bold text-[#7A6E67] hover:bg-[#FAF7F4]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#C0392B] to-[#96291D] hover:from-[#A83226] text-white font-bold text-xs shadow-md shadow-[#C0392B]/20 disabled:opacity-50"
                >
                  {busy ? "Creating…" : "Save & Register Branch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: EDIT BRANCH                                              */}
      {/* ============================================================== */}
      {showEditBranchModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#EAE3DC] rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-lg text-[#1E1815] flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-[#C0392B]" />
                Edit Branch Details
              </h3>
              <button
                onClick={() => setShowEditBranchModal(false)}
                className="p-1 rounded-lg text-[#7A6E67] hover:bg-[#FAF7F4]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {branchMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold mb-4 ${branchMsg.type === "ok" ? "bg-[#1E7A4D]/10 text-[#1E7A4D]" : "bg-[#C0392B]/10 text-[#C0392B]"
                  }`}
              >
                {branchMsg.text}
              </div>
            )}

            <form onSubmit={handleUpdateBranch} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                    Branch Code
                  </label>
                  <input
                    type="text"
                    required
                    value={branchForm.code}
                    onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl font-mono text-[#1E1815] focus:outline-none focus:border-[#C0392B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={branchForm.city}
                    onChange={(e) => setBranchForm({ ...branchForm, city: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#C0392B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                  Branch Name (English)
                </label>
                <input
                  type="text"
                  required
                  value={branchForm.name}
                  onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#C0392B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                  Branch Name (Arabic)
                </label>
                <input
                  type="text"
                  dir="rtl"
                  value={branchForm.nameAr}
                  onChange={(e) => setBranchForm({ ...branchForm, nameAr: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#C0392B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">Address</label>
                <input
                  type="text"
                  value={branchForm.address}
                  onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#C0392B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">Phone</label>
                  <input
                    type="text"
                    value={branchForm.phone}
                    onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl font-mono text-[#1E1815] focus:outline-none focus:border-[#C0392B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                    Operating Hours
                  </label>
                  <input
                    type="text"
                    value={branchForm.hours}
                    onChange={(e) => setBranchForm({ ...branchForm, hours: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#C0392B]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="bActiveEdit"
                  checked={branchForm.isActive}
                  onChange={(e) => setBranchForm({ ...branchForm, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-[#C0392B] focus:ring-[#C0392B]"
                />
                <label htmlFor="bActiveEdit" className="text-xs font-bold text-[#1E1815] cursor-pointer">
                  Outlet Is Active & Available for Operations
                </label>
              </div>

              <div className="pt-3 border-t border-[#EAE3DC] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditBranchModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#EAE3DC] text-xs font-bold text-[#7A6E67] hover:bg-[#FAF7F4]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#C0392B] to-[#96291D] hover:from-[#A83226] text-white font-bold text-xs shadow-md shadow-[#C0392B]/20 disabled:opacity-50"
                >
                  {busy ? "Updating…" : "Update Branch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: DELETE / DEACTIVATE CONFIRMATION                        */}
      {/* ============================================================== */}
      {showDeleteBranchModal && branchToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#EAE3DC] rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-[#C0392B]/10 text-[#C0392B] flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="font-black text-lg text-[#1E1815] mb-1">
              Delete Branch: {branchToDelete.name}?
            </h3>
            <p className="text-xs text-[#7A6E67] leading-relaxed mb-4">
              Are you sure you want to remove{" "}
              <strong className="text-[#1E1815]">{branchToDelete.name} ({branchToDelete.code})</strong>?
              If this branch has historical customer visits or revenue records, it will be safely deactivated to protect audit history.
            </p>

            <div className="pt-3 border-t border-[#EAE3DC] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteBranchModal(false);
                  setBranchToDelete(null);
                }}
                className="px-4 py-2 rounded-xl border border-[#EAE3DC] text-xs font-bold text-[#7A6E67] hover:bg-[#FAF7F4]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteBranch}
                disabled={busy}
                className="px-5 py-2 rounded-xl bg-[#C0392B] hover:bg-[#A83226] text-white font-bold text-xs shadow-md shadow-[#C0392B]/20 disabled:opacity-50 cursor-pointer"
              >
                {busy ? "Processing…" : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: CREATE CAMPAIGN OFFER                                    */}
      {/* ============================================================== */}
      {showCreateOfferModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#EAE3DC] rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-lg text-[#1E1815] flex items-center gap-2">
                <Tag className="w-5 h-5 text-[#C0392B]" />
                Launch Promotional Campaign
              </h3>
              <button
                onClick={() => setShowCreateOfferModal(false)}
                className="p-1 rounded-lg text-[#7A6E67] hover:bg-[#FAF7F4]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {offerMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold mb-4 ${offerMsg.type === "ok" ? "bg-[#1E7A4D]/10 text-[#1E7A4D]" : "bg-[#C0392B]/10 text-[#C0392B]"
                  }`}
              >
                {offerMsg.text}
              </div>
            )}

            <form onSubmit={createOffer} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                  Offer Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Weekend Family Brunch 20% Off"
                  value={newOffer.name}
                  onChange={(e) => setNewOffer({ ...newOffer, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#C0392B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Valid on all dine-in bills over AED 100 on Saturdays and Sundays."
                  value={newOffer.description}
                  onChange={(e) => setNewOffer({ ...newOffer, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#C0392B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                    Discount Value *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 20"
                    value={newOffer.value}
                    onChange={(e) => setNewOffer({ ...newOffer, value: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl font-mono text-[#1E1815] focus:outline-none focus:border-[#C0392B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                    Discount Type
                  </label>
                  <select
                    value={newOffer.isPercent ? "pct" : "flat"}
                    onChange={(e) => setNewOffer({ ...newOffer, isPercent: e.target.value === "pct" })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl font-bold text-[#1E1815] focus:outline-none focus:border-[#C0392B]"
                  >
                    <option value="pct">Percentage (% Off)</option>
                    <option value="flat">Flat Amount (AED Off)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={newOffer.startsAt}
                    onChange={(e) => setNewOffer({ ...newOffer, startsAt: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#C0392B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#7A6E67] uppercase mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={newOffer.endsAt}
                    onChange={(e) => setNewOffer({ ...newOffer, endsAt: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F4] border border-[#EAE3DC] rounded-xl text-[#1E1815] focus:outline-none focus:border-[#C0392B]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#EAE3DC] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateOfferModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#EAE3DC] text-xs font-bold text-[#7A6E67] hover:bg-[#FAF7F4]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#C0392B] to-[#96291D] hover:from-[#A83226] text-white font-bold text-xs shadow-md shadow-[#C0392B]/20 disabled:opacity-50"
                >
                  {busy ? "Publishing…" : "Publish Campaign"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
