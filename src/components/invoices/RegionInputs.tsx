import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, Search } from "lucide-react";

function SearchableSelect({
  value,
  onSelect,
  items,
  placeholder,
  disabled
}: {
  value: string;
  onSelect: (val: string) => void;
  items: { code: string; name: string }[];
  placeholder: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems = items.filter(
    (item) => item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedItem = items.find((item) => item.code === value);
  const displayName = selectedItem ? selectedItem.name : (placeholder || "Pilih...");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between h-9 text-xs font-semibold px-3 mt-1 text-left border-slate-200 bg-card hover:bg-slate-50 truncate"
        >
          <span className="truncate flex-1 font-normal text-muted-foreground">{selectedItem ? <span className="text-foreground font-semibold">{displayName}</span> : displayName}</span>
          <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-2 bg-card border rounded-lg shadow-lg" align="start">
        <div className="relative pb-2 mb-1 border-b">
          <Search className="absolute left-2.5 top-[9px] h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Cari..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 text-xs pl-8 bg-muted/40"
            autoFocus
          />
        </div>
        <div className="max-h-[220px] overflow-y-auto no-scrollbar space-y-0.5">
          {filteredItems.length === 0 ? (
            <div className="text-center py-4 text-xs text-muted-foreground">Tidak ditemukan.</div>
          ) : (
            filteredItems.map((p) => {
              const isSelected = p.code === value;
              return (
                <button
                  key={p.code}
                  type="button"
                  onClick={() => { onSelect(p.code); setOpen(false); setSearchQuery(""); }}
                  className={`w-full flex items-center justify-between text-left px-2.5 py-2 rounded-md text-xs font-semibold transition-colors hover:bg-slate-100 ${
                    isSelected ? "bg-slate-100/80 text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <p className="truncate">{p.name}</p>
                  {isSelected && <Check className="ml-2 h-3.5 w-3.5 text-slate-800 shrink-0" />}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function RegionInputs({ client, onChange }: { client: any, onChange: (key: string, value: string) => void }) {
  const [provinces, setProvinces] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);

  const [selectedProvCode, setSelectedProvCode] = useState<string>("");
  const [selectedCityCode, setSelectedCityCode] = useState<string>("");

  useEffect(() => {
    fetch("/api/area/provinces").then(res => res.json()).then(data => setProvinces(data));
  }, []);

  const handleProvChange = async (val: string) => {
    const prov = provinces.find((p) => p.code === val);
    if (!prov) return;
    setSelectedProvCode(val);
    onChange("province", prov.name);
    
    onChange("city", "");
    onChange("district", "");
    setCities([]);
    setDistricts([]);
    setSelectedCityCode("");

    const data = await fetch(`/api/area/regencies?code=${val}`).then(res => res.json());
    setCities(data);
  };

  const handleCityChange = async (val: string) => {
    const city = cities.find((c) => c.code === val);
    if (!city) return;
    setSelectedCityCode(val);
    onChange("city", city.name);
    
    onChange("district", "");
    setDistricts([]);

    const data = await fetch(`/api/area/districts?code=${val}`).then(res => res.json());
    setDistricts(data);
  };

  const handleDistrictChange = (val: string) => {
    const dist = districts.find((d) => d.code === val);
    if (!dist) return;
    onChange("district", dist.name);
  };

  return (
    <>
      <div className="col-span-1 sm:col-span-2 md:col-span-4 grid gap-3 grid-cols-1 sm:grid-cols-4">
        <div>
          <Label className="text-[10px] text-muted-foreground uppercase">Provinsi</Label>
          <SearchableSelect
            value={selectedProvCode}
            onSelect={handleProvChange}
            items={provinces}
            placeholder={client.province || "Pilih Provinsi..."}
          />
        </div>
        
        <div>
          <Label className="text-[10px] text-muted-foreground uppercase">Kota/Kab</Label>
          <SearchableSelect
            value={selectedCityCode}
            onSelect={handleCityChange}
            items={cities}
            placeholder={client.city || "Pilih Kota..."}
            disabled={!selectedProvCode && !client.city}
          />
        </div>

        <div>
          <Label className="text-[10px] text-muted-foreground uppercase">Kecamatan</Label>
          <SearchableSelect
            value={districts.find(d => d.name.toLowerCase() === (client.district || "").toLowerCase())?.code || ""}
            onSelect={handleDistrictChange}
            items={districts}
            placeholder={client.district || "Pilih Kec..."}
            disabled={(!selectedCityCode && !client.district) || districts.length === 0}
          />
        </div>
        
        <div>
          <Label htmlFor="client_postal" className="text-[10px] text-muted-foreground uppercase">Kode Pos</Label>
          <Input 
            id="client_postal" 
            value={client.postal_code ?? ""}
            onChange={(e) => onChange("postal_code", e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="Masukkan Kode Pos..." 
            className="h-9 mt-1 text-xs"
            maxLength={5}
          />
        </div>
      </div>
    </>
  );
}
