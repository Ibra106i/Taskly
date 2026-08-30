"use server";

import { auth } from "@clerk/nextjs/server";
import { createSupabaseClient } from "@/lib/supabase/server";

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  created_at: string;
  due_date: string | null;
  duration_minutes: number | null;
  category: string | null;
  priority: string | null;
  user_id: string;
}

export async function addTodo(
  title: string,
  options?: {
    due_date?: string | null;
    duration_minutes?: number | null;
    category?: string | null;
    priority?: string | null;
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
      category: options?.category ?? null,
      priority: options?.priority ?? null,
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
    category?: string | null;
    priority?: string | null;
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
