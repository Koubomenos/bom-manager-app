import { getMaterials } from "./actions/materials";
import { getColors } from "./actions/colors";
import MaterialsTabControl from "@/components/MaterialsTabControl";

export const dynamic = "force-dynamic";

export default async function MaterialsPage() {
  const materials = await getMaterials();
  const colors = await getColors();

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight text-surface-800">Υλικά & Χρώματα Βάσεων</h1>
      </div>
      
      <MaterialsTabControl initialMaterials={materials} initialColors={colors} />
    </div>
  );
}
