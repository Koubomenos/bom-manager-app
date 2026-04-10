"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { importRecipesBulk, deleteAllRecipes, addRecipe, getRecipeDetails, deleteRecipe, addRecipeMaterial, deleteRecipeMaterial } from "@/app/actions/recipes";
import Papa from "papaparse";
import { Upload, Trash2, Edit, Plus, X, Search } from "lucide-react";
import { useRouter } from "next/navigation";

type RecipeRow = { id: number; sku: string; color: string; materials_count: number };
type MaterialItem = { id: number; name: string; unit: string };
type ColorItem = { id: number; code: string; name: string };

export default function RecipesList({ initialRecipes, materials, baseColors }: {
  initialRecipes: RecipeRow[];
  materials: MaterialItem[];
  baseColors: ColorItem[];
}) {
  const router = useRouter();
  const [recipes, setRecipes] = useState(initialRecipes);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setRecipes(initialRecipes);
  }, [initialRecipes]);

  const filteredRecipes = useMemo(() => {
    if (!searchQuery) return recipes;
    const lower = searchQuery.toLowerCase();
    return recipes.filter(r => r.sku.toLowerCase().includes(lower) || r.color.toLowerCase().includes(lower));
  }, [recipes, searchQuery]);

  const parentRef = useRef<HTMLDivElement>(null);
  
  const rowVirtualizer = useVirtualizer({
    count: filteredRecipes.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64,
    overscan: 10,
  });

  const fullCount = recipes.filter(r => r.materials_count > 0).length;
  const emptyCount = recipes.filter(r => r.materials_count === 0).length;

  const handleCsvImport = () => {
    document.getElementById("recipe-csv-upload")?.click();
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
          const sku = r["SKU"] || r["sku"] || Object.values(r)[0];
          const color = r["Color"] || r["color"] || r["Χρώμα"] || Object.values(r)[1];
          return { sku: String(sku).trim(), color: String(color).trim() };
        }).filter(r => r.sku && r.color);

        if (mapped.length > 0) {
          await importRecipesBulk(mapped);
          alert(`Εισήχθησαν ${mapped.length} συνταγές.`);
          router.refresh();
        } else {
          alert("Δεν βρέθηκαν έγκυρα δεδομένα.");
        }
      }
    });
    e.target.value = "";
  };

  const handleDeleteAll = async () => {
    if (confirm("ΠΡΟΣΟΧΗ: Θέλετε σίγουρα να διαγράψετε ΟΛΕΣ τις συνταγές;;; Αυτή η ενέργεια δεν αναιρείται!")) {
      const prm = prompt('Πληκτρολογήστε "DELETE" για επιβεβαίωση:');
      if (prm === "DELETE") {
        await deleteAllRecipes();
        alert("Διαγράφηκαν όλες οι συνταγές.");
        router.refresh();
      }
    }
  };

  // Editor Modal State
  const [editingRecipe, setEditingRecipe] = useState<RecipeRow | null>(null);
  const [recipeMaterials, setRecipeMaterials] = useState<any[]>([]);
  const [loadingRecipe, setLoadingRecipe] = useState(false);

  const openEditor = async (recipe: RecipeRow) => {
    setLoadingRecipe(true);
    setEditingRecipe(recipe);
    const data = await getRecipeDetails(recipe.id);
    if (data) setRecipeMaterials(data.materials);
    setLoadingRecipe(false);
  };

  // Add Material inside recipe
  const [newMatId, setNewMatId] = useState("");
  const [newColorQuery, setNewColorQuery] = useState("");
  const [newQuantity, setNewQuantity] = useState("");

  const matchingColor = useMemo(() => {
    if (!newColorQuery) return null;
    return baseColors.find(c => c.name.toLowerCase() === newColorQuery.toLowerCase() || c.code.toLowerCase() === newColorQuery.toLowerCase());
  }, [newColorQuery, baseColors]);

  const handleAddMaterialToRecipe = async () => {
    if (!editingRecipe) return;
    if (!newMatId || !newQuantity) {
      alert("Επιλέξτε υλικό και ποσότητα.");
      return;
    }

    let resolvedColorId = null;
    if (newColorQuery) {
      if (!matchingColor) {
        alert("Αυτό το χρώμα δεν υπάρχει! Πρέπει να επιλέξετε ένα από τα διαθέσιμα χρώματα βάσεων.");
        return;
      }
      resolvedColorId = matchingColor.id;
    } else {
      alert("Επιλέξτε χρώμα.");
      return;
    }

    await addRecipeMaterial(editingRecipe.id, parseInt(newMatId), resolvedColorId, parseFloat(newQuantity));
    
    setNewMatId("");
    setNewColorQuery("");
    setNewQuantity("");
    
    const data = await getRecipeDetails(editingRecipe.id);
    if (data) setRecipeMaterials(data.materials);
    router.refresh();
  };

  const handleRemoveMaterialFromRecipe = async (id: number) => {
    if (confirm("Διαγραφή υλικού από τη συνταγή;")) {
      await deleteRecipeMaterial(id);
      const data = await getRecipeDetails(editingRecipe!.id);
      if (data) setRecipeMaterials(data.materials);
      router.refresh();
    }
  };

  const [rSku, setRSku] = useState("");
  const [rColor, setRColor] = useState("");
  const handleAddSingleRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    await addRecipe(rSku, rColor);
    setRSku("");
    setRColor("");
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* Top toolbar */}
      <div className="glass-card-solid rounded-2xl p-4 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="flex items-center space-x-3">
          <div className="flex space-x-2">
            <span className="bg-success-50 text-success-700 text-sm font-bold px-3.5 py-1.5 rounded-full border border-success-100">
              Γεμάτες: {fullCount}
            </span>
            <span className="bg-warning-50 text-warning-700 text-sm font-bold px-3.5 py-1.5 rounded-full border border-warning-100">
              Κενές: {emptyCount}
            </span>
            <span className="bg-primary-50 text-primary-600 text-sm font-bold px-3.5 py-1.5 rounded-full border border-primary-100">
              Σύνολο: {recipes.length}
            </span>
          </div>
        </div>
        <div className="flex space-x-3">
          <input type="file" id="recipe-csv-upload" accept=".csv" className="hidden" onChange={onCsvUpload} />
          <button onClick={handleCsvImport} className="flex items-center text-sm px-4 py-2.5 bg-white/80 border border-surface-200 rounded-xl text-surface-600 hover:bg-white hover:shadow-sm font-medium transition-all">
            <Upload className="mr-2 h-4 w-4" /> Μαζική Εισαγωγή
          </button>
          <button onClick={handleDeleteAll} className="flex items-center text-sm px-4 py-2.5 bg-danger-500 rounded-xl text-white hover:bg-danger-600 font-medium transition-all shadow-sm hover:shadow-lg hover:shadow-danger-500/25">
            <Trash2 className="mr-2 h-4 w-4" /> Διαγραφή Όλων
          </button>
        </div>
      </div>

      {/* Virtualized list */}
      <div className="glass-card-solid rounded-2xl overflow-hidden flex flex-col h-[700px]">
        <div className="p-4 border-b border-surface-200/50 bg-gradient-to-r from-surface-50/80 to-primary-50/30 flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-surface-300 h-4 w-4" />
              <input
                type="text"
                placeholder="Αναζήτηση με SKU ή Χρώμα..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-surface-200 rounded-xl text-sm bg-white/80 text-surface-800 placeholder:text-surface-300 transition-all"
              />
            </div>
            
            <form onSubmit={handleAddSingleRecipe} className="flex gap-2">
              <input required type="text" placeholder="Νέο SKU" value={rSku} onChange={e=>setRSku(e.target.value)} className="w-32 px-3 py-2.5 border border-surface-200 rounded-xl text-sm bg-white/80 text-surface-800 placeholder:text-surface-300" />
              <input required type="text" placeholder="Χρώμα" value={rColor} onChange={e=>setRColor(e.target.value)} className="w-32 px-3 py-2.5 border border-surface-200 rounded-xl text-sm bg-white/80 text-surface-800 placeholder:text-surface-300" />
              <button type="submit" className="gradient-accent text-white px-3.5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-primary-500/25 flex items-center transition-all active:scale-[0.98]">
                <Plus className="h-4 w-4" />
              </button>
            </form>
        </div>

        <div 
          ref={parentRef} 
          className="flex-1 overflow-auto bg-gradient-to-b from-surface-50/30 to-white/30"
        >
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const recipe = filteredRecipes[virtualRow.index];
              return (
                <div
                  key={virtualRow.index}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className="border-b border-surface-100 bg-white/70 hover:bg-primary-50/40 transition-all px-6 py-3 flex items-center justify-between"
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-surface-800 text-base">{recipe.sku} <span className="text-surface-300 font-normal">/</span> {recipe.color}</span>
                    <span className="text-sm text-surface-400">
                      Υλικά: <span className={recipe.materials_count === 0 ? "text-warning-600 font-semibold" : "text-surface-500"}>{recipe.materials_count}</span>
                      {recipe.materials_count === 0 ? " (Κενή)" : ""}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => openEditor(recipe)}
                      className="flex items-center text-sm px-3.5 py-1.5 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-all font-medium"
                    >
                      <Edit className="h-4 w-4 mr-1.5" /> Επεξεργασία
                    </button>
                    <button 
                      onClick={async () => {
                        if(confirm("Διαγραφή συνταγής;")) {
                           await deleteRecipe(recipe.id);
                           router.refresh();
                        }
                      }}
                      className="flex items-center text-sm px-2.5 py-1.5 bg-danger-50 text-danger-500 rounded-lg hover:bg-danger-100 transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Editor Modal */}
      {editingRecipe && (
        <div className="fixed inset-0 z-[100] bg-surface-900/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-primary-900/10 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in-up border border-white/60">
            <div className="px-6 py-4 border-b border-surface-200/50 flex justify-between items-center bg-gradient-to-r from-surface-50/80 to-primary-50/30">
              <h3 className="text-xl font-bold tracking-tight text-surface-800">
                Επεξεργασία Συνταγής: <span className="text-primary-600">{editingRecipe.sku}</span> / {editingRecipe.color}
              </h3>
              <button onClick={() => { setEditingRecipe(null); router.refresh(); }} className="text-surface-400 hover:text-surface-600 p-2 hover:bg-surface-100 rounded-xl transition-all">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
               {loadingRecipe ? (
                 <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"></div></div>
               ) : (
                 <div className="space-y-6">
                    {/* Add material form */}
                    <div className="bg-surface-50/60 p-5 rounded-xl border border-surface-200/50 flex flex-col md:flex-row gap-4 items-end">
                       <div className="flex-1">
                         <label className="block text-xs font-bold text-surface-400 uppercase tracking-wider mb-2">Βασικό Υλικό</label>
                         <select value={newMatId} onChange={e=>setNewMatId(e.target.value)} className="w-full px-3.5 py-2.5 border border-surface-200 rounded-xl text-sm bg-white/80 text-surface-800">
                           <option value="">Επιλέξτε υλικό...</option>
                           {materials.map(m => (
                             <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>
                           ))}
                         </select>
                       </div>
                       
                       <div className="w-full md:w-32">
                         <label className="block text-xs font-bold text-surface-400 uppercase tracking-wider mb-2">Ποσότητα</label>
                         <input type="number" step="0.001" value={newQuantity} onChange={e=>setNewQuantity(e.target.value)} className="w-full px-3.5 py-2.5 border border-surface-200 rounded-xl text-sm bg-white/80 text-surface-800" placeholder="π.χ. 1.5"/>
                       </div>

                       <div className="flex-1 relative">
                         <label className="block text-xs font-bold text-surface-400 uppercase tracking-wider mb-2">Χρώμα Βάσης</label>
                         <input 
                           type="text" 
                           list="colors-datalist" 
                           value={newColorQuery} 
                           onChange={e=>setNewColorQuery(e.target.value)} 
                           className={`w-full px-3.5 py-2.5 border rounded-xl text-sm bg-white/80 ${!newColorQuery || matchingColor ? 'border-surface-200 text-surface-800' : 'border-danger-400 bg-danger-50/50 text-danger-700'}`} 
                           placeholder="Πληκτρολογήστε χρώμα..." 
                         />
                         <datalist id="colors-datalist">
                           {baseColors.map(c => (
                             <option key={c.id} value={c.name}>{c.code}</option>
                           ))}
                         </datalist>
                       </div>

                       <button onClick={handleAddMaterialToRecipe} className="gradient-accent text-white px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-primary-500/25 flex justify-center items-center font-semibold shadow-sm transition-all active:scale-[0.98] h-[42px] mb-0.5">
                         <Plus className="h-5 w-5" />
                       </button>
                    </div>

                    {/* Materials table */}
                    <div className="border border-surface-200/50 rounded-xl overflow-hidden bg-white/60">
                      <table className="min-w-full divide-y divide-surface-100">
                        <thead>
                          <tr className="bg-surface-50/80">
                            <th className="px-6 py-3.5 text-left text-xs font-bold text-surface-400 uppercase">Υλικό</th>
                            <th className="px-6 py-3.5 text-left text-xs font-bold text-surface-400 uppercase">Χρώμα</th>
                            <th className="px-6 py-3.5 text-right text-xs font-bold text-surface-400 uppercase">Ποσότητα</th>
                            <th className="px-6 py-3.5 text-right text-xs font-bold text-surface-400 uppercase"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-100">
                          {recipeMaterials.map(rm => (
                            <tr key={rm.id} className="hover:bg-primary-50/30 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-surface-800">{rm.material_name}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-500">{rm.color_name} <span className="text-surface-300 font-mono ml-1">({rm.color_code})</span></td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-surface-700">{rm.quantity} <span className="text-surface-400 font-normal">{rm.material_unit}</span></td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                <button onClick={() => handleRemoveMaterialFromRecipe(rm.id)} className="text-danger-500 hover:bg-danger-50 p-2 rounded-lg transition-all">
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                          {recipeMaterials.length === 0 && (
                            <tr>
                              <td colSpan={4} className="px-6 py-12 text-center text-surface-400 text-sm italic">Η συνταγή είναι άδεια. Προσθέστε υλικά χρησιμοποιώντας τη φόρμα.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
