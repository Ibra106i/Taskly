"use server";

import { auth } from "@clerk/nextjs/server";
import { createSupabaseClient } from "@/lib/supabase/server";
import { Label } from "@/lib/types";

export async function getLabels(): Promise<Label[]> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("labels")
    .select("*")
    .eq("user_id", userId)
    .order("name");

  if (error) throw error;
  return data || [];
}

export async function addLabel(name: string, color: string): Promise<Label> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("labels")
    .insert({ name, color, user_id: userId })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateLabel(id: string, updates: { name?: string; color?: string }) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const supabase = createSupabaseClient();
  const { error } = await supabase
    .from("labels")
    .update(updates)
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function deleteLabel(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const supabase = createSupabaseClient();
  const { error } = await supabase
    .from("labels")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function setTodoLabels(todoId: string, labelIds: string[]) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const supabase = createSupabaseClient();

  await supabase
    .from("todo_labels")
    .delete()
    .eq("todo_id", todoId);

  if (labelIds.length > 0) {
    const { error } = await supabase
      .from("todo_labels")
      .insert(labelIds.map((label_id) => ({ todo_id: todoId, label_id })));

    if (error) throw error;
  }
}
