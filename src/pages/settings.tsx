import type { ReactElement } from "react";
import { useState, useEffect } from "react";
import Head from "next/head";
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
  if (role === "owner") return <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">Owner</span>;
  if (role === "admin" || role === "manager") return <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">Admin</span>;
  return <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">Sales</span>;
}

function UserRow({
  user,
  currentUser,
  isEditable,
  onRoleChange,
  onCommissionChange,
}: {
  user: AppUser;
  currentUser: any;
  isEditable: boolean;
  onRoleChange: (u: AppUser, role: string) => void;
  onCommissionChange: (u: AppUser, rate: number) => Promise<void>;
}) {
  const [rate, setRate] = useState(user.commission_rate?.toString() || "5000");
  const [saving, setSaving] = useState(false);

  const handleSaveRate = async () => {
    const num = parseInt(rate, 10);
    if (isNaN(num)) return;
    setSaving(true);
    await onCommissionChange(user, num);
    setSaving(false);
  };

  return (
    <tr className="border-b transition-colors hover:bg-muted/30">
      <td className="p-4 align-middle font-medium">{user.email}</td>
      <td className="p-4 align-middle"><RoleBadge role={user.role} /></td>
      <td className="p-4 align-middle">
        <div className="flex items-center gap-2">
          <Input 
            type="number" 
            className="w-24 h-8 text-xs" 
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            disabled={!isEditable || saving}
          />
          {isEditable && rate !== (user.commission_rate?.toString() || "5000") && (
            <Button size="sm" variant="default" className="h-8 text-xs" onClick={handleSaveRate} disabled={saving}>
              Simpan
            </Button>
          )}
        </div>
      </td>
      <td className="p-4 align-middle text-right">
        {isEditable ? (
          <div className="flex justify-end">
            <Select
              defaultValue={user.role === "manager" ? "admin" : user.role}
              onValueChange={(val) => onRoleChange(user, val)}
            >
              <SelectTrigger className="w-[120px] h-9 text-xs transition-colors hover:bg-muted/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currentUser?.role === "owner" && <SelectItem value="owner">Owner</SelectItem>}
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="user">Sales</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ) : (
          <span className="text-muted-foreground text-xs italic px-2 py-1 bg-muted/50 rounded-md">Terkunci</span>
        )}
      </td>
    </tr>
  );
}

function SettingsPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const { users, isLoading: loadingUsers, updateUserRole, updateUserCommissionRate } = useUsers();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"profile" | "company" | "roles">("profile");

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

  const handleRoleChange = async (targetUser: AppUser, newRole: string) => {
    try {
      await updateUserRole(targetUser.id, newRole as AppRole);
      toast({
        title: "Berhasil",
        description: `Peran ${targetUser.email} telah diubah menjadi ${newRole}.`,
      });
    } catch (err: any) {
      toast({
        title: "Gagal mengubah peran",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleCommissionChange = async (targetUser: AppUser, rate: number) => {
    try {
      if (!updateUserCommissionRate) throw new Error("Fitur belum siap");
      await updateUserCommissionRate(targetUser.id, rate);
      toast({
        title: "Berhasil",
        description: `Komisi dasar ${targetUser.email} diubah menjadi Rp ${rate.toLocaleString("id-ID")}/m³`,
      });
    } catch (err: any) {
      toast({
        title: "Gagal mengubah komisi",
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

  return (
    <>
      <Head>
        <title>Settings | {APP_NAME}</title>
      </Head>
      <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Pengaturan</h1>
        </div>

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
          {canManageRoles && (
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
              onClick={() => setActiveTab("roles")}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
                activeTab === "roles"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Manajemen Sales
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

          {activeTab === "company" && canManageRoles && (
            <CompanyProfileSection />
          )}

          {activeTab === "roles" && canManageRoles && (
            <section className="space-y-4 rounded-xl bg-card border p-4 sm:p-6 shadow-sm">
                  <div className="text-lg font-semibold text-foreground">
                    Manajemen Pengguna & Sales
                  </div>
                  <div className="relative w-full overflow-auto rounded-lg">
                    {loadingUsers ? (
                      <div className="p-6 text-center text-sm text-muted-foreground">Memuat pengguna...</div>
                    ) : users.length === 0 ? (
                      <div className="p-6 text-center text-sm text-muted-foreground">Tidak ada pengguna lain.</div>
                    ) : (
                      <table className="w-full caption-bottom text-sm">
                        <thead className="bg-muted/50">
                          <tr className="border-b transition-colors">
                            <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Email</th>
                            <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Role</th>
                            <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Default Komisi/m³</th>
                            <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">Akses</th>
                          </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                          {users.map((u) => (
                            <UserRow 
                              key={u.id}
                              user={u}
                              currentUser={user}
                              isEditable={isEditable(u)}
                              onRoleChange={handleRoleChange}
                              onCommissionChange={handleCommissionChange}
                            />
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </section>
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
