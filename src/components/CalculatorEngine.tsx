"use client";

import { useState } from "react";
import Papa from "papaparse";
import { calculateBom } from "@/app/actions/calculator";
import { Upload, FileDown, Printer, AlertTriangle, CheckCircle2 } from "lucide-react";

type MasterListItem = {
  material_name: string;
  color_name: string;
  color_code: string;
  unit: string;
  total_quantity: number;
};

type MissingRecipe = {
  sku: string;
  color: string;
  quantity: number;
};

export default function CalculatorEngine() {
  const [masterList, setMasterList] = useState<MasterListItem[]>([]);
  const [missingRecipes, setMissingRecipes] = useState<MissingRecipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [calculated, setCalculated] = useState(false);

  const handleCsvImport = () => {
    document.getElementById("order-csv-upload")?.click();
  };

  const onCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setCalculated(false);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data as any[];

        const aggregated: Record<string, { sku: string, color: string, quantity: number }> = {};

        rows.forEach(r => {
          const sku = String(r["SKU"] || r["sku"] || Object.values(r)[0]).trim();
          const color = String(r["Color"] || r["color"] || r["Χρώμα"] || Object.values(r)[1]).trim();
          const quantityRaw = r["Quantity"] || r["quantity"] || r["Ποσότητα"] || Object.values(r)[2];
          const qty = parseFloat(quantityRaw) || 0;

          if (!sku || !color || qty <= 0) return;

          const key = `${sku.toLowerCase()}_${color.toLowerCase()}`;
          if (!aggregated[key]) {
            aggregated[key] = { sku, color, quantity: 0 };
          }
          aggregated[key].quantity += qty;
        });

        const orderRows = Object.values(aggregated);

        try {
          const result = await calculateBom(orderRows);
          setMasterList(result.masterList);
          setMissingRecipes(result.missingRecipes);
          setCalculated(true);
        } catch(err) {
          alert("Σφάλμα κατά τον υπολογισμό. Δοκιμάστε ξανά.");
        } finally {
          setLoading(false);
        }
      }
    });

    e.target.value = "";
  };

  const exportCsv = () => {
    if (!masterList.length) return;
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Υλικό,Χρώμα,Κωδ.Χρώματος,Συνολική Ποσότητα,Μονάδα\n" 
      + masterList.map(e => `${e.material_name},${e.color_name},${e.color_code},${e.total_quantity.toFixed(3)},${e.unit}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `shopping_list_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Upload area */}
      <div className="glass-card-solid rounded-2xl p-10 flex flex-col items-center justify-center text-center">
        <div className="h-16 w-16 gradient-accent text-white rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-primary-500/25 rotate-3 hover:rotate-0 transition-transform duration-300">
          <Upload className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-surface-800 mb-2">Ανέβασμα Παραγγελίας (CSV)</h2>
        <p className="text-surface-400 max-w-lg mb-6 text-sm leading-relaxed">
          Το αρχείο θα πρέπει να περιέχει στήλες για <strong className="text-surface-600">SKU</strong>, <strong className="text-surface-600">Χρώμα</strong> και <strong className="text-surface-600">Ποσότητα</strong>.
          Οι ποσότητες για το ίδιο SKU και χρώμα αθροίζονται αυτόματα παραβλέποντας τα μεγέθη.
        </p>

        <input type="file" id="order-csv-upload" accept=".csv" className="hidden" onChange={onCsvUpload} />
        
        <button 
          onClick={handleCsvImport}
          disabled={loading}
          className="gradient-accent text-white font-semibold py-3.5 px-10 rounded-xl transition-all shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center"
        >
          {loading ? (
             <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          ) : <Upload className="h-5 w-5 mr-2" />}
          Επιλογή Αρχείου CSV
        </button>
      </div>

      {calculated && (
        <div className="space-y-6 animate-fade-in-up">
          
          {/* Missing recipes warning */}
          {missingRecipes.length > 0 && (
            <div className="bg-warning-50/80 rounded-2xl border border-warning-100 p-6 backdrop-blur-sm">
              <div className="flex items-center text-warning-800 mb-4">
                <div className="h-10 w-10 bg-warning-100 rounded-xl flex items-center justify-center mr-3">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold">Εκκρεμότητες - Λείπουν Συνταγές</h3>
              </div>
              <p className="text-warning-700 mb-4 text-sm">Τα παρακάτω προϊόντα υπήρχαν στην παραγγελία αλλά <strong>δεν βρέθηκαν συνταγές</strong> ή οι συνταγές είναι <strong>κενές</strong> από πρώτη ύλη στο σύστημα. Οι ποσότητες τους ΔΕΝ υπολογίστηκαν στη λίστα.</p>
              
              <div className="bg-white/80 border border-warning-200/60 rounded-xl overflow-hidden">
                <table className="min-w-full divide-y divide-warning-100">
                  <thead className="bg-warning-100/50">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-bold text-warning-800 uppercase">SKU</th>
                      <th className="px-5 py-3 text-left text-xs font-bold text-warning-800 uppercase">Χρώμα</th>
                      <th className="px-5 py-3 text-right text-xs font-bold text-warning-800 uppercase">Ζητήθηκε</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-warning-50">
                    {missingRecipes.map((mr, i) => (
                      <tr key={i} className="hover:bg-warning-50/50">
                        <td className="px-5 py-3 text-sm text-surface-700 font-medium">{mr.sku}</td>
                        <td className="px-5 py-3 text-sm text-surface-700">{mr.color}</td>
                        <td className="px-5 py-3 text-sm text-right font-bold text-warning-700">{mr.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Master Shopping List */}
          <div className="glass-card-solid rounded-2xl overflow-hidden" id="print-area">
            <div className="px-6 py-5 border-b border-surface-200/50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-surface-50/80 to-success-50/30">
              <div className="flex items-center">
                 <div className="h-11 w-11 bg-success-100 text-success-600 rounded-xl flex items-center justify-center mr-3.5 shadow-sm">
                   <CheckCircle2 className="h-6 w-6" />
                 </div>
                 <div>
                   <h3 className="text-xl font-bold text-surface-800">Συγκεντρωτική Λίστα Αγορών</h3>
                   <p className="text-sm text-surface-400">Master Shopping List (BOM)</p>
                 </div>
              </div>
              
              <div className="flex space-x-3 print:hidden">
                <button onClick={exportCsv} className="flex items-center px-4 py-2.5 bg-white/80 border border-surface-200 rounded-xl text-surface-600 hover:bg-white hover:shadow-sm transition-all font-medium text-sm">
                  <FileDown className="h-4 w-4 mr-2" />
                  Εξαγωγή CSV
                </button>
                <button onClick={handlePrint} className="flex items-center px-4 py-2.5 gradient-nav text-white rounded-xl hover:shadow-lg hover:shadow-primary-900/25 transition-all font-medium text-sm">
                  <Printer className="h-4 w-4 mr-2" />
                  Εκτύπωση PDF
                </button>
              </div>
            </div>

            <table className="min-w-full divide-y divide-surface-100">
              <thead>
                <tr className="bg-surface-50/60">
                  <th className="px-6 py-4 text-left font-bold text-surface-700 tracking-wider text-sm">Βασικό Υλικό</th>
                  <th className="px-6 py-4 text-left font-bold text-surface-700 tracking-wider text-sm">Χρώμα</th>
                  <th className="px-6 py-4 text-right font-bold text-surface-700 tracking-wider text-sm">Συνολική Ποσότητα</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-50">
                {masterList.map((item, idx) => (
                  <tr key={idx} className="hover:bg-primary-50/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-surface-800">{item.material_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-500">{item.color_name} <span className="text-surface-300 font-mono ml-1">({item.color_code})</span></td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-lg font-bold text-primary-600 mr-1.5">{item.total_quantity.toFixed(3)}</span>
                      <span className="text-surface-400 text-sm font-medium">{item.unit}</span>
                    </td>
                  </tr>
                ))}
                {masterList.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-16 text-center text-surface-400 italic">
                      Δεν προέκυψε κανένα υλικό από τον υπολογισμό. (Η παραγγελία ήταν κενή ή οι συνταγές δεν είχαν υλικά).
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
        </div>
      )}
    </div>
  );
}
