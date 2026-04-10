import { getRecipesWithStats } from "@/app/actions/recipes";
import { getMaterials } from "@/app/actions/materials";
import { getColors } from "@/app/actions/colors";
import RecipesList from "@/components/RecipesList";

export const dynamic = "force-dynamic";

export default async function RecipesPage() {
  const recipes = await getRecipesWithStats();
  const materials = await getMaterials();
  const colors = await getColors();

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight text-surface-800">Συνταγές / BOM</h1>
      </div>
      
      <RecipesList 
        initialRecipes={recipes} 
        materials={materials}
        baseColors={colors} 
      />
    </div>
  );
}
