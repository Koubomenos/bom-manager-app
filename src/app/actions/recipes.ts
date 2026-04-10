"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getRecipesWithStats() {
  const recipes = await prisma.recipe.findMany({
    include: {
      _count: {
        select: { materials: true },
      },
    },
    orderBy: [{ sku: "asc" }, { color: "asc" }],
  });

  return recipes.map((r) => ({
    id: r.id,
    sku: r.sku,
    color: r.color,
    materials_count: r._count.materials,
  }));
}

export async function getRecipeDetails(recipeId: number) {
  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
  });
  if (!recipe) return null;

  const materials = await prisma.recipeMaterial.findMany({
    where: { recipeId },
    include: {
      material: true,
      color: true,
    },
  });

  return {
    recipe,
    materials: materials.map((rm) => ({
      id: rm.id,
      material_id: rm.materialId,
      color_id: rm.colorId,
      quantity: rm.quantity,
      material_name: rm.material.name,
      material_unit: rm.material.unit,
      color_code: rm.color.code,
      color_name: rm.color.name,
    })),
  };
}

export async function addRecipe(sku: string, color: string) {
  try {
    const recipe = await prisma.recipe.create({
      data: { sku, color },
    });
    revalidatePath("/recipes");
    return { success: true, insertId: recipe.id };
  } catch (e) {
    return { error: "Failed" };
  }
}

export async function deleteRecipe(id: number) {
  await prisma.recipe.delete({
    where: { id },
  });
  revalidatePath("/recipes");
  return { success: true };
}

export async function deleteAllRecipes() {
  await prisma.recipeMaterial.deleteMany();
  await prisma.recipe.deleteMany();
  revalidatePath("/recipes");
  return { success: true };
}

export async function importRecipesBulk(
  recipes: { sku: string; color: string }[]
) {
  if (!recipes.length) return { success: true };

  const data = recipes.map((r) => ({
    sku: String(r.sku).trim(),
    color: String(r.color).trim(),
  }));

  await prisma.recipe.createMany({
    data,
    skipDuplicates: true,
  });
  revalidatePath("/recipes");
  return { success: true };
}

export async function addRecipeMaterial(
  recipe_id: number,
  material_id: number,
  color_id: number,
  quantity: number
) {
  await prisma.recipeMaterial.create({
    data: {
      recipeId: recipe_id,
      materialId: material_id,
      colorId: color_id,
      quantity,
    },
  });
  revalidatePath("/recipes");
  return { success: true };
}

export async function deleteRecipeMaterial(id: number) {
  await prisma.recipeMaterial.delete({
    where: { id },
  });
  revalidatePath("/recipes");
  return { success: true };
}
