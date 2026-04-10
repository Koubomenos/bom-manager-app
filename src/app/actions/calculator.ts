"use server";

import { prisma } from "@/lib/db";

export async function calculateBom(
  orderRows: { sku: string; color: string; quantity: number }[]
) {
  if (!orderRows.length) return { masterList: [], missingRecipes: [] };

  const allDbRecipes = await prisma.recipe.findMany({
    include: {
      materials: {
        include: {
          material: true,
          color: true,
        },
      },
    },
  });

  const recipesMap: Record<
    string,
    (typeof allDbRecipes)[number]
  > = {};
  for (const recipe of allDbRecipes) {
    const key = `${recipe.sku.toLowerCase()}_${recipe.color.toLowerCase()}`;
    recipesMap[key] = recipe;
  }

  const masterListMap: Record<
    string,
    {
      material_name: string;
      color_name: string;
      color_code: string;
      unit: string;
      total_quantity: number;
    }
  > = {};
  const missingRecipes: { sku: string; color: string; quantity: number }[] = [];

  for (const row of orderRows) {
    const key = `${String(row.sku).toLowerCase()}_${String(row.color).toLowerCase()}`;
    const matchingRecipe = recipesMap[key];

    if (!matchingRecipe || matchingRecipe.materials.length === 0) {
      missingRecipes.push(row);
      continue;
    }

    for (const mat of matchingRecipe.materials) {
      const matKey = `${mat.material.name}_${mat.color.name}`;
      if (!masterListMap[matKey]) {
        masterListMap[matKey] = {
          material_name: mat.material.name,
          color_name: mat.color.name,
          color_code: mat.color.code,
          unit: mat.material.unit,
          total_quantity: 0,
        };
      }
      masterListMap[matKey].total_quantity +=
        Number(mat.quantity) * row.quantity;
    }
  }

  const masterList = Object.values(masterListMap).sort((a, b) =>
    a.material_name.localeCompare(b.material_name)
  );

  return { masterList, missingRecipes };
}
