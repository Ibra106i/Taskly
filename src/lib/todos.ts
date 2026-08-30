"use server";

import { auth } from "@clerk/nextjs/server";
import { createSupabaseClient } from "@/lib/supabase/server";
import { Todo } from "@/lib/types";

export async function addTodo(
  title: string,
  options?: {
    due_date?: string | null;
    duration_minutes?: number | null;
    priority?: string | null;
    parent_id?: string | null;
    project_id?: string | null;
    recurrence_rule?: string | null;
  }
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const supabase = createSupabaseClient();
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
    })
    .select()
    .single();

  if (error) throw error;
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
