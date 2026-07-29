import type { ReactElement } from "react";
import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { AuthGuard } from "@/components/AuthGuard";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authenticatedFetch } from "@/lib/authenticatedFetch";
import { APP_NAME } from "@/lib/appMetadata";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, Edit, Plus, Percent } from "lucide-react";
import { CompanyProfileSection } from "@/components/settings/CompanyProfileSection";
import { ShippingRatesSection } from "@/components/settings/ShippingRatesSection";
import { useUsers } from "@/hooks/useUsers";
import { usePresetItems } from "@/hooks/usePresetItems";
import { AppRole, AppUser, InvoicePresetItem } from "@/types/invoice";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ... existing code from RoleBadge ...
function RoleBadge({ role }: { role: AppRole }) {
  if (role === "owner") return <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ">Owner</span>;
  if (role === "admin" || role === "manager") return <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ">Admin</span>;
  return <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium">Sales</span>;
}

// Removed UserRow as Users tab is removed

function SettingsPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const { users, isLoading: loadingUsers, updateUser } = useUsers();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"profile" | "company" | "shipping">("profile");

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await authenticatedFetch("/api/account");
        if (res.ok) {
          // You might have other settings to load in the future here
        }
      } catch (err) {
        console.error("Gagal memuat pengaturan API", err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleUpdateUser = async (id: string, data: Partial<AppUser>) => {
    try {
      if (!updateUser) throw new Error("Fitur belum siap");
      await updateUser(id, data);
      toast({
        title: "Berhasil",
        description: "Data pengguna berhasil diperbarui.",
      });
    } catch (err: any) {
      toast({
        title: "Gagal memperbarui pengguna",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const isEditable = (targetUser: AppUser) => {
    if (!user) return false;
    if (user.id === targetUser.id) return false;
    if (targetUser.role === "owner" && user.role !== "owner") return false;
    if (user.role === "owner") return true;
    if ((user.role === "admin" || user.role === "manager") && targetUser.role === "user") return true;
    return false;
  };

  const canManageRoles = user && (user.role === "owner" || user.role === "admin" || user.role === "manager");
  const canEditCompanyProfile = !!user;

  return (
    <>
      <Head>
        <title>Pengaturan | {APP_NAME}</title>
      </Head>
      <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-8">


        {/* Clean Underline Tabs */}
        <div className="flex border-b border-border">
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
              activeTab === "profile"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Akun Saya
          </button>
          {canEditCompanyProfile && (
            <button
              type="button"
              onClick={() => setActiveTab("company")}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
                activeTab === "company"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Profil Perusahaan
            </button>
          )}
          {canManageRoles && (
            <button
              type="button"
              onClick={() => setActiveTab("shipping")}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
                activeTab === "shipping"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Pengaturan Ongkir
            </button>
          )}
        </div>

        <div className="w-full">
          {activeTab === "profile" && (
            <section className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl bg-card border p-4 sm:p-6 shadow-sm">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xl">
                {user?.email?.charAt(0).toUpperCase() ?? 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Akun Terhubung</p>
                <p className="mt-1 truncate text-xl font-semibold text-foreground">{user?.email}</p>
                <p className="mt-1 text-sm text-muted-foreground capitalize flex items-center gap-1.5">
                  Peran: <RoleBadge role={user?.role as AppRole} />
                </p>
              </div>
              <Button
                variant="ghost"
                className="hover:bg-destructive/10 text-destructive transition-all duration-200 mt-2 sm:mt-0"
                onClick={async () => {
                  await signOut();
                  await router.replace("/login");
                }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Keluar
              </Button>
            </section>
          )}

          {activeTab === "company" && canEditCompanyProfile && (
            <CompanyProfileSection />
          )}



          {activeTab === "shipping" && canManageRoles && (
            <ShippingRatesSection />
          )}

          {canManageRoles && (
            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center justify-between p-4 border bg-white">
                <div>
                  <h3 className="font-bold text-sm text-foreground">Pengguna Sistem</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Kelola akun admin dan tim sales.</p>
                </div>
                <Button asChild size="sm" variant="outline" className="font-bold">
                  <Link href="/tracker/users">Kelola Akun</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

SettingsPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AuthGuard>
      <AppLayout title="Settings">
        {page}
      </AppLayout>
    </AuthGuard>
  );
};

export default SettingsPage;
