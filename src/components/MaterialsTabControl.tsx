"use client";

import { useState } from "react";
import { addMaterial, deleteMaterial } from "@/app/actions/materials";
import { addColor, deleteColor, importColorsBulk } from "@/app/actions/colors";
import { Plus, Trash2, Upload } from "lucide-react";
import Papa from "papaparse";

type Material = { id: number; name: string; unit: string };
type Color = { id: number; code: string; name: string };

export default function MaterialsTabControl({
  initialMaterials,
  initialColors,
}: {
  initialMaterials: Material[];
  initialColors: Color[];
}) {
  const [activeTab, setActiveTab] = useState<"materials" | "colors">("materials");

  // Material Form
  const [mName, setMName] = useState("");
  const [mUnit, setMUnit] = useState("");
  const [loadingM, setLoadingM] = useState(false);

  // Color Form
  const [cCode, setCCode] = useState("");
  const [cName, setCName] = useState("");
  const [loadingC, setLoadingC] = useState(false);

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingM(true);
    const fd = new FormData();
    fd.append("name", mName);
    fd.append("unit", mUnit);
    await addMaterial(fd);
    setMName("");
    setMUnit("");
    setLoadingM(false);
  };

  const handleDeleteMaterial = async (id: number) => {
    if (confirm("Διαγραφή υλικού;")) {
      await deleteMaterial(id);
    }
  };

  const handleAddColor = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingC(true);
    const fd = new FormData();
    fd.append("code", cCode);
    fd.append("name", cName);
    const res = await addColor(fd);
    if (res?.error) alert(res.error);
    else {
      setCCode("");
      setCName("");
    }
    setLoadingC(false);
  };

  const handleDeleteColor = async (id: number) => {
    if (confirm("Διαγραφή χρώματος;")) {
      await deleteColor(id);
    }
  };

  const handleCsvImport = () => {
    document.getElementById("color-csv-upload")?.click();
  };

  const onCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data as any[];
        const mapped = rows.map((r: any) => {
          const code = r["Code"] || r["code"] || r["CODE"] || Object.values(r)[0];
          const name = r["Name"] || r["name"] || r["NAME"] || Object.values(r)[1];
          return { code: String(code).trim(), name: String(name).trim() };
        }).filter(c => c.code && c.name);

        if (mapped.length > 0) {
          await importColorsBulk(mapped);
          alert(`Εισήχθησαν ${mapped.length} χρώματα.`);
        } else {
          alert("Δεν βρέθηκαν έγκυρα δεδομένα (Στήλες: Code, Name).");
        }
      }
    });
    e.target.value = "";
  };

  return (
    <div className="glass-card-solid rounded-2xl overflow-hidden">
      {/* Tab headers */}
      <div className="flex border-b border-surface-200/60">
        <button
          onClick={() => setActiveTab("materials")}
          className={`flex-1 py-4 text-sm font-semibold text-center transition-all duration-200 relative ${
            activeTab === "materials"
              ? "text-primary-600"
              : "text-surface-400 hover:text-surface-600 hover:bg-surface-50/50"
          }`}
        >
          Βασικά Υλικά
          {activeTab === "materials" && (
            <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 gradient-accent rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("colors")}
          className={`flex-1 py-4 text-sm font-semibold text-center transition-all duration-200 relative ${
            activeTab === "colors"
              ? "text-primary-600"
              : "text-surface-400 hover:text-surface-600 hover:bg-surface-50/50"
          }`}
        >
          Χρώματα Βάσεων
          {activeTab === "colors" && (
            <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 gradient-accent rounded-full" />
          )}
        </button>
      </div>

      <div className="p-6">
        {activeTab === "materials" && (
          <div className="space-y-6 animate-fade-in-up">
            {/* Header bar */}
            <div className="flex justify-between items-center bg-gradient-to-r from-primary-50/50 to-purple-50/50 p-4 rounded-xl border border-primary-100/40">
              <div>
                <h2 className="text-lg font-bold text-surface-800">Βασικά Υλικά</h2>
                <p className="text-sm text-surface-400">Διαχείριση πρώτων υλών και μονάδων μέτρησης.</p>
              </div>
              <div className="bg-primary-100/80 text-primary-700 text-sm font-bold px-4 py-1.5 rounded-full">
                Σύνολο: {initialMaterials.length}
              </div>
            </div>

            {/* Add form */}
            <form onSubmit={handleAddMaterial} className="flex flex-col sm:flex-row gap-4 sm:items-end bg-surface-50/60 p-4 rounded-xl border border-surface-200/50">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-surface-500 mb-1.5 uppercase tracking-wider">Όνομα Υλικού</label>
                <input required type="text" value={mName} onChange={e => setMName(e.target.value)} className="w-full px-3.5 py-2.5 border border-surface-200 rounded-xl text-sm bg-white/80 text-surface-800 placeholder:text-surface-300" placeholder="π.χ. Ύφασμα Φούτερ" />
              </div>
              <div className="w-full sm:w-48">
                <label className="block text-xs font-semibold text-surface-500 mb-1.5 uppercase tracking-wider">Μονάδα Μέτρησης</label>
                <input required type="text" value={mUnit} onChange={e => setMUnit(e.target.value)} className="w-full px-3.5 py-2.5 border border-surface-200 rounded-xl text-sm bg-white/80 text-surface-800 placeholder:text-surface-300" placeholder="π.χ. Κιλά, Μέτρα" />
              </div>
              <button disabled={loadingM} type="submit" className="gradient-accent text-white px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-primary-500/25 disabled:opacity-50 flex justify-center items-center font-semibold text-sm transition-all active:scale-[0.98]">
                <Plus className="mr-1.5 h-4 w-4" /> Προσθήκη
              </button>
            </form>

            {/* Table */}
            <div className="border border-surface-200/50 rounded-xl overflow-x-auto bg-white/60">
              <table className="min-w-full divide-y divide-surface-100">
                <thead>
                  <tr className="bg-surface-50/80">
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-surface-400 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-surface-400 uppercase tracking-wider">Όνομα Υλικού</th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-surface-400 uppercase tracking-wider">Μονάδα</th>
                    <th className="px-6 py-3.5 text-right text-xs font-bold text-surface-400 uppercase tracking-wider">Ενέργειες</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {initialMaterials.map((m) => (
                    <tr key={m.id} className="hover:bg-primary-50/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-400 font-mono">#{m.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-surface-800">{m.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg font-semibold bg-primary-50 text-primary-600 text-xs">
                          {m.unit}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <button onClick={() => handleDeleteMaterial(m.id)} className="text-danger-500 hover:text-danger-700 bg-danger-50/80 hover:bg-danger-100 p-2 rounded-lg transition-all hover:shadow-sm">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {initialMaterials.length === 0 && (
                     <tr>
                       <td colSpan={4} className="px-6 py-12 text-center text-sm text-surface-400 italic">Δεν βρέθηκαν υλικά. Προσθέστε το πρώτο σας υλικό.</td>
                     </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "colors" && (
          <div className="space-y-6 animate-fade-in-up">
            {/* Header bar */}
            <div className="flex justify-between items-center bg-gradient-to-r from-primary-50/50 to-purple-50/50 p-4 rounded-xl border border-primary-100/40">
              <div>
                <h2 className="text-lg font-bold text-surface-800">Χρώματα Βάσεων</h2>
                <p className="text-sm text-surface-400">Διαχείριση των διαθέσιμων χρωμάτων.</p>
              </div>
              <div className="flex items-center space-x-3">
                <input type="file" id="color-csv-upload" accept=".csv" className="hidden" onChange={onCsvUpload} />
                <button onClick={handleCsvImport} className="flex items-center text-sm px-3.5 py-2 bg-white/80 border border-surface-200 rounded-xl text-surface-600 hover:bg-white hover:shadow-sm font-medium transition-all">
                  <Upload className="mr-1.5 h-4 w-4" />
                  Μαζική Εισαγωγή CSV
                </button>
                <div className="bg-primary-100/80 text-primary-700 text-sm font-bold px-4 py-1.5 rounded-full">
                  Σύνολο: {initialColors.length}
                </div>
              </div>
            </div>

            {/* Add form */}
            <form onSubmit={handleAddColor} className="flex flex-col sm:flex-row gap-4 sm:items-end bg-surface-50/60 p-4 rounded-xl border border-surface-200/50">
              <div className="w-full sm:w-48">
                <label className="block text-xs font-semibold text-surface-500 mb-1.5 uppercase tracking-wider">Κωδικός</label>
                <input required type="text" value={cCode} onChange={e => setCCode(e.target.value)} className="w-full px-3.5 py-2.5 border border-surface-200 rounded-xl text-sm bg-white/80 text-surface-800 placeholder:text-surface-300" placeholder="π.χ. 332K" />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-surface-500 mb-1.5 uppercase tracking-wider">Όνομα Χρώματος</label>
                <input required type="text" value={cName} onChange={e => setCName(e.target.value)} className="w-full px-3.5 py-2.5 border border-surface-200 rounded-xl text-sm bg-white/80 text-surface-800 placeholder:text-surface-300" placeholder="π.χ. Μπλε Σκούρο" />
              </div>
              <button disabled={loadingC} type="submit" className="gradient-accent text-white px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-primary-500/25 disabled:opacity-50 flex justify-center items-center font-semibold text-sm transition-all shadow-sm active:scale-[0.98]">
                <Plus className="mr-1.5 h-4 w-4" /> Προσθήκη
              </button>
            </form>

            {/* Table */}
            <div className="border border-surface-200/50 rounded-xl overflow-x-auto bg-white/60">
              <table className="min-w-full divide-y divide-surface-100">
                <thead>
                  <tr className="bg-surface-50/80">
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-surface-400 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-surface-400 uppercase tracking-wider">Κωδικός</th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-surface-400 uppercase tracking-wider">Όνομα Χρώματος</th>
                    <th className="px-6 py-3.5 text-right text-xs font-bold text-surface-400 uppercase tracking-wider">Ενέργειες</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {initialColors.map((c) => (
                    <tr key={c.id} className="hover:bg-primary-50/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-400 font-mono">#{c.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-primary-600 font-mono">{c.code}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-surface-800">{c.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <button onClick={() => handleDeleteColor(c.id)} className="text-danger-500 hover:text-danger-700 bg-danger-50/80 hover:bg-danger-100 p-2 rounded-lg transition-all hover:shadow-sm">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {initialColors.length === 0 && (
                     <tr>
                       <td colSpan={4} className="px-6 py-12 text-center text-sm text-surface-400 italic">Δεν βρέθηκαν χρώματα. Προσθέστε ένα χρώμα ή κάντε εισαγωγή μέσω CSV.</td>
                     </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
