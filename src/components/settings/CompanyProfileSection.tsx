import { useState, useEffect, useRef } from "react";
import { Upload, Save, X, Edit, Building2, MapPin, Phone, Mail, FileText, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CompanyProfile,
  defaultCompanyProfile,
  loadCompanyProfile,
  loadCompanyProfileFromApi,
  saveCompanyProfile,
  saveCompanyProfileToApi,
  fileToBase64,
} from "@/lib/companyProfile";

interface Props {
  onSave?: () => void;
}

export function CompanyProfileSection({ onSave }: Props) {
  const [profile, setProfile] = useState<CompanyProfile>(defaultCompanyProfile);
  const [saved, setSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const logoRightInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadCompanyProfileFromApi()
      .then((serverProfile) => {
        setProfile(serverProfile);
        saveCompanyProfile(serverProfile);
      })
      .catch(() => {
        setProfile(loadCompanyProfile());
      });
  }, []);

  const handleSave = async () => {
    try {
      const savedProfile = await saveCompanyProfileToApi(profile);
      saveCompanyProfile(savedProfile);
      setProfile(savedProfile);
      setSaved(true);
      setIsEditing(false);
      setTimeout(() => setSaved(false), 2000);
      onSave?.();
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan profil perusahaan ke database.");
    }
  };

  const handleCancel = () => {
    setProfile(loadCompanyProfile());
    setIsEditing(false);
  };

  const uploadToBase64 = async (file: File): Promise<string> => {
    const base64 = await fileToBase64(file);
    return base64;
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadToBase64(file);
    setProfile((prev) => ({ ...prev, logoBase64: url }));
  };

  const handleLogoRightUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadToBase64(file);
    setProfile((prev) => ({ ...prev, logoRightBase64: url }));
  };

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadToBase64(file);
    setProfile((prev) => ({ ...prev, signatureBase64: url }));
  };

  if (!isEditing) {
    return (
      <section className="space-y-6 rounded-xl bg-card p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-foreground">Profil Perusahaan</h2>
          </div>
          <Button variant="ghost" className="text-primary hover:bg-primary/10 transition-colors" size="sm" onClick={() => setIsEditing(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Profil
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Kolom Info Utama */}
          <div className="space-y-4">
            <div className="flex gap-3 items-start">
              <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Nama Perusahaan</p>
                <p className="text-sm font-medium mt-0.5">{profile.companyName || <span className="text-muted-foreground italic">Belum diatur</span>}</p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Alamat & Kota</p>
                <p className="text-sm font-medium mt-0.5">{profile.address || <span className="text-muted-foreground italic">-</span>}</p>
                <p className="text-sm font-medium">{profile.city}</p>
              </div>
            </div>
          </div>

          {/* Kolom Kontak */}
          <div className="space-y-4">
            <div className="flex gap-3 items-start">
              <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-muted-foreground">No. Telepon</p>
                <p className="text-sm font-medium mt-0.5">{profile.phone || <span className="text-muted-foreground italic">-</span>}</p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Email</p>
                <p className="text-sm font-medium mt-0.5">{profile.email || <span className="text-muted-foreground italic">-</span>}</p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-muted-foreground">NPWP</p>
                <p className="text-sm font-medium mt-0.5">{profile.npwp || <span className="text-muted-foreground italic">-</span>}</p>
              </div>
            </div>
          </div>

          {/* Kolom Bank */}
          <div className="space-y-4">
            <div className="flex gap-3 items-start">
              <CreditCard className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Informasi Rekening</p>
                <div className="mt-1 space-y-1">
                  <p className="text-sm font-medium">{profile.bankName || <span className="text-muted-foreground italic">Bank belum diatur</span>}</p>
                  <p className="text-sm font-mono text-muted-foreground">{profile.bankAccount || "-"}</p>
                  <p className="text-sm font-medium">a/n {profile.bankAccountHolder || "-"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Gambar Logo & TTD */}
        <div className="border-t pt-4 grid gap-4 grid-cols-3">
           <div>
             <p className="text-xs font-semibold text-muted-foreground mb-2">Logo Kiri</p>
             {profile.logoBase64 ? (
               // eslint-disable-next-line @next/next/no-img-element
               <img src={profile.logoBase64} alt="Logo Kiri" className="h-12 object-contain" />
             ) : (
               <span className="text-xs text-muted-foreground italic">Kosong</span>
             )}
           </div>
           <div>
             <p className="text-xs font-semibold text-muted-foreground mb-2">Logo Kanan</p>
             {profile.logoRightBase64 ? (
               // eslint-disable-next-line @next/next/no-img-element
               <img src={profile.logoRightBase64} alt="Logo Kanan" className="h-12 object-contain" />
             ) : (
               <span className="text-xs text-muted-foreground italic">Kosong</span>
             )}
           </div>
           <div>
             <p className="text-xs font-semibold text-muted-foreground mb-2">Tanda Tangan</p>
             {profile.signatureBase64 ? (
               // eslint-disable-next-line @next/next/no-img-element
               <img src={profile.signatureBase64} alt="Tanda Tangan" className="h-12 object-contain" />
             ) : (
               <span className="text-xs text-muted-foreground italic">Kosong</span>
             )}
           </div>
        </div>
      </section>
    );
  }

  // EDIT MODE
  return (
    <section className="space-y-4 rounded-xl bg-card p-4 sm:p-6">
      <div className="text-lg font-semibold text-primary">
        Edit Profil Perusahaan
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-muted-foreground">Nama Perusahaan / Penjual</Label>
          <Input
            placeholder="Contoh: PT Beton Jaya Utama"
            value={profile.companyName}
            onChange={(e) => setProfile((p) => ({ ...p, companyName: e.target.value }))}
            className="h-9"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-muted-foreground">No. Telepon</Label>
          <Input
            placeholder="Contoh: 0812-3456-7890"
            value={profile.phone}
            onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
            className="h-9"
          />
        </div>
        <div className="sm:col-span-2 space-y-1">
          <Label className="text-xs font-semibold text-muted-foreground">Alamat</Label>
          <Input
            placeholder="Contoh: Jl. Sudirman No. 1"
            value={profile.address}
            onChange={(e) => setProfile((p) => ({ ...p, address: e.target.value }))}
            className="h-9"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-muted-foreground">Kota / Kabupaten</Label>
          <Input
            placeholder="Contoh: Kediri, Jawa Timur"
            value={profile.city}
            onChange={(e) => setProfile((p) => ({ ...p, city: e.target.value }))}
            className="h-9"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-muted-foreground">Email Perusahaan</Label>
          <Input
            type="email"
            placeholder="Contoh: info@perusahaan.com"
            value={profile.email}
            onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
            className="h-9"
          />
        </div>
        <div className="sm:col-span-2 space-y-1">
          <Label className="text-xs font-semibold text-muted-foreground">NPWP</Label>
          <Input
            placeholder="Contoh: 01.234.567.8-000.000"
            value={profile.npwp}
            onChange={(e) => setProfile((p) => ({ ...p, npwp: e.target.value }))}
            className="h-9"
          />
        </div>
      </div>

      {/* Bank Info */}
      <div className="rounded-lg border bg-muted/20 p-4 space-y-3 mt-4">
        <p className="text-xs font-semibold text-foreground">Informasi Rekening Bank</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-muted-foreground">Nama Bank</Label>
            <Input
              placeholder="Contoh: BCA"
              value={profile.bankName}
              onChange={(e) => setProfile((p) => ({ ...p, bankName: e.target.value }))}
              className="h-9"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-muted-foreground">Nomor Rekening</Label>
            <Input
              placeholder="Contoh: 1234567890"
              value={profile.bankAccount}
              onChange={(e) => setProfile((p) => ({ ...p, bankAccount: e.target.value }))}
              className="h-9"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-muted-foreground">Atas Nama</Label>
            <Input
              placeholder="Contoh: Budi Santoso"
              value={profile.bankAccountHolder}
              onChange={(e) => setProfile((p) => ({ ...p, bankAccountHolder: e.target.value }))}
              className="h-9"
            />
          </div>
        </div>
      </div>

      {/* Logo & Signature Upload */}
      <div className="grid gap-4 sm:grid-cols-3 pt-4">
        {/* Logo Left */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">Logo Perusahaan (Kiri)</p>
          <div className="flex flex-col gap-2">
            {profile.logoBase64 ? (
              <div className="relative rounded-lg border bg-background p-2 flex items-center justify-center" style={{ height: 72 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={profile.logoBase64} alt="Logo" className="max-h-16 max-w-full object-contain" />
                <button
                  type="button"
                  className="absolute top-1 right-1 rounded-full bg-background border p-0.5 text-muted-foreground hover:text-destructive shadow-sm"
                  onClick={() => setProfile((p) => ({ ...p, logoBase64: "" }))}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div
                className="rounded-lg border-2 border-dashed border-muted-foreground/25 bg-background flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-primary/40 transition-colors p-4"
                onClick={() => logoInputRef.current?.click()}
              >
                <Upload className="h-5 w-5 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Upload logo kiri</p>
              </div>
            )}
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoUpload}
            />
          </div>
        </div>

        {/* Logo Right */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">Logo Partner (Kanan)</p>
          <div className="flex flex-col gap-2">
            {profile.logoRightBase64 ? (
              <div className="relative rounded-lg border bg-background p-2 flex items-center justify-center" style={{ height: 72 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={profile.logoRightBase64} alt="Logo Partner" className="max-h-16 max-w-full object-contain" />
                <button
                  type="button"
                  className="absolute top-1 right-1 rounded-full bg-background border p-0.5 text-muted-foreground hover:text-destructive shadow-sm"
                  onClick={() => setProfile((p) => ({ ...p, logoRightBase64: "" }))}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div
                className="rounded-lg border-2 border-dashed border-muted-foreground/25 bg-background flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-primary/40 transition-colors p-4"
                onClick={() => logoRightInputRef.current?.click()}
              >
                <Upload className="h-5 w-5 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Upload logo kanan</p>
              </div>
            )}
            <input
              ref={logoRightInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoRightUpload}
            />
          </div>
        </div>

        {/* Signature */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">Tanda Tangan / Stempel</p>
          <div className="flex flex-col gap-2">
            {profile.signatureBase64 ? (
              <div className="relative rounded-lg border bg-background p-2 flex items-center justify-center" style={{ height: 72 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={profile.signatureBase64} alt="TTD" className="max-h-16 max-w-full object-contain" />
                <button
                  type="button"
                  className="absolute top-1 right-1 rounded-full bg-background border p-0.5 text-muted-foreground hover:text-destructive shadow-sm"
                  onClick={() => setProfile((p) => ({ ...p, signatureBase64: "" }))}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div
                className="rounded-lg border-2 border-dashed border-muted-foreground/25 bg-background flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-primary/40 transition-colors p-4"
                onClick={() => signatureInputRef.current?.click()}
              >
                <Upload className="h-5 w-5 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Upload TTD</p>
              </div>
            )}
            <input
              ref={signatureInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleSignatureUpload}
            />
          </div>
        </div>
      </div>

      {/* Save / Cancel Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t mt-4">
        <Button type="button" variant="ghost" onClick={handleCancel}>
          Batal
        </Button>
        <Button type="button" onClick={handleSave} className="font-semibold px-5">
          <Save className="h-4 w-4 mr-2" />
          Simpan Profil Perusahaan
        </Button>
      </div>
    </section>
  );
}
