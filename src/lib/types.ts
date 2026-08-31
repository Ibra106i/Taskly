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
  section_id: string | null;
  position: number | null;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  user_id: string;
  created_at: string;
}

export interface Label {
  id: string;
  name: string;
  color: string;
  user_id: string;
  created_at: string;
}

export interface Comment {
  id: string;
  todo_id: string;
  user_id: string;
  body: string;
  created_at: string;
  updated_at: string | null;
}

export interface Section {
  id: string;
  name: string;
  project_id: string;
  position: number;
  user_id: string;
  created_at: string;
}

export interface ApiKey {
  id: string;
  user_id: string;
  key_hash: string;
  prefix: string;
  created_at: string;
  last_used_at: string | null;
}
