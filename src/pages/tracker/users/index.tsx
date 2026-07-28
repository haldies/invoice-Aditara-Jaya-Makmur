import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useUsers, UserType } from "@/hooks/useUsers";

export default function UsersPage() {
  const { users, isLoading, createUser, updateUser, deleteUser } = useUsers();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("sales");
  
  const [editUser, setEditUser] = useState<UserType | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editRole, setEditRole] = useState("sales");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  
  const { toast } = useToast();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await createUser({ username, password, role });
      toast({ title: "Berhasil", description: "Pengguna baru berhasil dibuat!" });
      setIsOpen(false);
      setUsername("");
      setPassword("");
      setRole("sales");
    } catch (err: any) {
      toast({ title: "Gagal", description: err.message || "Terjadi kesalahan", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditOpen = (user: UserType) => {
    setEditUser(user);
    setEditUsername(user.email);
    setEditPassword("");
    setEditRole(user.role);
    setIsEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    setIsSaving(true);
    try {
      await updateUser(editUser.id, {
        username: editUsername,
        password: editPassword,
        role: editRole,
      });
      toast({ title: "Berhasil", description: "Pengguna berhasil diubah!" });
      setIsEditOpen(false);
      setEditUser(null);
    } catch (err: any) {
      toast({ title: "Gagal", description: err.message || "Terjadi kesalahan", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus pengguna ${email}?`)) return;
    
    setIsDeleting(id);
    try {
      await deleteUser(id);
      toast({ title: "Berhasil", description: "Pengguna berhasil dihapus!" });
    } catch (err: any) {
      toast({ title: "Gagal", description: err.message || "Terjadi kesalahan", variant: "destructive" });
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <AuthGuard>
      <AppLayout title="Pengguna Sistem">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex justify-between items-center bg-card p-4 rounded-xl border">
            <div>
              <h2 className="text-lg font-black">
                Pengguna Sistem
              </h2>
              <p className="text-xs text-muted-foreground mt-1">Kelola akun admin dan tim sales.</p>
            </div>
            
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button className="font-bold">
                  Tambah Akun
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-black">Buat Akun Baru</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Username</Label>
                    <Input 
                      required 
                      value={username} 
                      onChange={e => setUsername(e.target.value.replace(/\s+/g, '').toLowerCase())} 
                      placeholder="contoh: sales_budi"
                      autoComplete="off"
                    />
                    <p className="text-[10px] text-muted-foreground">Username tidak boleh mengandung spasi.</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input 
                      type="password"
                      required 
                      value={password} 
                      onChange={e => setPassword(e.target.value)} 
                      placeholder="minimal 6 karakter"
                      minLength={6}
                      autoComplete="new-password"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Role (Peran)</Label>
                    <Select value={role} onValueChange={setRole}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sales">Sales</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button type="submit" className="w-full font-bold" disabled={isSaving}>
                    {isSaving ? "Menyimpan..." : "Simpan Akun"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-black">Ubah Pengguna</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUpdate} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input 
                    required 
                    value={editUsername} 
                    onChange={e => setEditUsername(e.target.value.replace(/\s+/g, '').toLowerCase())} 
                    autoComplete="off"
                  />
                  <p className="text-[10px] text-muted-foreground">Username tidak boleh mengandung spasi.</p>
                </div>
                
                <div className="space-y-2">
                  <Label>Kata Sandi Baru (Opsional)</Label>
                  <Input 
                    type="password"
                    value={editPassword} 
                    onChange={e => setEditPassword(e.target.value)} 
                    placeholder="Kosongkan jika tidak ingin mengubah"
                    minLength={6}
                    autoComplete="new-password"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Role (Peran)</Label>
                  <Select value={editRole} onValueChange={setEditRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sales">Sales</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" className="w-full font-bold" disabled={isSaving}>
                  {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <div className="bg-card rounded-xl border overflow-hidden">
            <div className="overflow-x-auto w-full">
              <table className="w-full min-w-[600px] text-sm text-left whitespace-nowrap">
                <thead className="text-xs uppercase bg-slate-50 border-b text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Username</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Bergabung</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading && users.length === 0 ? (
                    [...Array(3)].map((_, i) => (
                      <tr key={i} className="border-b last:border-0 animate-pulse">
                        <td className="px-4 py-4">
                          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-32"></div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-16"></div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-24"></div>
                        </td>
                        <td className="px-4 py-4 text-right flex justify-end gap-2">
                          <div className="h-7 bg-slate-200 dark:bg-slate-800 rounded w-12"></div>
                          <div className="h-7 bg-slate-200 dark:bg-slate-800 rounded w-12"></div>
                        </td>
                      </tr>
                    ))
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-muted-foreground">Belum ada pengguna.</td>
                    </tr>
                  ) : (
                    users.map(u => (
                      <tr key={u.id} className="border-b last:border-0 hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-bold">{u.email}</td>
                        <td className="px-4 py-3 font-semibold text-muted-foreground uppercase text-[11px] tracking-wide">
                          {u.role}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(u.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-xs h-7 px-2"
                            onClick={() => handleEditOpen(u)}
                          >
                            Edit
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-xs h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDelete(u.id, u.email)}
                            disabled={isDeleting === u.id}
                          >
                            {isDeleting === u.id ? "..." : "Hapus"}
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
