export interface CompanyProfile {
  companyName: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  npwp: string;
  bankName: string;
  bankAccount: string;
  bankAccountHolder: string;
  logoBase64: string; // base64 encoded image
  logoRightBase64: string; // base64 encoded image for partner/right side
  signatureBase64: string; // base64 encoded image
}

const STORAGE_KEY = "company_profile_v2";

export const defaultCompanyProfile: CompanyProfile = {
  companyName: "CV ADITARA JAYA MAKMUR",
  address: "Dsn. Semen, Desa Tanggalrejo, Kec. Mojoagung, Kab. Jombang",
  city: "Jombang",
  phone: "+62 823-3666-6366",
  email: "aditarajayamakmur@gmail.com",
  npwp: "",
  bankName: "BCA",
  bankAccount: "150.455.5758",
  bankAccountHolder: "CV ADITARA JAYA MAKMUR",
  logoBase64: "",
  logoRightBase64: "",
  signatureBase64: "",
};

export function loadCompanyProfile(): CompanyProfile {
  if (typeof window === "undefined") return defaultCompanyProfile;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultCompanyProfile;
    return { ...defaultCompanyProfile, ...JSON.parse(raw) };
  } catch {
    return defaultCompanyProfile;
  }
}

export function saveCompanyProfile(profile: CompanyProfile): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
