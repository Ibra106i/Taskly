export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  created_at: string;
  due_date: string | null;
  duration_minutes: number | null;
  priority: string | null;
  user_id: string;
  parent_id: string | null;
  project_id: string | null;
  recurrence_rule: string | null;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  user_id: string;
  created_at: string;
}
