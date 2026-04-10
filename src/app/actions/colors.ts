"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getColors() {
  const colors = await prisma.baseColor.findMany({
    orderBy: { code: "asc" },
  });
  return colors;
}

export async function addColor(formData: FormData) {
  const code = formData.get("code") as string;
  const name = formData.get("name") as string;

  if (!code || !name) return { error: "Code and name are required" };

  try {
    await prisma.baseColor.create({
      data: { code, name },
    });
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    if (error.code === "P2002") return { error: "Color code already exists" };
    throw error;
  }
}

export async function deleteColor(id: number) {
  await prisma.baseColor.delete({
    where: { id },
  });
  revalidatePath("/");
  return { success: true };
}

export async function importColorsBulk(
  colors: { code: string; name: string }[]
) {
  if (!colors.length) return { success: true };

  await prisma.baseColor.createMany({
    data: colors,
    skipDuplicates: true,
  });
  revalidatePath("/");
  return { success: true };
}
