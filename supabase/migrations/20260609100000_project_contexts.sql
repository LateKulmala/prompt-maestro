-- project_contexts: user's personal projects that maestro uses as context
CREATE TABLE public.project_contexts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,                          -- e.g. "Boatbase"
  description text,                            -- what the project is
  tech_stack text,                             -- e.g. "React, Supabase, TanStack"
  target_audience text,                        -- e.g. "Finnish boat owners"
  domain_notes text,                           -- key domain knowledge, schema notes
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_contexts TO authenticated;
GRANT ALL ON public.project_contexts TO service_role;

ALTER TABLE public.project_contexts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own project contexts"
  ON public.project_contexts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER project_contexts_updated_at
  BEFORE UPDATE ON public.project_contexts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add mode column to prompts for tracking which mode was used
ALTER TABLE public.prompts
  ADD COLUMN IF NOT EXISTS mode text,
  ADD COLUMN IF NOT EXISTS project_context_id uuid REFERENCES public.project_contexts(id) ON DELETE SET NULL;
