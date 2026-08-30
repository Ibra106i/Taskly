"use server";

import { auth } from "@clerk/nextjs/server";
import { createSupabaseClient } from "@/lib/supabase/server";
import { Comment } from "@/lib/types";

export async function getComments(todoId: string): Promise<Comment[]> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("todo_id", todoId)
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function addComment(todoId: string, body: string): Promise<Comment> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("comments")
    .insert({ todo_id: todoId, user_id: userId, body })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateComment(id: string, body: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const supabase = createSupabaseClient();
  const { error } = await supabase
    .from("comments")
    .update({ body, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function deleteComment(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const supabase = createSupabaseClient();
  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw error;
}
