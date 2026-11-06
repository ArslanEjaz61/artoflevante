"use client";

import React, { useCallback, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  Eye,
  EyeOff,
  LogIn,
  Smartphone,
  Laptop,
  UserPlus,
  Ticket,
  Copy,
  RotateCw,
  Mail,
  Award,
  Ban,
  QrCode,
  Share2,
  Camera,
  ChevronDown,
  Scan,
  History,
  User,
  PartyPopper,
  Globe,
  Cake,
  MailCheck,
  Send,
  Server,
  AtSign,
  MessageSquare,
  Upload,
  Image as ImageIcon,
  FileText,
  Palette,
  Star,
} from "lucide-react";
import QRCode from "qrcode";
import jsQR from "jsqr";
import { COUNTRIES, DEFAULT_COUNTRY } from "@/lib/mobile";
import { CountryCodePicker } from "@/components/CountryCodePicker";
import { AdminNotificationBell } from "@/components/AdminNotificationBell";
import BranchModals from "@/components/admin/modals/BranchModals";
import StaffModals from "@/components/admin/modals/StaffModals";
import RewardModals from "@/components/admin/modals/RewardModals";
import CustomerDetailModal from "@/components/admin/modals/CustomerDetailModal";
import EmailTemplateModals from "@/components/admin/modals/EmailTemplateModals";
import PortalQrModal from "@/components/admin/modals/PortalQrModal";
import OfferModals from "@/components/admin/modals/OfferModals";
import CustomersTab from "@/components/admin/tabs/CustomersTab";
import VisitsTab from "@/components/admin/tabs/VisitsTab";
import StaffTab from "@/components/admin/tabs/StaffTab";
import BranchesTab from "@/components/admin/tabs/BranchesTab";
import OffersTab from "@/components/admin/tabs/OffersTab";
import OverviewTab from "@/components/admin/tabs/OverviewTab";
import OutletTab from "@/components/admin/tabs/OutletTab";
import SettingsTab from "@/components/admin/tabs/SettingsTab";

import { StampIcon, RibbonIcon, formatRelativeTime, toDatetimeLocal, formatExpiryTime, formatMoney, DEFAULT_BRANCHES } from "@/components/admin/adminUtils";

export default function AdminPage() {
  const router = useRouter();
  const [hubPortalTab, setHubPortalTab] = useState<"master" | "customer" | "outlet">("master");
  const [session, setSession] = useState<any>(null);
  const [login, setLogin] = useState({ username: "", pin: "" });
  const [tab, setTab] = useState<"overview" | "customers" | "offers" | "branches" | "staff" | "visits" | "outlet" | "audit" | "settings">("overview");
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
  const [auditSearch, setAuditSearch] = useState("");
  const [auditActionFilter, setAuditActionFilter] = useState("all");
  const [loadingAudit, setLoadingAudit] = useState(false);

  // Offers tab
  const [offers, setOffers] = useState<any>(null);
  const [showCreateOfferModal, setShowCreateOfferModal] = useState(false);
  const [offerSearch, setOfferSearch] = useState("");
  const [offerBranchFilter, setOfferBranchFilter] = useState("all");
  const [offerStatusFilter, setOfferStatusFilter] = useState<"all" | "active" | "paused" | "expired">("all");
  const [newOffer, setNewOffer] = useState<{
    name: string;
    description: string;
    value: string;
    isPercent: boolean;
    branchIds: string[];
    startsAt: string;
    endsAt: string;
    imageUrl: string;
    bannerText: string;
  }>({
    name: "",
    description: "",
    value: "",
    isPercent: true,
    branchIds: [],
    startsAt: "",
    endsAt: "",
    imageUrl: "",
    bannerText: "",
  });
  const [compressingOfferImg, setCompressingOfferImg] = useState(false);
  const [compressedImgStats, setCompressedImgStats] = useState<string | null>(null);
  const [showEditOfferModal, setShowEditOfferModal] = useState(false);
  const [editOfferForm, setEditOfferForm] = useState<{
    id: string;
    name: string;
    description: string;
    value: string;
    isPercent: boolean;
    branchIds: string[];
    startsAt: string;
    endsAt: string;
    imageUrl: string;
    bannerText: string;
    isActive: boolean;
  }>({
    id: "",
    name: "",
    description: "",
    value: "",
    isPercent: true,
    branchIds: [],
    startsAt: "",
    endsAt: "",
    imageUrl: "",
    bannerText: "",
    isActive: true,
  });
  const [compressingEditOfferImg, setCompressingEditOfferImg] = useState(false);
  const [compressedEditImgStats, setCompressedEditImgStats] = useState<string | null>(null);
  const [offerMsg, setOfferMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Branches tab & CRUD
  const [branchesData, setBranchesData] = useState<any>(null);
  const [branchSearch, setBranchSearch] = useState("");
  const [branchCityFilter, setBranchCityFilter] = useState("all");
  const [showCreateBranchModal, setShowCreateBranchModal] = useState(false);
  const [showEditBranchModal, setShowEditBranchModal] = useState(false);
  const [showDeleteBranchModal, setShowDeleteBranchModal] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState<any>(null);
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);
  const [comingSoonBranch, setComingSoonBranch] = useState<any>(null);

  const [branchForm, setBranchForm] = useState<{
    id?: string;
    code: string;
    invoicePrefix?: string;
    name: string;
    nameAr: string;
    city: string;
    address: string;
    addressAr: string;
    phone: string;
    hours: string;
    crmUrl: string;
    isActive: boolean;
    dailyCode: string;
    dailyCodeExpiresAt: string;
  }>({
    code: "",
    invoicePrefix: "",
    name: "",
    nameAr: "",
    city: "Dubai",
    address: "",
    addressAr: "",
    phone: "",
    hours: "10:00 AM – 11:00 PM",
    crmUrl: "",
    isActive: true,
    dailyCode: "",
    dailyCodeExpiresAt: "",
  });
  const [branchMsg, setBranchMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const handleOpenStoreCrm = (b: any) => {
    if (b?.crmUrl && String(b.crmUrl).trim()) {
      let targetUrl = String(b.crmUrl).trim();
      if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
        targetUrl = "https://" + targetUrl;
      }
      window.open(targetUrl, "_blank", "noopener,noreferrer");
    } else {
      setComingSoonBranch(b);
      setShowComingSoonModal(true);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {}
    window.location.href = "/admin/login";
  };

  // Settings tab & Calculator Simulator
  const [settingsList, setSettingsList] = useState<any[]>([]);
  const [settingsForm, setSettingsForm] = useState<Record<string, string>>({
    spend_aed_for_points: "10",
    points_earned_per_spend: "1",
    points_required_for_redemption: "100",
    currency_value_per_redemption_points: "5",
    currency: "AED",
  });
  const [settingsCategory, setSettingsCategory] = useState<"general" | "loyalty" | "security" | "password" | "email" | "ai" | "whatsapp">("general");
  const [aiTesting, setAiTesting] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<{ ok: boolean; message: string; latencyMs?: number } | null>(null);
  const [testProvider, setTestProvider] = useState<"gemini" | "openai" | "openrouter">("gemini");

  const handleTestAi = async () => {
    setAiTesting(true);
    setAiTestResult(null);
    try {
      const key =
        testProvider === "gemini"
          ? settingsForm.gemini_api_key
          : testProvider === "openai"
          ? settingsForm.openai_api_key
          : settingsForm.openrouter_api_key;
      const model =
        testProvider === "gemini"
          ? settingsForm.gemini_model
          : testProvider === "openai"
          ? settingsForm.openai_model
          : settingsForm.openrouter_model;

      const res = await fetch("/api/admin/ai-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: testProvider, apiKey: key, model }),
      });
      const d = await res.json();
      setAiTestResult({
        ok: d.ok,
        message: d.message || (d.ok ? "Connected successfully!" : d.error || "Connection test failed."),
        latencyMs: d.latencyMs,
      });
    } catch (err: any) {
      setAiTestResult({ ok: false, message: err?.message || "Connection timed out." });
    } finally {
      setAiTesting(false);
    }
  };
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Admin PIN change states
  const [pinForm, setPinForm] = useState({
    currentPin: "",
    newPin: "",
    confirmPin: "",
  });
  const [showCurrPin, setShowCurrPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [pinSaving, setPinSaving] = useState(false);
  const [pinMsg, setPinMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Staff tab & CRUD
  const [staffData, setStaffData] = useState<any[]>([]);
  const [staffSearch, setStaffSearch] = useState("");
  const [staffRoleFilter, setStaffRoleFilter] = useState("all");
  const [staffBranchFilter, setStaffBranchFilter] = useState("all");
  const [showCreateStaffModal, setShowCreateStaffModal] = useState(false);
  const [showEditStaffModal, setShowEditStaffModal] = useState(false);
  const [showDeleteStaffModal, setShowDeleteStaffModal] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<any>(null);
  const [showStaffPin, setShowStaffPin] = useState(false);
  const [showEditStaffPin, setShowEditStaffPin] = useState(false);
  const [staffForm, setStaffForm] = useState<{
    id?: string;
    username: string;
    name: string;
    pin: string;
    role: string;
    branchId: string;
    isActive: boolean;
  }>({
    username: "",
    name: "",
    pin: "",
    role: "CASHIER",
    branchId: "",
    isActive: true,
  });
  const [staffMsg, setStaffMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Visits tab & 24h Daily Codes
  const [visitsData, setVisitsData] = useState<any[]>([]);
  const [branchCodes, setBranchCodes] = useState<any[]>([]);
  const [visitMetrics, setVisitMetrics] = useState<any>({
    totalVisits: 0,
    todayVisits: 0,
    uniqueCustomersToday: 0,
    topBranchName: "None",
  });
  const [visitSearch, setVisitSearch] = useState("");
  const [visitBranchFilter, setVisitBranchFilter] = useState("all");
  const [visitDateFilter, setVisitDateFilter] = useState("all");
  const [visitMsg, setVisitMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [rotatingBranchId, setRotatingBranchId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Overview Tab Filters
  const [overviewBranchFilter, setOverviewBranchFilter] = useState("all");
  const [overviewDateFilter, setOverviewDateFilter] = useState("all");

  // Customer Portal QR Modal State
  const [showPortalQrModal, setShowPortalQrModal] = useState(false);
  const [portalQrDataUrl, setPortalQrDataUrl] = useState<string>("");
  const [portalUrl, setPortalUrl] = useState<string>("");
  const [copiedPortalLink, setCopiedPortalLink] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const url = window.location.origin;
      setPortalUrl(url);
      QRCode.toDataURL(url, {
        margin: 1,
        width: 400,
        color: {
          dark: "#143F26",
          light: "#FFFFFF",
        },
      })
        .then((dataUrl) => setPortalQrDataUrl(dataUrl))
        .catch(() => { });
    }
  }, []);

  const handleSharePortalLink = async () => {
    const url = portalUrl || (typeof window !== "undefined" ? window.location.origin : "");
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Levante Rewards",
          text: "Scan or tap to register and open your Levante Rewards account!",
          url: url,
        });
      } catch { }
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedPortalLink(true);
      setTimeout(() => setCopiedPortalLink(false), 3000);
    }
  };

  // Simulator Test Inputs
  const [simBillAmount, setSimBillAmount] = useState("250");
  const [simPointsBalance, setSimPointsBalance] = useState("500");

  // Visit Milestone Rewards state (Kitny visit pr kya free mily ga)
  const [visitRewardsList, setVisitRewardsList] = useState<any[]>([]);
  const [showVisitRewardModal, setShowVisitRewardModal] = useState(false);
  const [showDeleteVisitRewardModal, setShowDeleteVisitRewardModal] = useState(false);
  const [visitRewardToDelete, setVisitRewardToDelete] = useState<any>(null);
  const [editingVisitRewardId, setEditingVisitRewardId] = useState<string | null>(null);
  const [visitRewardForm, setVisitRewardForm] = useState<{
    name: string;
    nameAr: string;
    description: string;
    descriptionAr: string;
    threshold: number | string;
    validDays: number | string;
    isActive: boolean;
  }>({
    name: "",
    nameAr: "",
    description: "",
    descriptionAr: "",
    threshold: 5,
    validDays: 30,
    isActive: true,
  });
  const [visitRewardSaving, setVisitRewardSaving] = useState(false);
  const [visitRewardMsg, setVisitRewardMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Birthday Gift & Special Treats Engine state
  const [birthdayRewardsList, setBirthdayRewardsList] = useState<any[]>([]);
  const [upcomingCelebrants, setUpcomingCelebrants] = useState<any[]>([]);
  const [totalCelebrantsCount, setTotalCelebrantsCount] = useState(0);
  const [showBirthdayRewardModal, setShowBirthdayRewardModal] = useState(false);
  const [showDeleteBirthdayRewardModal, setShowDeleteBirthdayRewardModal] = useState(false);
  const [birthdayRewardToDelete, setBirthdayRewardToDelete] = useState<any>(null);
  const [editingBirthdayRewardId, setEditingBirthdayRewardId] = useState<string | null>(null);
  const [birthdayRewardForm, setBirthdayRewardForm] = useState<{
    name: string;
    nameAr: string;
    description: string;
    descriptionAr: string;
    value: number | string;
    isPercent: boolean;
    validDays: number | string;
    isActive: boolean;
  }>({
    name: "",
    nameAr: "",
    description: "",
    descriptionAr: "",
    value: 20,
    isPercent: true,
    validDays: 30,
    isActive: true,
  });
  const [birthdayRewardSaving, setBirthdayRewardSaving] = useState(false);
  const [birthdayRewardMsg, setBirthdayRewardMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [dispatchingBirthdayId, setDispatchingBirthdayId] = useState<string | null>(null);

  // Email Marketing & SMTP Hub State
  const [emailSubTab, setEmailSubTab] = useState<"compose" | "templates" | "smtp" | "logs">("smtp");
  const [smtpForm, setSmtpForm] = useState({
    host: "smtp.gmail.com",
    port: "587",
    secure: false,
    user: "",
    pass: "",
    fromEmail: "",
    fromName: "Levante Rewards",
  });
  const [smtpTestRecipient, setSmtpTestRecipient] = useState("");
  const [smtpTesting, setSmtpTesting] = useState(false);
  const [smtpSaving, setSmtpSaving] = useState(false);
  const [smtpMsg, setSmtpMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [campaignForm, setCampaignForm] = useState({
    targetAudience: "all" as "all" | "active" | "birthdays" | "single",
    recipientEmail: "",
    subject: "",
    content: "",
  });
  const [campaignSending, setCampaignSending] = useState(false);
  const [campaignMsg, setCampaignMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [emailLogs, setEmailLogs] = useState<any[]>([]);
  const [emailStats, setEmailStats] = useState({ totalSent: 0, totalFailed: 0, totalCount: 0 });
  const [loadingEmailLogs, setLoadingEmailLogs] = useState(false);

  // Email Templates State
  const [emailTemplates, setEmailTemplates] = useState<any[]>([]);
  const [loadingEmailTemplates, setLoadingEmailTemplates] = useState(false);
  const [defaultBdayTplId, setDefaultBdayTplId] = useState<string | null>(null);
  const [defaultOffersTplId, setDefaultOffersTplId] = useState<string | null>(null);
  const [showCreateTemplateModal, setShowCreateTemplateModal] = useState(false);
  const [showEditTemplateModal, setShowEditTemplateModal] = useState(false);
  const [showEmailPreviewModal, setShowEmailPreviewModal] = useState(false);
  const [previewDeviceMode, setPreviewDeviceMode] = useState<"desktop" | "mobile">("desktop");
  const [previewEmailData, setPreviewEmailData] = useState<{
    subject: string;
    content: string;
    templateName?: string;
    category?: string;
  }>({
    subject: "",
    content: "",
  });
  const [templateForm, setTemplateForm] = useState<{
    id?: string;
    name: string;
    category: "BIRTHDAY" | "OFFERS" | "GENERAL";
    subject: string;
    content: string;
    isDefault: boolean;
  }>({
    name: "",
    category: "GENERAL",
    subject: "",
    content: "",
    isDefault: false,
  });
  const [templateSaving, setTemplateSaving] = useState(false);
  const [templateMsg, setTemplateMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Customer Details Modal State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedCustomerData, setSelectedCustomerData] = useState<any>(null);
  const [loadingCustomerDetail, setLoadingCustomerDetail] = useState(false);
  const [customerDetailTab, setCustomerDetailTab] = useState<"overview" | "transactions" | "rewards" | "visits" | "ledger">("overview");
  const [customerDetailMsg, setCustomerDetailMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const loadCustomers = useCallback(async () => {
    try {
      const r = await fetch(
        `/api/admin/customers?q=${encodeURIComponent(q)}&page=${page}&filter=${filter}`
      );
      const d = await r.json();
      if (r.ok) setCust(d);
    } catch { }
  }, [q, page, filter]);

  const openCustomerDetail = useCallback(async (id: string) => {
    setSelectedCustomerId(id);
    setSelectedCustomerData(null);
    setLoadingCustomerDetail(true);
    setCustomerDetailTab("overview");
    setCustomerDetailMsg(null);
    try {
      const r = await fetch(`/api/admin/customers/${id}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Could not load customer profile.");
      setSelectedCustomerData(d.customer);
    } catch (e: any) {
      setCustomerDetailMsg({ type: "err", text: String(e.message || e) });
    } finally {
      setLoadingCustomerDetail(false);
    }
  }, []);

  const toggleCustomerBlock = useCallback(async (id: string, isBlocked: boolean) => {
    try {
      const r = await fetch(`/api/admin/customers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isBlocked }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Could not update customer status.");
      setSelectedCustomerData((prev: any) => (prev ? { ...prev, isBlocked } : prev));
      setCustomerDetailMsg({
        type: "ok",
        text: isBlocked ? "Customer account has been blocked." : "Customer account unblocked & active.",
      });
      loadCustomers();
    } catch (e: any) {
      setCustomerDetailMsg({ type: "err", text: String(e.message || e) });
    }
  }, [loadCustomers]);

  const loadOverview = useCallback(async () => {
    setErr("");
    setRefreshing(true);
    try {
      const r = await fetch(
        `/api/admin/overview?branchId=${encodeURIComponent(overviewBranchFilter)}&dateRange=${encodeURIComponent(
          overviewDateFilter
        )}`
      );
      if (r.status === 401 || r.status === 403) {
        router.push("/admin/login");
        return;
      }
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Could not load admin overview.");
      setData(d);
      setSession(d.scope);
    } catch (e: any) {
      setErr(String(e.message || e));
    } finally {
      setRefreshing(false);
    }
  }, [overviewBranchFilter, overviewDateFilter, router]);

  const loadAudit = useCallback(async () => {
    setLoadingAudit(true);
    try {
      const url =
        auditActionFilter && auditActionFilter !== "all"
          ? `/api/admin/audit?action=${encodeURIComponent(auditActionFilter)}`
          : "/api/admin/audit";
      const r = await fetch(url);
      const d = await r.json();
      if (r.ok) setAudit(d);
    } catch { } finally {
      setLoadingAudit(false);
    }
  }, [auditActionFilter]);

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

  const loadVisitRewards = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/visit-rewards");
      const d = await r.json();
      if (r.ok && d.rewards) {
        setVisitRewardsList(d.rewards);
      }
    } catch { }
  }, []);

  const loadBirthdayRewards = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/birthday-rewards");
      const d = await r.json();
      if (r.ok) {
        if (d.rewards) setBirthdayRewardsList(d.rewards);
        if (d.upcomingCelebrants) setUpcomingCelebrants(d.upcomingCelebrants);
        if (d.totalCelebrantsCount !== undefined) setTotalCelebrantsCount(d.totalCelebrantsCount);
      }
    } catch { }
  }, []);

  const loadEmailSettings = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/email/settings");
      const d = await r.json();
      if (r.ok && d.settings) {
        setSmtpForm({
          host: d.settings.host || "",
          port: String(d.settings.port || 587),
          secure: d.settings.secure || false,
          user: d.settings.user || "",
          pass: d.settings.pass || "",
          fromEmail: d.settings.fromEmail || "",
          fromName: d.settings.fromName || "Levante Rewards",
        });
      }
    } catch { }
  }, []);

  const loadEmailLogs = useCallback(async () => {
    setLoadingEmailLogs(true);
    try {
      const r = await fetch("/api/admin/email/send?limit=40");
      const d = await r.json();
      if (r.ok) {
        if (d.logs) setEmailLogs(d.logs);
        if (d.stats) setEmailStats(d.stats);
      }
    } catch { }
    finally {
      setLoadingEmailLogs(false);
    }
  }, []);

  const loadEmailTemplates = useCallback(async () => {
    setLoadingEmailTemplates(true);
    try {
      const r = await fetch("/api/admin/email/templates");
      const d = await r.json();
      if (r.ok && d.templates) {
        setEmailTemplates(d.templates);
        if (d.defaultBirthdayTemplateId) setDefaultBdayTplId(d.defaultBirthdayTemplateId);
        if (d.defaultOffersTemplateId) setDefaultOffersTplId(d.defaultOffersTemplateId);
      }
    } catch { }
    finally {
      setLoadingEmailTemplates(false);
    }
  }, []);

  const loadStaff = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/staff");
      const d = await r.json();
      if (r.ok && d.staff) {
        setStaffData(d.staff);
      }
    } catch { }
  }, []);

  const loadVisits = useCallback(async () => {
    try {
      const r = await fetch(
        `/api/admin/visits?branchId=${encodeURIComponent(visitBranchFilter)}&dateRange=${encodeURIComponent(
          visitDateFilter
        )}&q=${encodeURIComponent(visitSearch)}`
      );
      const d = await r.json();
      if (r.ok) {
        if (d.visits) setVisitsData(d.visits);
        if (d.branchCodes) setBranchCodes(d.branchCodes);
        if (d.metrics) setVisitMetrics(d.metrics);
      }
    } catch { }
  }, [visitBranchFilter, visitDateFilter, visitSearch]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    if (tab === "customers") loadCustomers();
    if (tab === "audit") loadAudit();
    if (tab === "offers") loadOffers();
    if (tab === "branches") loadBranches();
    if (tab === "settings") {
      loadSettings();
      loadVisitRewards();
      loadBirthdayRewards();
      loadEmailSettings();
      loadEmailLogs();
      loadEmailTemplates();
    }
    if (tab === "staff") {
      loadStaff();
      loadBranches();
    }
    if (tab === "visits") {
      loadVisits();
      loadBranches();
    }
  }, [tab, loadCustomers, loadAudit, loadOffers, loadBranches, loadSettings, loadVisitRewards, loadBirthdayRewards, loadEmailSettings, loadEmailLogs, loadEmailTemplates, loadStaff, loadVisits]);

  // Branch Coupon Generator Helper
  function generateRandomCouponCode(_prefix?: string) {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let p1 = "";
    let p2 = "";
    for (let i = 0; i < 4; i++) {
      p1 += chars[Math.floor(Math.random() * chars.length)];
      p2 += chars[Math.floor(Math.random() * chars.length)];
    }
    return `${p1}-${p2}`;
  }

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
      setBranchMsg({ type: "ok", text: `Branch '${d.branch.name}' created successfully with 24H Coupon '${d.branch.dailyCode}'!` });
      setShowCreateBranchModal(false);
      setBranchForm({
        code: "",
        invoicePrefix: "",
        name: "",
        nameAr: "",
        city: "Dubai",
        address: "",
        addressAr: "",
        phone: "",
        hours: "10:00 AM – 11:00 PM",
        crmUrl: "",
        isActive: true,
        dailyCode: "",
        dailyCodeExpiresAt: "",
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
      invoicePrefix: b.invoicePrefix || b.code || "",
      name: b.name || "",
      nameAr: b.nameAr || "",
      city: b.city || "Dubai",
      address: b.address || "",
      addressAr: b.addressAr || "",
      phone: b.phone || "",
      hours: b.hours || "",
      crmUrl: b.crmUrl || "",
      isActive: b.isActive,
      dailyCode: b.dailyCode || "",
      dailyCodeExpiresAt: b.dailyCodeExpiresAt ? toDatetimeLocal(b.dailyCodeExpiresAt) : toDatetimeLocal(),
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

  // Visit Milestone Rewards Handlers (Kitny visit pr kya free mily ga)
  async function handleSaveVisitReward(e: React.FormEvent) {
    e.preventDefault();
    setVisitRewardSaving(true);
    setVisitRewardMsg(null);
    try {
      const method = editingVisitRewardId ? "PATCH" : "POST";
      const payload = editingVisitRewardId
        ? { id: editingVisitRewardId, ...visitRewardForm }
        : visitRewardForm;

      const r = await fetch("/api/admin/visit-rewards", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed to save visit milestone reward.");

      setVisitRewardMsg({ type: "ok", text: d.message || "Visit milestone reward rule saved live!" });
      setShowVisitRewardModal(false);
      setEditingVisitRewardId(null);
      setVisitRewardForm({
        name: "",
        nameAr: "",
        description: "",
        descriptionAr: "",
        threshold: 5,
        validDays: 30,
        isActive: true,
      });
      loadVisitRewards();
      loadOverview();
    } catch (err2: any) {
      setVisitRewardMsg({ type: "err", text: String(err2.message || err2) });
    } finally {
      setVisitRewardSaving(false);
    }
  }

  async function handleToggleVisitReward(reward: any) {
    try {
      const r = await fetch("/api/admin/visit-rewards", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: reward.id,
          isActive: !reward.isActive,
        }),
      });
      if (r.ok) {
        loadVisitRewards();
      }
    } catch { }
  }

  async function handleDeleteVisitReward() {
    if (!visitRewardToDelete) return;
    setBusy(true);
    setVisitRewardMsg(null);
    try {
      const r = await fetch(`/api/admin/visit-rewards?id=${visitRewardToDelete.id}`, {
        method: "DELETE",
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed to delete visit milestone reward.");
      setVisitRewardMsg({ type: "ok", text: d.message || "Visit milestone removed successfully." });
      setShowDeleteVisitRewardModal(false);
      setVisitRewardToDelete(null);
      loadVisitRewards();
      loadOverview();
    } catch (err2: any) {
      setVisitRewardMsg({ type: "err", text: String(err2.message || err2) });
    } finally {
      setBusy(false);
    }
  }

  function openCreateVisitReward() {
    setEditingVisitRewardId(null);
    setVisitRewardForm({
      name: "",
      nameAr: "",
      description: "",
      descriptionAr: "",
      threshold: 5,
      validDays: 30,
      isActive: true,
    });
    setVisitRewardMsg(null);
    setShowVisitRewardModal(true);
  }

  function openEditVisitReward(item: any) {
    setEditingVisitRewardId(item.id);
    setVisitRewardForm({
      name: item.name || "",
      nameAr: item.nameAr || "",
      description: item.description || "",
      descriptionAr: item.descriptionAr || "",
      threshold: item.threshold || 5,
      validDays: item.validDays || 30,
      isActive: item.isActive !== undefined ? item.isActive : true,
    });
    setVisitRewardMsg(null);
    setShowVisitRewardModal(true);
  }

  function openDeleteVisitReward(item: any) {
    setVisitRewardToDelete(item);
    setVisitRewardMsg(null);
    setShowDeleteVisitRewardModal(true);
  }

  // Birthday Gift Reward Handlers
  async function handleSaveBirthdayReward(e: React.FormEvent) {
    e.preventDefault();
    setBirthdayRewardSaving(true);
    setBirthdayRewardMsg(null);
    try {
      const method = editingBirthdayRewardId ? "PATCH" : "POST";
      const payload = editingBirthdayRewardId
        ? { id: editingBirthdayRewardId, ...birthdayRewardForm }
        : birthdayRewardForm;

      const r = await fetch("/api/admin/birthday-rewards", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed to save birthday reward.");

      setBirthdayRewardMsg({ type: "ok", text: d.message || "Birthday gift rule saved successfully!" });
      setShowBirthdayRewardModal(false);
      setEditingBirthdayRewardId(null);
      setBirthdayRewardForm({
        name: "",
        nameAr: "",
        description: "",
        descriptionAr: "",
        value: 20,
        isPercent: true,
        validDays: 30,
        isActive: true,
      });
      loadBirthdayRewards();
      loadOverview();
    } catch (err2: any) {
      setBirthdayRewardMsg({ type: "err", text: String(err2.message || err2) });
    } finally {
      setBirthdayRewardSaving(false);
    }
  }

  async function handleToggleBirthdayReward(reward: any) {
    try {
      const r = await fetch("/api/admin/birthday-rewards", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: reward.id,
          isActive: !reward.isActive,
        }),
      });
      if (r.ok) {
        loadBirthdayRewards();
      }
    } catch { }
  }

  async function handleDeleteBirthdayReward() {
    if (!birthdayRewardToDelete) return;
    setBusy(true);
    setBirthdayRewardMsg(null);
    try {
      const r = await fetch(`/api/admin/birthday-rewards?id=${birthdayRewardToDelete.id}`, {
        method: "DELETE",
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed to delete birthday reward.");
      setBirthdayRewardMsg({ type: "ok", text: d.message || "Birthday reward rule removed." });
      setShowDeleteBirthdayRewardModal(false);
      setBirthdayRewardToDelete(null);
      loadBirthdayRewards();
      loadOverview();
    } catch (err2: any) {
      setBirthdayRewardMsg({ type: "err", text: String(err2.message || err2) });
    } finally {
      setBusy(false);
    }
  }

  function openCreateBirthdayReward() {
    setEditingBirthdayRewardId(null);
    setBirthdayRewardForm({
      name: "",
      nameAr: "",
      description: "",
      descriptionAr: "",
      value: 20,
      isPercent: true,
      validDays: 30,
      isActive: true,
    });
    setBirthdayRewardMsg(null);
    setShowBirthdayRewardModal(true);
  }

  function openEditBirthdayReward(item: any) {
    setEditingBirthdayRewardId(item.id);
    setBirthdayRewardForm({
      name: item.name || "",
      nameAr: item.nameAr || "",
      description: item.description || "",
      descriptionAr: item.descriptionAr || "",
      value: item.value || 0,
      isPercent: item.isPercent !== undefined ? item.isPercent : true,
      validDays: item.validDays || 30,
      isActive: item.isActive !== undefined ? item.isActive : true,
    });
    setBirthdayRewardMsg(null);
    setShowBirthdayRewardModal(true);
  }

  function openDeleteBirthdayReward(item: any) {
    setBirthdayRewardToDelete(item);
    setBirthdayRewardMsg(null);
    setShowDeleteBirthdayRewardModal(true);
  }

  async function handleGrantBirthdayTreat(customerId: string, rewardId?: string) {
    setDispatchingBirthdayId(customerId);
    setBirthdayRewardMsg(null);
    try {
      const r = await fetch("/api/admin/birthday-rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "grant",
          customerId,
          rewardId,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed to dispatch birthday gift.");
      setBirthdayRewardMsg({ type: "ok", text: d.message || "Birthday gift issued successfully!" });
      loadBirthdayRewards();
      loadOverview();
    } catch (err2: any) {
      setBirthdayRewardMsg({ type: "err", text: String(err2.message || err2) });
    } finally {
      setDispatchingBirthdayId(null);
    }
  }

  async function handleDispatchAllBirthdayTreats() {
    setDispatchingBirthdayId("ALL");
    setBirthdayRewardMsg(null);
    try {
      const r = await fetch("/api/admin/birthday-rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "grant",
          customerId: "ALL_UPCOMING",
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed to dispatch birthday gifts.");
      setBirthdayRewardMsg({ type: "ok", text: d.message || "All upcoming birthday treats issued!" });
      loadBirthdayRewards();
      loadOverview();
    } catch (err2: any) {
      setBirthdayRewardMsg({ type: "err", text: String(err2.message || err2) });
    } finally {
      setDispatchingBirthdayId(null);
    }
  }

  // Email SMTP & Campaign Handlers
  async function handleSaveSmtpSettings(e: React.FormEvent) {
    e.preventDefault();
    setSmtpSaving(true);
    setSmtpMsg(null);
    try {
      const r = await fetch("/api/admin/email/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(smtpForm),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed to save SMTP settings.");
      setSmtpMsg({ type: "ok", text: d.message || "SMTP configuration saved live!" });
      loadEmailSettings();
    } catch (err2: any) {
      setSmtpMsg({ type: "err", text: String(err2.message || err2) });
    } finally {
      setSmtpSaving(false);
    }
  }

  async function handleTestSmtpConnection(e: React.FormEvent) {
    e.preventDefault();
    if (!smtpTestRecipient) {
      setSmtpMsg({ type: "err", text: "Please enter a test recipient email address." });
      return;
    }
    setSmtpTesting(true);
    setSmtpMsg(null);
    try {
      const r = await fetch("/api/admin/email/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "test",
          testRecipient: smtpTestRecipient,
          ...smtpForm,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "SMTP test connection failed.");
      setSmtpMsg({ type: "ok", text: d.message || `Test email successfully sent to ${smtpTestRecipient}!` });
    } catch (err2: any) {
      setSmtpMsg({ type: "err", text: String(err2.message || err2) });
    } finally {
      setSmtpTesting(false);
    }
  }

  async function handleSendCampaignEmail(e: React.FormEvent) {
    e.preventDefault();
    setCampaignSending(true);
    setCampaignMsg(null);
    try {
      const r = await fetch("/api/admin/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(campaignForm),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed to send email broadcast.");
      setCampaignMsg({ type: "ok", text: d.message || "Email broadcast dispatched successfully!" });
      loadEmailLogs();
    } catch (err2: any) {
      setCampaignMsg({ type: "err", text: String(err2.message || err2) });
    } finally {
      setCampaignSending(false);
    }
  }

  // Staff CRUD Handlers
  async function handleCreateStaff(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStaffMsg(null);
    try {
      const r = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(staffForm),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed to create staff account.");
      setStaffMsg({ type: "ok", text: d.message || `Staff account '${d.staff.name}' created successfully!` });
      setShowCreateStaffModal(false);
      setStaffForm({
        username: "",
        name: "",
        pin: "",
        role: "CASHIER",
        branchId: "",
        isActive: true,
      });
      loadStaff();
      loadOverview();
    } catch (err2: any) {
      setStaffMsg({ type: "err", text: String(err2.message || err2) });
    } finally {
      setBusy(false);
    }
  }

  async function handleUpdateStaff(e: React.FormEvent) {
    e.preventDefault();
    if (!staffForm.id) return;
    setBusy(true);
    setStaffMsg(null);
    try {
      const r = await fetch("/api/admin/staff", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(staffForm),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed to update staff account.");
      setStaffMsg({ type: "ok", text: d.message || `Staff account '${d.staff.name}' updated successfully!` });
      setShowEditStaffModal(false);
      loadStaff();
      loadOverview();
    } catch (err2: any) {
      setStaffMsg({ type: "err", text: String(err2.message || err2) });
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteStaff() {
    if (!staffToDelete) return;
    setBusy(true);
    setStaffMsg(null);
    try {
      const r = await fetch(`/api/admin/staff?id=${staffToDelete.id}`, {
        method: "DELETE",
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed to remove staff account.");
      setStaffMsg({ type: "ok", text: d.message || "Staff account removed successfully." });
      setShowDeleteStaffModal(false);
      setStaffToDelete(null);
      loadStaff();
      loadOverview();
    } catch (err2: any) {
      setStaffMsg({ type: "err", text: String(err2.message || err2) });
    } finally {
      setBusy(false);
    }
  }

  async function handleToggleStaff(staff: any) {
    try {
      const r = await fetch("/api/admin/staff", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: staff.id,
          isActive: !staff.isActive,
        }),
      });
      if (r.ok) {
        loadStaff();
        loadOverview();
      }
    } catch { }
  }

  function openEditStaff(s: any) {
    setStaffForm({
      id: s.id,
      username: s.username || "",
      name: s.name || "",
      pin: "",
      role: s.role || "CASHIER",
      branchId: s.branchId || "",
      isActive: s.isActive,
    });
    setStaffMsg(null);
    setShowEditStaffModal(true);
  }

  function openDeleteStaff(s: any) {
    setStaffToDelete(s);
    setStaffMsg(null);
    setShowDeleteStaffModal(true);
  }

  // Visit & Coupon Code Handlers
  async function handleRotateBranchCode(branchId: string) {
    setRotatingBranchId(branchId);
    setVisitMsg(null);
    setBranchMsg(null);
    try {
      const r = await fetch("/api/admin/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branchId, action: "rotate" }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed to rotate code.");
      const successText = d.message || "24-Hour Coupon Code rotated successfully.";
      setVisitMsg({ type: "ok", text: successText });
      setBranchMsg({ type: "ok", text: successText });
      loadVisits();
      loadBranches();
    } catch (err2: any) {
      const errText = String(err2.message || err2);
      setVisitMsg({ type: "err", text: errText });
      setBranchMsg({ type: "err", text: errText });
    } finally {
      setRotatingBranchId(null);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2500);
  }

  function handleOfferImageFile(file: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setOfferMsg({ type: "err", text: "Please select a valid image file (PNG, JPG, WebP)." });
      return;
    }
    setCompressingOfferImg(true);
    setCompressedImgStats(null);
    const originalSizeKb = Math.round(file.size / 1024);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxWidth = 1200;
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const webpData = canvas.toDataURL("image/webp", 0.85);
          const newSizeKb = Math.round((webpData.length * 3) / 4 / 1024);
          setCompressedImgStats(`Original: ${originalSizeKb} KB ➔ Optimized WebP: ${newSizeKb} KB`);
          setNewOffer((prev) => ({ ...prev, imageUrl: webpData }));
        }
        setCompressingOfferImg(false);
      };
      img.onerror = () => {
        setCompressingOfferImg(false);
        setOfferMsg({ type: "err", text: "Could not process selected image." });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
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
      setOfferMsg({
        type: "ok",
        text: d.message || "Campaign offer created successfully and broadcast announcement email dispatched to all members!",
      });
      setNewOffer({
        name: "",
        description: "",
        value: "",
        isPercent: true,
        branchIds: [],
        startsAt: "",
        endsAt: "",
        imageUrl: "",
        bannerText: "",
      });
      setCompressedImgStats(null);
      setShowCreateOfferModal(false);
      loadOffers();
    } catch (e2: any) {
      setOfferMsg({ type: "err", text: String(e2.message || e2) });
    } finally {
      setBusy(false);
    }
  }

  function handleEditOfferImageFile(file: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setOfferMsg({ type: "err", text: "Please select a valid image file (PNG, JPG, WebP)." });
      return;
    }
    setCompressingEditOfferImg(true);
    setCompressedEditImgStats(null);
    const originalSizeKb = Math.round(file.size / 1024);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxWidth = 1200;
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const webpData = canvas.toDataURL("image/webp", 0.85);
          const newSizeKb = Math.round((webpData.length * 3) / 4 / 1024);
          setCompressedEditImgStats(`Original: ${originalSizeKb} KB ➔ Optimized WebP: ${newSizeKb} KB`);
          setEditOfferForm((prev) => ({ ...prev, imageUrl: webpData }));
        }
        setCompressingEditOfferImg(false);
      };
      img.onerror = () => {
        setCompressingEditOfferImg(false);
        setOfferMsg({ type: "err", text: "Could not process selected image." });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  function openEditOffer(o: any) {
    setEditOfferForm({
      id: o.id,
      name: o.name || "",
      description: o.description || "",
      value: String(o.value ?? ""),
      isPercent: o.isPercent ?? true,
      branchIds: (o.branches || []).map((b: any) => b.id || b.code),
      startsAt: o.startsAt ? toDatetimeLocal(o.startsAt) : "",
      endsAt: o.endsAt ? toDatetimeLocal(o.endsAt) : "",
      imageUrl: o.imageUrl || "",
      bannerText: o.bannerText || "",
      isActive: o.isActive ?? true,
    });
    setCompressedEditImgStats(null);
    setOfferMsg(null);
    setShowEditOfferModal(true);
  }

  async function updateOffer(e: React.FormEvent) {
    e.preventDefault();
    if (!editOfferForm.id) return;
    setBusy(true);
    setOfferMsg(null);
    try {
      const r = await fetch("/api/admin/offers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editOfferForm),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Could not update offer.");
      setOfferMsg({ type: "ok", text: "Offer details and banner updated successfully." });
      setShowEditOfferModal(false);
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

  async function deleteOffer(id: string) {
    if (!confirm("Are you sure you want to permanently delete this campaign?")) return;
    try {
      const r = await fetch(`/api/admin/offers?id=${id}`, {
        method: "DELETE",
      });
      if (r.ok) {
        setOfferMsg({ type: "ok", text: "Campaign deleted successfully." });
        loadOffers();
      }
    } catch { }
  }

  // Email Templates Handlers
  function openEmailPreview(title: string, subject: string, content: string, category?: string) {
    setPreviewEmailData({
      templateName: title,
      subject,
      content,
      category,
    });
    setPreviewDeviceMode("desktop");
    setShowEmailPreviewModal(true);
  }

  async function handleCreateEmailTemplate(e: React.FormEvent) {
    e.preventDefault();
    setTemplateSaving(true);
    setTemplateMsg(null);
    try {
      const r = await fetch("/api/admin/email/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(templateForm),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed to create email template.");
      setTemplateMsg({ type: "ok", text: d.message || "Email template created successfully!" });
      setShowCreateTemplateModal(false);
      setTemplateForm({
        name: "",
        category: "GENERAL",
        subject: "",
        content: "",
        isDefault: false,
      });
      loadEmailTemplates();
    } catch (err2: any) {
      setTemplateMsg({ type: "err", text: String(err2.message || err2) });
    } finally {
      setTemplateSaving(false);
    }
  }

  async function handleUpdateEmailTemplate(e: React.FormEvent) {
    e.preventDefault();
    if (!templateForm.id) return;
    setTemplateSaving(true);
    setTemplateMsg(null);
    try {
      const r = await fetch("/api/admin/email/templates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(templateForm),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed to update email template.");
      setTemplateMsg({ type: "ok", text: d.message || "Email template updated successfully!" });
      setShowEditTemplateModal(false);
      loadEmailTemplates();
    } catch (err2: any) {
      setTemplateMsg({ type: "err", text: String(err2.message || err2) });
    } finally {
      setTemplateSaving(false);
    }
  }

  async function handleSetDefaultTemplate(id: string, category: string) {
    try {
      const r = await fetch("/api/admin/email/templates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "set_default",
          id,
          category,
        }),
      });
      const d = await r.json();
      if (r.ok) {
        setTemplateMsg({ type: "ok", text: d.message || "Default email template updated." });
        loadEmailTemplates();
      }
    } catch { }
  }

  async function handleDeleteEmailTemplate(id: string) {
    if (!confirm("Are you sure you want to delete this custom email template?")) return;
    try {
      const r = await fetch(`/api/admin/email/templates?id=${id}`, {
        method: "DELETE",
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed to delete template.");
      setTemplateMsg({ type: "ok", text: d.message || "Template removed successfully." });
      loadEmailTemplates();
    } catch (err2: any) {
      setTemplateMsg({ type: "err", text: String(err2.message || err2) });
    }
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
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-[#120F0E] via-[#1B1716] to-[#251D1A] text-white">
        <div className="w-8 h-8 border-3 border-[#143F26]/30 border-t-[#143F26] rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-[#B8ADA6]">Connecting to Executive Control…</p>
      </div>
    );
  }

  // ===================== SIGNED IN EXECUTIVE DASHBOARD =====================
  const cur = settingsForm.currency || data?.currency || "AED";
  const metrics = data?.metrics || data?.kpis || {};

  // Filtered branches for Branches Tab
  const allBranches = branchesData?.branches || data?.branches || data?.branchLeaderboard || data?.branchPerformance || [];
  const branchesList = allBranches.length > 0 ? allBranches : DEFAULT_BRANCHES;
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

  // Filtered staff for Staff Tab
  const filteredStaff = staffData.filter((s: any) => {
    const qLower = staffSearch.toLowerCase();
    const matchQ =
      !staffSearch ||
      s.name.toLowerCase().includes(qLower) ||
      s.username.toLowerCase().includes(qLower) ||
      (s.branch?.name && s.branch.name.toLowerCase().includes(qLower)) ||
      s.role.toLowerCase().includes(qLower);
    const matchRole = staffRoleFilter === "all" || s.role === staffRoleFilter;
    const matchBranch =
      staffBranchFilter === "all" ||
      (staffBranchFilter === "hq" && !s.branchId) ||
      s.branchId === staffBranchFilter;
    return matchQ && matchRole && matchBranch;
  });

  // Conversion keys configured in top calculator widget
  return (
    <div className="bc-admin h-screen overflow-hidden bg-[#F5EFE0] text-[#221C1A] flex flex-col lg:flex-row relative">
      {/* Mobile Backdrop Overlay */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity animate-in fade-in duration-200"
          aria-hidden="true"
        />
      )}

      {/* ===================== SIDEBAR NAVIGATION ===================== */}
      {/* Fixed drawer sliding from left on mobile, permanent left sidebar on desktop */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 lg:w-64 h-full bg-[#FAF7F4] text-[#1E1815] flex-shrink-0 flex flex-col border-r border-[#EAE3DC] shadow-xl lg:shadow-none transition-transform duration-300 ease-in-out ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
      >
        {/* Brand Header */}
        <div className="p-5 flex items-center justify-between border-b border-[#EAE3DC]">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/bc-roundel.png"
              alt="Levante"
              className="w-11 h-11 object-contain shrink-0 drop-shadow-sm"
            />
            <div>
              <div className="font-extrabold text-sm tracking-tight leading-tight text-[#1E1815]">Levante</div>
              <div className="text-[9.5px] text-[#8C7F78] uppercase tracking-widest font-bold mt-0.5">
                Admin Control
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-2 rounded-xl bg-[#EFE9E2] text-[#7A6E67] hover:text-[#1E1815] hover:bg-[#E5DDD4] transition-colors cursor-pointer"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="p-3 space-y-1 flex-1 overflow-y-auto">
          <button
            onClick={() => {
              setTab("overview");
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${tab === "overview"
              ? "bg-[#143F26] text-white shadow-md shadow-[#143F26]/20"
              : "text-[#5C504A] hover:bg-[#EFE9E2] hover:text-[#1E1815]"
              }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => {
              setTab("customers");
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${tab === "customers"
              ? "bg-[#143F26] text-white shadow-md shadow-[#143F26]/20"
              : "text-[#5C504A] hover:bg-[#EFE9E2] hover:text-[#1E1815]"
              }`}
          >
            <Users className="w-4 h-4" />
            <span>Customers</span>
          </button>

          <button
            onClick={() => {
              setTab("offers");
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${tab === "offers"
              ? "bg-[#143F26] text-white shadow-md shadow-[#143F26]/20"
              : "text-[#5C504A] hover:bg-[#EFE9E2] hover:text-[#1E1815]"
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
              ? "bg-[#143F26] text-white shadow-md shadow-[#143F26]/20"
              : "text-[#5C504A] hover:bg-[#EFE9E2] hover:text-[#1E1815]"
              }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Branches</span>
          </button>

          <button
            onClick={() => {
              setTab("staff");
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${tab === "staff"
              ? "bg-[#143F26] text-white shadow-md shadow-[#143F26]/20"
              : "text-[#5C504A] hover:bg-[#EFE9E2] hover:text-[#1E1815]"
              }`}
          >
            <Store className="w-4 h-4" />
            <span>Staff</span>
          </button>

          <button
            onClick={() => {
              setTab("visits");
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${tab === "visits"
              ? "bg-[#143F26] text-white shadow-md shadow-[#143F26]/20"
              : "text-[#5C504A] hover:bg-[#EFE9E2] hover:text-[#1E1815]"
              }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Branch visitors</span>
          </button>

          <button
            onClick={() => {
              setTab("outlet");
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${tab === "outlet"
              ? "bg-[#143F26] text-white shadow-md shadow-[#143F26]/20"
              : "text-[#5C504A] hover:bg-[#EFE9E2] hover:text-[#1E1815]"
              }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Outlet POS Terminal</span>
          </button>

          <button
            onClick={() => {
              setTab("settings");
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${tab === "settings"
              ? "bg-[#143F26] text-white shadow-md shadow-[#143F26]/20"
              : "text-[#5C504A] hover:bg-[#EFE9E2] hover:text-[#1E1815]"
              }`}
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>

          <button
            onClick={() => {
              setTab("audit");
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${tab === "audit"
              ? "bg-[#143F26] text-white shadow-md shadow-[#143F26]/20"
              : "text-[#5C504A] hover:bg-[#EFE9E2] hover:text-[#1E1815]"
              }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Security & Audit</span>
          </button>
        </div>

        {/* User Card & Sign Out */}
        <div className="p-4 border-t border-[#EAE3DC] bg-[#FAF7F4]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#0E331E]/10 border border-[#0E331E]/20 flex items-center justify-center font-bold text-xs text-[#0E331E]">
              {session.name ? session.name.slice(0, 2).toUpperCase() : "AD"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-xs text-[#1E1815] truncate">{session.name}</div>
              <div className="text-[10px] text-[#7A6E67] truncate font-medium">{session.role}</div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-[#7A6E67] hover:text-[#0E331E] hover:bg-[#EFE9E2] transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ===================== MAIN CONTENT AREA ===================== */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto">
        {/* Top Navbar */}
        <header className="bg-white border-b border-[#EAE3DC] px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Hamburger Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-[#FAF7F4] border border-[#EAE3DC] text-[#1E1815] hover:bg-[#F2ECE6] transition-colors cursor-pointer shrink-0"
              aria-label="Open sidebar navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-black tracking-tight text-[#1E1815] capitalize flex items-center gap-2 truncate">
                {tab === "overview" && (
                  overviewBranchFilter !== "all" && allBranches.find((b: any) => b.id === overviewBranchFilter)
                    ? `${allBranches.find((b: any) => b.id === overviewBranchFilter)?.name} Overview`
                    : "Executive Overview"
                )}
                {tab === "customers" && "Member Directory"}
                {tab === "offers" && "Promotions & Campaign Engine"}
                {tab === "branches" && "Branch Management"}
                {tab === "staff" && "Staff POS Accounts & Tills"}
                {tab === "visits" && "Branch Visitors"}
                {tab === "outlet" && "Outlet Cashier POS Terminal"}
                {tab === "settings" && "System & Loyalty Points Engine"}
                {tab === "audit" && "Security & Activity Audit Log"}
              </h1>
              <p className="text-[11px] sm:text-xs text-[#7A6E67] mt-0.5 truncate">
                {tab === "overview" && overviewBranchFilter !== "all" && allBranches.find((b: any) => b.id === overviewBranchFilter)
                  ? `${allBranches.find((b: any) => b.id === overviewBranchFilter)?.name} (${allBranches.find((b: any) => b.id === overviewBranchFilter)?.city || "UAE"}) • Live sync active`
                  : session.branchName
                    ? `${session.branchName} • Live sync active`
                    : "All Locations • Live sync active"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {tab === "branches" && (
              <button
                onClick={() => {
                  const initialCode = generateRandomCouponCode("1015");
                  setBranchForm({
                    code: "",
                    name: "",
                    nameAr: "",
                    city: "Dubai",
                    address: "",
                    addressAr: "",
                    phone: "",
                    hours: "10:00 AM – 11:00 PM",
                    crmUrl: "",
                    isActive: true,
                    dailyCode: initialCode,
                    dailyCodeExpiresAt: "",
                  });
                  setBranchMsg(null);
                  setShowCreateBranchModal(true);
                }}
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#143F26] to-[#0A2617] hover:from-[#143F26] text-white font-bold text-xs shadow-md shadow-[#143F26]/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Branch</span>
              </button>
            )}

            {tab === "offers" && (
              <button
                onClick={() => {
                  setNewOffer({
                    name: "",
                    description: "",
                    value: "",
                    isPercent: true,
                    branchIds: [],
                    startsAt: "",
                    endsAt: "",
                    imageUrl: "",
                    bannerText: "",
                  });
                  setCompressedImgStats(null);
                  setOfferMsg(null);
                  setShowCreateOfferModal(true);
                }}
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#143F26] to-[#0A2617] hover:from-[#143F26] text-white font-bold text-xs shadow-md shadow-[#143F26]/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>New Campaign</span>
              </button>
            )}

            {/* Customer Portal Link */}
            <Link
              href="/crm"
              className="flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl border border-[#DCD3CB] bg-white hover:bg-[#FAF7F4] text-xs font-bold text-[#0E331E] shadow-2xs transition-all cursor-pointer"
              title="Open Customer Portal"
            >
              <Users className="w-3.5 h-3.5 text-[#0E331E]" />
              <span className="hidden sm:inline">Customer Portal</span>
            </Link>

            <AdminNotificationBell />

            <button
              onClick={() => {
                loadOverview();
                if (tab === "customers") loadCustomers();
                if (tab === "audit") loadAudit();
                if (tab === "offers") loadOffers();
                if (tab === "branches") loadBranches();
                if (tab === "settings") {
                  loadSettings();
                  loadVisitRewards();
                  loadBirthdayRewards();
                  loadEmailSettings();
                  loadEmailLogs();
                }
              }}
              disabled={refreshing}
              className="flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl border border-[#DCD3CB] bg-white hover:bg-[#FAF7F4] text-xs font-bold text-[#4A3F39] shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-[#143F26]" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </header>

        {/* Global Error Banner */}
        {err && (
          <div className="mx-4 sm:mx-6 mt-4 p-3.5 sm:p-4 bg-[#143F26]/10 border border-[#143F26]/30 rounded-2xl text-xs font-semibold text-[#143F26] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{err}</span>
            </div>
            <button onClick={() => setErr("")} className="hover:opacity-75">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="p-3.5 sm:p-6 lg:p-8 pb-28 lg:pb-8 space-y-4 sm:space-y-6">
          {/* ============================================================== */}
          {/* TAB 1: OVERVIEW & KPIS                                          */}
          {/* ============================================================== */}
          {tab === "overview" && (
            <OverviewTab
              handleOpenStoreCrm={handleOpenStoreCrm}
              data={data}
              allBranches={allBranches}
              overviewBranchFilter={overviewBranchFilter}
              setOverviewBranchFilter={setOverviewBranchFilter}
              overviewDateFilter={overviewDateFilter}
              setOverviewDateFilter={setOverviewDateFilter}
              setTab={setTab}
              cur={cur}
            />
          )}

          {/* ============================================================== */}
          {/* TAB 2: MEMBER DIRECTORY (CUSTOMERS)                            */}
          {/* ============================================================== */}
          {tab === "customers" && (
            <CustomersTab
              cust={cust}
              q={q}
              setQ={setQ}
              filter={filter}
              setFilter={setFilter}
              openCustomerDetail={openCustomerDetail}
              cur={cur}
            />
          )}

          {/* ============================================================== */}
          {/* TAB 3: PROMOTIONS & OFFERS                                     */}
          {/* ============================================================== */}
          {tab === "offers" && (
            <OffersTab
              offers={offers}
              offerMsg={offerMsg}
              setOfferMsg={setOfferMsg}
              offerSearch={offerSearch}
              setOfferSearch={setOfferSearch}
              offerBranchFilter={offerBranchFilter}
              setOfferBranchFilter={setOfferBranchFilter}
              offerStatusFilter={offerStatusFilter}
              setOfferStatusFilter={setOfferStatusFilter}
              setShowCreateOfferModal={setShowCreateOfferModal}
              setNewOffer={setNewOffer}
              setCompressedImgStats={setCompressedImgStats}
              openEditOffer={openEditOffer}
              toggleOffer={toggleOffer}
              deleteOffer={deleteOffer}
              allBranches={allBranches}
              cur={cur}
            />
          )}

          {/* ============================================================== */}
          {/* TAB 4: BRANCH OUTLETS & CRUD                                   */}
          {/* ============================================================== */}
          {tab === "branches" && (
            <BranchesTab
              cur={cur}
              branchMsg={branchMsg}
              setBranchMsg={setBranchMsg}
              allBranches={allBranches}
              branchSearch={branchSearch}
              setBranchSearch={setBranchSearch}
              branchCityFilter={branchCityFilter}
              setBranchCityFilter={setBranchCityFilter}
              setShowCreateBranchModal={setShowCreateBranchModal}
              setBranchForm={setBranchForm}
              rotatingBranchId={rotatingBranchId}
              copiedCode={copiedCode}
              handleOpenStoreCrm={handleOpenStoreCrm}
              copyToClipboard={copyToClipboard}
              handleRotateBranchCode={handleRotateBranchCode}
              handleToggleBranch={handleToggleBranch}
              openEditBranch={openEditBranch}
              openDeleteBranch={openDeleteBranch}
              data={data}
            />
          )}

          {/* ============================================================== */}
          {/* TAB 5: STAFF & POS TILL ACCOUNTS                               */}
          {/* ============================================================== */}
          {tab === "staff" && (
            <StaffTab
              handleToggleStaff={handleToggleStaff}
              staffMsg={staffMsg}
              setStaffMsg={setStaffMsg}
              staffData={staffData}
              staffSearch={staffSearch}
              setStaffSearch={setStaffSearch}
              staffRoleFilter={staffRoleFilter}
              setStaffRoleFilter={setStaffRoleFilter}
              staffBranchFilter={staffBranchFilter}
              setStaffBranchFilter={setStaffBranchFilter}
              allBranches={allBranches}
              setShowCreateStaffModal={setShowCreateStaffModal}
              setStaffForm={setStaffForm}
              openEditStaff={openEditStaff}
              openDeleteStaff={openDeleteStaff}
              data={data}
            />
          )}

          {/* ============================================================== */}
          {/* TAB: BRANCH VISITS & 24-HOUR DAILY COUPON PASSCODES            */}
          {/* ============================================================== */}
          {tab === "visits" && (
            <VisitsTab
              visitsData={visitsData}
              visitMetrics={visitMetrics}
              visitSearch={visitSearch}
              setVisitSearch={setVisitSearch}
              visitBranchFilter={visitBranchFilter}
              setVisitBranchFilter={setVisitBranchFilter}
              visitDateFilter={visitDateFilter}
              setVisitDateFilter={setVisitDateFilter}
              visitMsg={visitMsg}
              setVisitMsg={setVisitMsg}
              allBranches={allBranches}
            />
          )}

          {/* ============================================================== */}
          {/* TAB: OUTLET POS / CASHIER TERMINAL                             */}
          {/* ============================================================== */}
          {tab === "outlet" && (
            <OutletTab
              loadVisits={loadVisits}
              allBranches={allBranches}
              branchesData={branchesData}
              data={data}
              loadOverview={loadOverview}
              cur={cur}
            />
          )}

          {/* ============================================================== */}
          {/* TAB 6: PROGRAM SETTINGS & CONVERSION CALCULATOR                */}
          {/* ============================================================== */}
          {tab === "settings" && (
            <SettingsTab
              settingsList={settingsList}
              loadEmailSettings={loadEmailSettings}
              loadEmailLogs={loadEmailLogs}
              loadEmailTemplates={loadEmailTemplates}
              settingsCategory={settingsCategory}
              setSettingsCategory={setSettingsCategory}
              settingsForm={settingsForm}
              setSettingsForm={setSettingsForm}
              settingsSaving={settingsSaving}
              settingsMsg={settingsMsg}
              setSettingsMsg={setSettingsMsg}
              handleSaveSettings={handleSaveSettings}
              aiTesting={aiTesting}
              aiTestResult={aiTestResult}
              testProvider={testProvider}
              setTestProvider={setTestProvider}
              handleTestAi={handleTestAi}
              pinForm={pinForm}
              setPinForm={setPinForm}
              showCurrPin={showCurrPin}
              setShowCurrPin={setShowCurrPin}
              showNewPin={showNewPin}
              setShowNewPin={setShowNewPin}
              showConfirmPin={showConfirmPin}
              setShowConfirmPin={setShowConfirmPin}
              pinSaving={pinSaving}
              pinMsg={pinMsg}
              setPinMsg={setPinMsg}
              handleUpdatePin={handleUpdatePin}
              simBillAmount={simBillAmount}
              setSimBillAmount={setSimBillAmount}
              simPointsBalance={simPointsBalance}
              setSimPointsBalance={setSimPointsBalance}
              visitRewardsList={visitRewardsList}
              visitRewardMsg={visitRewardMsg}
              setVisitRewardMsg={setVisitRewardMsg}
              handleToggleVisitReward={handleToggleVisitReward}
              openCreateVisitReward={openCreateVisitReward}
              openEditVisitReward={openEditVisitReward}
              openDeleteVisitReward={openDeleteVisitReward}
              birthdayRewardsList={birthdayRewardsList}
              upcomingCelebrants={upcomingCelebrants}
              birthdayRewardMsg={birthdayRewardMsg}
              setBirthdayRewardMsg={setBirthdayRewardMsg}
              dispatchingBirthdayId={dispatchingBirthdayId}
              handleToggleBirthdayReward={handleToggleBirthdayReward}
              openCreateBirthdayReward={openCreateBirthdayReward}
              openEditBirthdayReward={openEditBirthdayReward}
              openDeleteBirthdayReward={openDeleteBirthdayReward}
              handleGrantBirthdayTreat={handleGrantBirthdayTreat}
              handleDispatchAllBirthdayTreats={handleDispatchAllBirthdayTreats}
              emailSubTab={emailSubTab}
              setEmailSubTab={setEmailSubTab}
              smtpForm={smtpForm}
              setSmtpForm={setSmtpForm}
              smtpTestRecipient={smtpTestRecipient}
              setSmtpTestRecipient={setSmtpTestRecipient}
              smtpTesting={smtpTesting}
              smtpSaving={smtpSaving}
              smtpMsg={smtpMsg}
              setSmtpMsg={setSmtpMsg}
              handleSaveSmtpSettings={handleSaveSmtpSettings}
              handleTestSmtpConnection={handleTestSmtpConnection}
              campaignForm={campaignForm}
              setCampaignForm={setCampaignForm}
              campaignSending={campaignSending}
              campaignMsg={campaignMsg}
              setCampaignMsg={setCampaignMsg}
              handleSendCampaignEmail={handleSendCampaignEmail}
              emailLogs={emailLogs}
              emailStats={emailStats}
              loadingEmailLogs={loadingEmailLogs}
              emailTemplates={emailTemplates}
              loadingEmailTemplates={loadingEmailTemplates}
              setShowCreateTemplateModal={setShowCreateTemplateModal}
              setShowEditTemplateModal={setShowEditTemplateModal}
              setTemplateForm={setTemplateForm}
              templateMsg={templateMsg}
              setTemplateMsg={setTemplateMsg}
              openEmailPreview={openEmailPreview}
              handleSetDefaultTemplate={handleSetDefaultTemplate}
              handleDeleteEmailTemplate={handleDeleteEmailTemplate}
              allBranches={allBranches}
              data={data}
              cur={cur}
            />
          )}

          {/* ============================================================== */}
          {/* TAB 7: SECURITY & AUDIT LOG                                    */}
          {/* ============================================================== */}
          {tab === "audit" && (() => {
            const rawLogs: any[] = audit?.logs || audit?.entries || [];
            const filteredLogs = rawLogs.filter((l: any) => {
              if (auditSearch.trim()) {
                const s = auditSearch.toLowerCase();
                const matchAction = l.action?.toLowerCase().includes(s);
                const matchStaff =
                  (typeof l.staff === "string" ? l.staff : l.staff?.name)?.toLowerCase().includes(s) ||
                  l.staffUsername?.toLowerCase().includes(s);
                const matchReason = l.reason?.toLowerCase().includes(s);
                const matchEntity = l.entityType?.toLowerCase().includes(s) || l.entityId?.toLowerCase().includes(s);
                const matchMeta = l.metadata ? JSON.stringify(l.metadata).toLowerCase().includes(s) : false;
                if (!matchAction && !matchStaff && !matchReason && !matchEntity && !matchMeta) return false;
              }
              return true;
            });

            return (
              <div className="space-y-4 sm:space-y-6">
                {/* Top Audit KPI & Summary Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="bg-white border border-[#EAE3DC] rounded-2xl p-4 shadow-2xs">
                    <div className="flex items-center justify-between text-[#7A6E67] text-xs font-bold uppercase tracking-wider">
                      <span>Total Audit Records</span>
                      <ShieldCheck className="w-4 h-4 text-[#0E331E]" />
                    </div>
                    <div className="text-2xl font-black text-[#1E1815] mt-1.5">
                      {audit?.total ?? rawLogs.length}
                    </div>
                    <div className="text-[11px] font-semibold text-[#1E7A4D] mt-0.5 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Immutable Cryptographic Trail</span>
                    </div>
                  </div>

                  <div className="bg-white border border-[#EAE3DC] rounded-2xl p-4 shadow-2xs">
                    <div className="flex items-center justify-between text-[#7A6E67] text-xs font-bold uppercase tracking-wider">
                      <span>Fraud &amp; Duplicates Blocked</span>
                      <AlertTriangle className="w-4 h-4 text-[#143F26]" />
                    </div>
                    <div className="text-2xl font-black text-[#143F26] mt-1.5">
                      {audit?.duplicatesBlocked ?? 0}
                    </div>
                    <div className="text-[11px] font-semibold text-[#7A6E67] mt-0.5">
                      Automatic Anti-Fraud Protection
                    </div>
                  </div>

                  <div className="bg-white border border-[#EAE3DC] rounded-2xl p-4 shadow-2xs">
                    <div className="flex items-center justify-between text-[#7A6E67] text-xs font-bold uppercase tracking-wider">
                      <span>Ledger Status</span>
                      <Lock className="w-4 h-4 text-[#1E7A4D]" />
                    </div>
                    <div className="text-sm font-black text-[#1E7A4D] mt-2 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#1E7A4D] animate-ping" />
                      <span>Live Audit Sync Active</span>
                    </div>
                    <div className="text-[11px] font-semibold text-[#7A6E67] mt-0.5">
                      All Manager &amp; Till Operations
                    </div>
                  </div>
                </div>

                {/* Audit Toolbar & Filter Header */}
                <div className="bg-white border border-[#EAE3DC] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <ShieldCheck className="w-5 h-5 text-[#0E331E] shrink-0" />
                        <h2 className="font-extrabold text-base text-[#1E1815]">Security Audit Log</h2>
                        <span className="px-2.5 py-0.5 rounded-full bg-[#0E331E]/10 text-[#0E331E] text-xs font-bold">
                          {filteredLogs.length} Events Loaded
                        </span>
                      </div>
                      <p className="text-xs text-[#7A6E67] mt-0.5">
                        Immutable audit trail of management logins, coupon rotations, staff changes, rewards, and system settings.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => loadAudit()}
                        disabled={loadingAudit}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#DCD3CB] bg-[#FAF7F4] hover:bg-white text-xs font-bold text-[#1E1815] transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${loadingAudit ? "animate-spin text-[#143F26]" : ""}`} />
                        <span>Refresh Logs</span>
                      </button>
                    </div>
                  </div>

                  {/* Filter Toolbar Controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 pt-3 border-t border-[#EAE3DC]">
                    {/* Search Input */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A6E67]" />
                      <input
                        type="text"
                        placeholder="Search logs by staff name, username, action, reason, entity…"
                        value={auditSearch}
                        onChange={(e) => setAuditSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 text-xs bg-[#FAF7F4] border border-[#DCD3CB] rounded-xl text-[#1E1815] placeholder-[#8C7F78] focus:outline-none focus:border-[#143F26]"
                      />
                    </div>

                    {/* Action Category Filter */}
                    <div>
                      <select
                        value={auditActionFilter}
                        onChange={(e) => setAuditActionFilter(e.target.value)}
                        className="w-full px-3 py-2.5 text-xs bg-[#FAF7F4] border border-[#DCD3CB] rounded-xl text-[#1E1815] font-semibold focus:outline-none focus:border-[#143F26] cursor-pointer"
                      >
                        <option value="all"> All Audit Action Categories</option>
                        <option value="login"> Sign-In &amp; Logins (admin, customer, staff)</option>
                        <option value="customer"> Members &amp; Accounts (customer.*)</option>
                        <option value="staff"> Staff &amp; POS Tills (staff.*)</option>
                        <option value="pin"> Master Security PIN (pin.*, staff.pin_*)</option>
                        <option value="branch"> Branch Locations &amp; Coupons (branch.*)</option>
                        <option value="offer"> Promotions &amp; Campaigns (offer.*)</option>
                        <option value="settings"> System &amp; Points Engine (settings.*)</option>
                        <option value="visit-reward"> Visit Milestones &amp; Perks (visit-reward.*)</option>
                        <option value="transaction"> Transactions &amp; Receipts (transaction.*)</option>
                        <option value="blocked"> Fraud &amp; Duplicates Blocked</option>
                      </select>
                    </div>
                  </div>

                  {/* Audit Event List */}
                  <div className="divide-y divide-[#EFE8E1] pt-2">
                    {filteredLogs.length > 0 ? (
                      filteredLogs.map((l: any) => {
                        const isCustomerEvent = l.action?.startsWith("customer.");
                        const isAdminLogin = l.action === "admin.login";
                        const isStaffLogin = l.action === "staff.login";
                        const isCustomerLogin = l.action === "customer.login";
                        const isCustomerRegister = l.action === "customer.register";
                        const isPinEvent = l.action?.includes("pin");

                        // Resolve Customer Name for customer events or entity
                        const resolvedCustomerName =
                          l.entityName ||
                          l.metadata?.customer ||
                          l.metadata?.name ||
                          (l.metadata?.mobile ? `+${l.metadata.mobile}` : null);

                        const staffDisplayName = isCustomerEvent
                          ? (resolvedCustomerName || (typeof l.staff === "string" && l.staff !== "System Admin" ? l.staff : "Customer Member"))
                          : (typeof l.staff === "string" ? l.staff : l.staff?.name || "System Admin");

                        const isDanger =
                          l.action?.includes("delete") ||
                          l.action?.includes("block") ||
                          l.action?.includes("fraud") ||
                          l.action?.includes("deactivate");
                        const isSuccess =
                          l.action?.includes("create") ||
                          l.action?.includes("active") ||
                          l.action?.includes("unlock") ||
                          l.action?.includes("stamp") ||
                          isCustomerRegister;
                        const isWarning =
                          l.action?.includes("rotate") ||
                          isPinEvent ||
                          l.action?.includes("pause");

                        // Dynamic badge styles and label
                        let badgeClass = "bg-[#0E331E]/10 text-[#0E331E] border-[#0E331E]/20";
                        let badgeIcon = null;

                        if (isAdminLogin) {
                          badgeClass = "bg-purple-100 text-purple-900 border-purple-300";
                          badgeIcon = <LogIn className="w-3 h-3" />;
                        } else if (isStaffLogin) {
                          badgeClass = "bg-blue-100 text-blue-900 border-blue-300";
                          badgeIcon = <Laptop className="w-3 h-3" />;
                        } else if (isCustomerLogin) {
                          badgeClass = "bg-emerald-100 text-emerald-900 border-emerald-300";
                          badgeIcon = <Smartphone className="w-3 h-3" />;
                        } else if (isCustomerRegister) {
                          badgeClass = "bg-teal-100 text-teal-900 border-teal-300";
                          badgeIcon = <Sparkles className="w-3 h-3" />;
                        } else if (isPinEvent) {
                          badgeClass = "bg-amber-100 text-amber-900 border-amber-300";
                          badgeIcon = <Key className="w-3 h-3" />;
                        } else if (isDanger) {
                          badgeClass = "bg-[#143F26]/10 text-[#143F26] border-[#143F26]/20";
                        } else if (isSuccess) {
                          badgeClass = "bg-[#1E7A4D]/10 text-[#1E7A4D] border-[#1E7A4D]/20";
                        } else if (isWarning) {
                          badgeClass = "bg-[#C68A1E]/10 text-[#9E690B] border-[#C68A1E]/20";
                        }

                        // Helper to format metadata key names
                        const formatMetaKey = (k: string) => {
                          const map: Record<string, string> = {
                            branchId: "Branch",
                            branch: "Branch",
                            branchName: "Branch",
                            homeBranchId: "Home Outlet",
                            homeBranch: "Home Outlet",
                            mobile: "Mobile",
                            name: "Customer Name",
                            customer: "Customer",
                            customerId: "Customer",
                            role: "Role",
                            username: "Username",
                            welcomeBonusPoints: "Welcome Bonus",
                            welcomeDiscountPercent: "Welcome Voucher",
                            pointsBalance: "Points",
                            visitCount: "Visits",
                            totalSpend: "Total Spend",
                            ip: "IP",
                            userAgent: "Device",
                            delta: "Points Change",
                          };
                          return map[k] || k.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
                        };

                        // Helper to format metadata values
                        const formatMetaVal = (k: string, v: any) => {
                          if (v === null || v === undefined) return "";
                          if (typeof v === "object") return JSON.stringify(v);
                          const str = String(v);

                          if (k.toLowerCase().includes("branch") || k === "branchId") {
                            const foundB = allBranches.find((br: any) => br.id === str || br.code === str);
                            if (foundB) return `${foundB.name} (${foundB.city || foundB.code})`;
                          }

                          if (k === "mobile") {
                            const clean = str.replace(/\D/g, "");
                            if (clean.startsWith("971") && clean.length === 12) {
                              return `+971 ${clean.slice(3, 5)} ${clean.slice(5, 8)} ${clean.slice(8)}`;
                            }
                            return `+${str.replace(/^\+/, "")}`;
                          }

                          if (k === "welcomeBonusPoints" || k === "pointsBalance" || k === "delta") {
                            return `${str} Pts`;
                          }
                          if (k === "welcomeDiscountPercent") {
                            return `${str}% Off`;
                          }

                          return str;
                        };

                        // Resolved entity label
                        let entityBadge = null;
                        if (l.entityType) {
                          let entityLabel = l.entityType;
                          let entityVal = l.entityName;

                          if (!entityVal && l.entityType.toLowerCase() === "customer") {
                            entityVal = resolvedCustomerName;
                          } else if (!entityVal && l.entityType.toLowerCase() === "branch" && l.entityId) {
                            const foundB = allBranches.find((b: any) => b.id === l.entityId || b.code === l.entityId);
                            entityVal = foundB ? foundB.name : null;
                          }

                          entityBadge = (
                            <span className="px-2.5 py-0.5 rounded-full bg-[#FAF7F4] border border-[#EAE3DC] text-[10px] text-[#7A6E67] font-semibold flex items-center gap-1">
                              <span>{entityLabel}:</span>
                              <strong className="text-[#1E1815] font-bold">
                                {entityVal || `#${String(l.entityId || "").slice(-6)}`}
                              </strong>
                            </span>
                          );
                        }

                        return (
                          <div
                            key={l.id}
                            className="py-3.5 hover:bg-[#FAF7F4]/80 p-3 rounded-2xl transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 sm:gap-4 border border-transparent hover:border-[#EAE3DC]"
                          >
                            <div className="min-w-0 space-y-1.5 flex-1">
                              {/* Top Action & Staff Header */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-[11px] font-black uppercase tracking-wide border shadow-2xs ${badgeClass}`}
                                >
                                  {badgeIcon}
                                  <span>{l.action}</span>
                                </span>

                                <div className="flex items-center gap-1.5 text-xs text-[#1E1815] font-bold">
                                  <span className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center shrink-0 ${
                                    isCustomerEvent ? "bg-emerald-100 text-emerald-800" : "bg-[#EAE3DC] text-[#4A3F39]"
                                  }`}>
                                    {staffDisplayName.charAt(0).toUpperCase()}
                                  </span>
                                  <span>{staffDisplayName}</span>
                                  {l.staffUsername && (
                                    <span className="text-[10px] text-[#7A6E67] font-mono">
                                      (@{l.staffUsername})
                                    </span>
                                  )}
                                  {isCustomerEvent && l.metadata?.mobile && (
                                    <span className="text-[10px] text-emerald-700 font-mono bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                      +{String(l.metadata.mobile).replace(/^\+/, "")}
                                    </span>
                                  )}
                                </div>

                                {entityBadge}
                              </div>

                              {/* Reason note */}
                              {l.reason && (
                                <div className={`text-[11px] font-semibold flex items-center gap-1.5 ${
                                  isDanger ? "text-[#143F26]" : isCustomerEvent ? "text-emerald-800" : "text-[#4A3F39]"
                                }`}>
                                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 opacity-70" />
                                  <span>{l.reason}</span>
                                </div>
                              )}

                              {/* Metadata breakdown */}
                              {l.metadata && Object.keys(l.metadata).length > 0 && (
                                <div className="bg-[#FAF7F4] p-2 sm:p-2.5 rounded-xl border border-[#EAE3DC] text-[11px] font-mono text-[#4A3F39] max-w-2xl overflow-x-auto custom-scrollbar">
                                  {typeof l.metadata === "object" ? (
                                    <div className="flex flex-wrap gap-x-3.5 gap-y-1.5">
                                      {Object.entries(l.metadata).map(([k, v]) => {
                                        if (v === null || v === undefined || v === "") return null;
                                        return (
                                          <div key={k} className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-[#EFE8E1]">
                                            <span className="text-[#7A6E67] font-bold text-[10px] uppercase">{formatMetaKey(k)}:</span>
                                            <span className="font-semibold text-[#1E1815]">
                                              {formatMetaVal(k, v)}
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <span>{String(l.metadata)}</span>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Timestamp & ID */}
                            <div className="text-left sm:text-right shrink-0 pt-1 sm:pt-0">
                              <div className="text-xs font-bold text-[#1E1815]">
                                {formatRelativeTime(l.createdAt)}
                              </div>
                              <div className="text-[10px] text-[#7A6E67] font-mono mt-0.5">
                                {new Date(l.createdAt).toLocaleString([], {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-12 bg-[#FAF7F4] rounded-2xl border border-[#EAE3DC] p-6 mt-3">
                        <ShieldCheck className="w-10 h-10 text-[#0E331E]/30 mx-auto mb-2" />
                        <h4 className="font-extrabold text-sm text-[#1E1815]">No Audit Events Found</h4>
                        <p className="text-xs text-[#7A6E67] max-w-md mx-auto mt-1 mb-4">
                          {auditSearch || auditActionFilter !== "all"
                            ? "No audit events match your search query or action filter. Try resetting filters."
                            : "No management security events have been logged yet."}
                        </p>
                        {(auditSearch || auditActionFilter !== "all") && (
                          <button
                            type="button"
                            onClick={() => {
                              setAuditSearch("");
                              setAuditActionFilter("all");
                            }}
                            className="px-4 py-2 rounded-xl bg-white border border-[#EAE3DC] text-xs font-bold text-[#1E1815] hover:bg-[#FAF7F4] cursor-pointer shadow-2xs"
                          >
                            Reset Filters
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </main>

      {/* Bottom tab bar on phones, like the other Levante dashboard */}
      <nav className="bc-tabbar lg:hidden" aria-label="Primary">
        {(
          [
            ["overview", "Home", LayoutDashboard],
            ["customers", "Members", Users],
            ["offers", "Offers", Tag],
            ["branches", "Branches", Building2],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            aria-current={tab === id ? "page" : undefined}
            className={tab === id ? "bc-tab bc-tab-on" : "bc-tab"}
          >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
          </button>
        ))}
        <button type="button" onClick={() => setMobileMenuOpen(true)} className="bc-tab" aria-label="More sections">
          <Menu className="w-5 h-5" />
          <span>More</span>
        </button>
      </nav>

      {/* ============================================================== */}
      {/* ============================================================== */}
            <BranchModals
        showCreateBranchModal={showCreateBranchModal}
        setShowCreateBranchModal={setShowCreateBranchModal}
        showEditBranchModal={showEditBranchModal}
        setShowEditBranchModal={setShowEditBranchModal}
        showDeleteBranchModal={showDeleteBranchModal}
        setShowDeleteBranchModal={setShowDeleteBranchModal}
        branchToDelete={branchToDelete}
        setBranchToDelete={setBranchToDelete}
        showComingSoonModal={showComingSoonModal}
        setShowComingSoonModal={setShowComingSoonModal}
        comingSoonBranch={comingSoonBranch}
        setComingSoonBranch={setComingSoonBranch}
        branchForm={branchForm}
        setBranchForm={setBranchForm}
        branchMsg={branchMsg}
        busy={busy}
        handleCreateBranch={handleCreateBranch}
        handleUpdateBranch={handleUpdateBranch}
        handleDeleteBranch={handleDeleteBranch}
        branchesData={branchesData}
        data={data}
        openEditBranch={openEditBranch}
      />

            <OfferModals
        allBranches={allBranches}
        showCreateOfferModal={showCreateOfferModal}
        setShowCreateOfferModal={setShowCreateOfferModal}
        newOffer={newOffer}
        setNewOffer={setNewOffer}
        compressingOfferImg={compressingOfferImg}
        compressedImgStats={compressedImgStats}
        setCompressedImgStats={setCompressedImgStats}
        handleOfferImageFile={handleOfferImageFile}
        createOffer={createOffer}
        showEditOfferModal={showEditOfferModal}
        setShowEditOfferModal={setShowEditOfferModal}
        editOfferForm={editOfferForm}
        setEditOfferForm={setEditOfferForm}
        compressingEditOfferImg={compressingEditOfferImg}
        compressedEditImgStats={compressedEditImgStats}
        setCompressedEditImgStats={setCompressedEditImgStats}
        handleEditOfferImageFile={handleEditOfferImageFile}
        updateOffer={updateOffer}
        offerMsg={offerMsg}
        busy={busy}
        cur={cur}
      />

      <StaffModals
        showCreateStaffModal={showCreateStaffModal}
        setShowCreateStaffModal={setShowCreateStaffModal}
        showEditStaffModal={showEditStaffModal}
        setShowEditStaffModal={setShowEditStaffModal}
        showDeleteStaffModal={showDeleteStaffModal}
        setShowDeleteStaffModal={setShowDeleteStaffModal}
        staffToDelete={staffToDelete}
        setStaffToDelete={setStaffToDelete}
        showStaffPin={showStaffPin}
        setShowStaffPin={setShowStaffPin}
        showEditStaffPin={showEditStaffPin}
        setShowEditStaffPin={setShowEditStaffPin}
        staffForm={staffForm}
        setStaffForm={setStaffForm}
        staffMsg={staffMsg}
        allBranches={allBranches}
        busy={busy}
        handleCreateStaff={handleCreateStaff}
        handleUpdateStaff={handleUpdateStaff}
        handleDeleteStaff={handleDeleteStaff}
      />

            <RewardModals
        busy={busy}
        showVisitRewardModal={showVisitRewardModal}
        setShowVisitRewardModal={setShowVisitRewardModal}
        showDeleteVisitRewardModal={showDeleteVisitRewardModal}
        setShowDeleteVisitRewardModal={setShowDeleteVisitRewardModal}
        visitRewardToDelete={visitRewardToDelete}
        setVisitRewardToDelete={setVisitRewardToDelete}
        editingVisitRewardId={editingVisitRewardId}
        visitRewardForm={visitRewardForm}
        setVisitRewardForm={setVisitRewardForm}
        visitRewardSaving={visitRewardSaving}
        showBirthdayRewardModal={showBirthdayRewardModal}
        setShowBirthdayRewardModal={setShowBirthdayRewardModal}
        showDeleteBirthdayRewardModal={showDeleteBirthdayRewardModal}
        setShowDeleteBirthdayRewardModal={setShowDeleteBirthdayRewardModal}
        birthdayRewardToDelete={birthdayRewardToDelete}
        setBirthdayRewardToDelete={setBirthdayRewardToDelete}
        editingBirthdayRewardId={editingBirthdayRewardId}
        birthdayRewardForm={birthdayRewardForm}
        setBirthdayRewardForm={setBirthdayRewardForm}
        birthdayRewardSaving={birthdayRewardSaving}
        handleSaveVisitReward={handleSaveVisitReward}
        handleDeleteVisitReward={handleDeleteVisitReward}
        handleSaveBirthdayReward={handleSaveBirthdayReward}
        handleDeleteBirthdayReward={handleDeleteBirthdayReward}
        cur={cur}
      />

            <CustomerDetailModal
        selectedCustomerId={selectedCustomerId}
        setSelectedCustomerId={setSelectedCustomerId}
        selectedCustomerData={selectedCustomerData}
        setSelectedCustomerData={setSelectedCustomerData}
        loadingCustomerDetail={loadingCustomerDetail}
        customerDetailTab={customerDetailTab}
        setCustomerDetailTab={setCustomerDetailTab}
        customerDetailMsg={customerDetailMsg}
        toggleCustomerBlock={toggleCustomerBlock}
        cur={cur}
      />

      <EmailTemplateModals
        openEmailPreview={openEmailPreview}
        showCreateTemplateModal={showCreateTemplateModal}
        setShowCreateTemplateModal={setShowCreateTemplateModal}
        showEditTemplateModal={showEditTemplateModal}
        setShowEditTemplateModal={setShowEditTemplateModal}
        showEmailPreviewModal={showEmailPreviewModal}
        setShowEmailPreviewModal={setShowEmailPreviewModal}
        previewDeviceMode={previewDeviceMode}
        setPreviewDeviceMode={setPreviewDeviceMode}
        previewEmailData={previewEmailData}
        templateForm={templateForm}
        setTemplateForm={setTemplateForm}
        templateSaving={templateSaving}
        templateMsg={templateMsg}
        handleCreateEmailTemplate={handleCreateEmailTemplate}
        handleUpdateEmailTemplate={handleUpdateEmailTemplate}
      />

            <PortalQrModal
        showPortalQrModal={showPortalQrModal}
        setShowPortalQrModal={setShowPortalQrModal}
        portalQrDataUrl={portalQrDataUrl}
        portalUrl={portalUrl}
        handleSharePortalLink={handleSharePortalLink}
        copiedPortalLink={copiedPortalLink}
      />

    </div>
  );
}
