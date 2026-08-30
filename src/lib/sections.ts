"use server";

import { auth } from "@clerk/nextjs/server";
import { createSupabaseClient } from "@/lib/supabase/server";
import { Section } from "@/lib/types";

export async function getSections(projectId: string): Promise<Section[]> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("sections")
    .select("*")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .order("position");

  if (error) throw error;
  return data || [];
}

export async function addSection(projectId: string, name: string): Promise<Section> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const supabase = createSupabaseClient();

  const { data: existing } = await supabase
    .from("sections")
    .select("position")
    .eq("project_id", projectId)
    .order("position", { ascending: false })
    .limit(1);

  const nextPosition = existing && existing.length > 0 ? existing[0].position + 1 : 0;

  const { data, error } = await supabase
    .from("sections")
    .insert({ name, project_id: projectId, position: nextPosition, user_id: userId })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateSection(id: string, updates: { name?: string; position?: number }) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const supabase = createSupabaseClient();
  const { error } = await supabase
    .from("sections")
    .update(updates)
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function deleteSection(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const supabase = createSupabaseClient();
  const { error } = await supabase
    .from("sections")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw error;
}
