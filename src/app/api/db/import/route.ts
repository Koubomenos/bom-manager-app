import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const text = await file.text();
    const data = JSON.parse(text);

    if (!data.materials || !data.base_colors || !data.recipes || !data.recipe_materials) {
      return NextResponse.json({ error: 'Invalid backup file format' }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      // Clear all tables in correct order (respect foreign keys)
      await tx.recipeMaterial.deleteMany();
      await tx.recipe.deleteMany();
      await tx.material.deleteMany();
      await tx.baseColor.deleteMany();

      // Re-insert all data
      if (data.materials.length > 0) {
        await tx.material.createMany({
          data: data.materials.map((m: any) => ({
            id: m.id,
            name: m.name,
            unit: m.unit,
          })),
        });
      }

      if (data.base_colors.length > 0) {
        await tx.baseColor.createMany({
          data: data.base_colors.map((c: any) => ({
            id: c.id,
            code: c.code,
            name: c.name,
          })),
        });
      }

      if (data.recipes.length > 0) {
        await tx.recipe.createMany({
          data: data.recipes.map((r: any) => ({
            id: r.id,
            sku: r.sku,
            color: r.color,
          })),
        });
      }

      if (data.recipe_materials.length > 0) {
        await tx.recipeMaterial.createMany({
          data: data.recipe_materials.map((rm: any) => ({
            id: rm.id,
            recipeId: rm.recipe_id,
            materialId: rm.material_id,
            colorId: rm.color_id,
            quantity: rm.quantity,
          })),
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Import Error:', error);
    return NextResponse.json({ error: 'Failed to import database' }, { status: 500 });
  }
}
