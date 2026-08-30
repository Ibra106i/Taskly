"use server";

import { auth } from "@clerk/nextjs/server";
import { createSupabaseClient } from "@/lib/supabase/server";

export async function addTodo(
  title: string,
  options?: {
    due_date?: string | null;
    duration_minutes?: number | null;
    priority?: string | null;
    parent_id?: string | null;
    project_id?: string | null;
    recurrence_rule?: string | null;
    section_id?: string | null;
  }
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const supabase = createSupabaseClient();

  let position = 0;
  if (options?.section_id) {
    const { data: existing } = await supabase
      .from("todos")
      .select("position")
      .eq("section_id", options.section_id)
      .order("position", { ascending: false })
      .limit(1);
    position = existing && existing.length > 0 ? (existing[0].position || 0) + 1 : 0;
  } else if (!options?.parent_id) {
    const { data: existing } = await supabase
      .from("todos")
      .select("position")
      .eq("user_id", userId)
      .is("parent_id", null)
      .order("position", { ascending: false })
      .limit(1);
    position = existing && existing.length > 0 ? (existing[0].position || 0) + 1 : 0;
  }

  const { data, error } = await supabase
    .from("todos")
    .insert({
      title,
      user_id: userId,
      due_date: options?.due_date ?? null,
      duration_minutes: options?.duration_minutes ?? null,
      priority: options?.priority ?? null,
      parent_id: options?.parent_id ?? null,
      project_id: options?.project_id ?? null,
      recurrence_rule: options?.recurrence_rule ?? null,
      section_id: options?.section_id ?? null,
      position,
    })
    .select()
    .single();

  if (error) {
    console.error("addTodo error:", JSON.stringify({ message: error.message, details: error.details, hint: error.hint, code: error.code }));
    throw error;
  }
  return data;
}

export async function toggleTodo(id: string, completed: boolean) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const supabase = createSupabaseClient();
  const { error } = await supabase
    .from("todos")
    .update({ completed })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function updateTodo(
  id: string,
  updates: {
    title?: string;
    due_date?: string | null;
    duration_minutes?: number | null;
    priority?: string | null;
    parent_id?: string | null;
    project_id?: string | null;
    recurrence_rule?: string | null;
    section_id?: string | null;
    position?: number | null;
  }
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const supabase = createSupabaseClient();
  const { error } = await supabase
    .from("todos")
    .update(updates)
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function deleteTodo(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const supabase = createSupabaseClient();
  const { error } = await supabase
    .from("todos")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function clearCompleted() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const supabase = createSupabaseClient();
  const { error } = await supabase
    .from("todos")
    .delete()
    .eq("user_id", userId)
    .eq("completed", true);

  if (error) throw error;
}
