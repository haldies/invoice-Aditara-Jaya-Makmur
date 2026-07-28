import { useState, useEffect } from "react";
import { useShippingRates } from "@/hooks/useShippingRates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Truck, Save, Map } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { authenticatedFetch } from "@/lib/authenticatedFetch";

export function ShippingRatesSection() {
  const { rates, isLoading, fetchRates } = useShippingRates();
  const { toast } = useToast();

  const [islandJawa, setIslandJawa] = useState("0");
  const [islandSumatera, setIslandSumatera] = useState("0");
  const [islandKalimantan, setIslandKalimantan] = useState("0");
  const [islandSulawesi, setIslandSulawesi] = useState("0");
  const [islandBaliNusa, setIslandBaliNusa] = useState("0");
  const [islandMalukuPapua, setIslandMalukuPapua] = useState("0");
  const [minOrderForFree, setMinOrderForFree] = useState("0");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (rates.length > 0) {
      const getRate = (area: string) => {
        const val = rates.find(r => r.area === area)?.price.toString();
        return val === "0" ? "" : (val || "");
      };
      
      setIslandJawa(getRate("ISLAND_JAWA"));
      setIslandSumatera(getRate("ISLAND_SUMATERA"));
      setIslandKalimantan(getRate("ISLAND_KALIMANTAN"));
      setIslandSulawesi(getRate("ISLAND_SULAWESI"));
      setIslandBaliNusa(getRate("ISLAND_BALI_NUSA"));
      setIslandMalukuPapua(getRate("ISLAND_MALUKU_PAPUA"));
      setMinOrderForFree(getRate("GLOBAL_MIN_ORDER"));
    }
  }, [rates]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const res = await authenticatedFetch("/api/shipping-rates/global", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          islandJawa: Number(islandJawa),
          islandSumatera: Number(islandSumatera),
          islandKalimantan: Number(islandKalimantan),
          islandSulawesi: Number(islandSulawesi),
          islandBaliNusa: Number(islandBaliNusa),
          islandMalukuPapua: Number(islandMalukuPapua),
          minOrderForFree: Number(minOrderForFree)
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal");
      await fetchRates();
      toast({ title: "Berhasil disimpan!", description: data.message });
    } catch (e: any) {
      toast({ title: "Gagal menyimpan", description: e.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-4 text-center text-sm text-muted-foreground">Memuat...</div>;
  }

  return (
    <section className="space-y-4 rounded-xl bg-card border p-4 sm:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" /> Pengaturan Ongkos Kirim (Per Pulau)
          </h2>
        </div>
      </div>

      <div className="bg-muted/30 p-4 sm:p-6 rounded-xl border space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          <div className="space-y-4 border-b md:border-b-0 md:border-r pb-4 md:pb-0 md:pr-4 border-border/50">
            <h3 className="text-sm font-bold flex items-center gap-2 mb-2">
              <Map className="h-4 w-4 text-muted-foreground" /> Tarif Per Pulau (Rp)
            </h3>
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Pulau Jawa</label>
              <Input type="number" placeholder="Kosongkan jika Rp 0" className="h-10 text-base font-semibold" value={islandJawa === "0" ? "" : islandJawa} onChange={e => setIslandJawa(e.target.value)} />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Pulau Sumatera</label>
              <Input type="number" placeholder="Kosongkan jika Rp 0" className="h-10 text-base font-semibold" value={islandSumatera === "0" ? "" : islandSumatera} onChange={e => setIslandSumatera(e.target.value)} />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Pulau Kalimantan</label>
              <Input type="number" placeholder="Kosongkan jika Rp 0" className="h-10 text-base font-semibold" value={islandKalimantan === "0" ? "" : islandKalimantan} onChange={e => setIslandKalimantan(e.target.value)} />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Pulau Sulawesi</label>
              <Input type="number" placeholder="Kosongkan jika Rp 0" className="h-10 text-base font-semibold" value={islandSulawesi === "0" ? "" : islandSulawesi} onChange={e => setIslandSulawesi(e.target.value)} />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Bali & Nusa Tenggara</label>
              <Input type="number" placeholder="Kosongkan jika Rp 0" className="h-10 text-base font-semibold" value={islandBaliNusa === "0" ? "" : islandBaliNusa} onChange={e => setIslandBaliNusa(e.target.value)} />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Maluku & Papua</label>
              <Input type="number" placeholder="Kosongkan jika Rp 0" className="h-10 text-base font-semibold" value={islandMalukuPapua === "0" ? "" : islandMalukuPapua} onChange={e => setIslandMalukuPapua(e.target.value)} />
            </div>
          </div>

          <div className="space-y-4 pt-2 md:pt-0">
             <h3 className="text-sm font-bold text-emerald-600 flex items-center gap-2 mb-2">
              Promosi & Gratis Ongkir
            </h3>
            <div className="space-y-2 p-4 bg-emerald-50 rounded-lg border border-emerald-100">
              <label className="text-xs font-bold text-emerald-800 uppercase">Minimal Subtotal (Gratis Ongkir)</label>
              <Input
                type="number"
                placeholder="Kosongkan jika tidak ada"
                className="h-10 text-base font-bold bg-white border-emerald-200"
                value={minOrderForFree === "0" ? "" : minOrderForFree}
                onChange={e => setMinOrderForFree(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <Button onClick={handleSave} disabled={isSaving} className="font-bold">
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Menyimpan..." : "Simpan Pengaturan"}
          </Button>
        </div>
      </div>
    </section>
  );
}
