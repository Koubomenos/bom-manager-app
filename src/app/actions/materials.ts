"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getMaterials() {
  const materials = await prisma.material.findMany({
    orderBy: { name: "asc" },
  });
  return materials;
}

export async function addMaterial(formData: FormData) {
  const name = formData.get("name") as string;
  const unit = formData.get("unit") as string;

  if (!name || !unit) return { error: "Name and unit are required" };

  await prisma.material.create({
    data: { name, unit },
  });
  revalidatePath("/");
  return { success: true };
}

export async function deleteMaterial(id: number) {
  await prisma.material.delete({
    where: { id },
  });
  revalidatePath("/");
  return { success: true };
}
