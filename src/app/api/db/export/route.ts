import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const materials = await prisma.material.findMany();
    const base_colors = await prisma.baseColor.findMany();
    const recipes = await prisma.recipe.findMany();
    const recipe_materials = await prisma.recipeMaterial.findMany();

    const dbDump = {
      materials,
      base_colors,
      recipes,
      recipe_materials,
      exportDate: new Date().toISOString()
    };

    const response = new NextResponse(JSON.stringify(dbDump, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="bom_db_backup_${new Date().toISOString().split('T')[0]}.json"`
      }
    });

    return response;
  } catch (error) {
    console.error('Export Error:', error);
    return NextResponse.json({ error: 'Failed to export database' }, { status: 500 });
  }
}
