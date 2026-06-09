CREATE TABLE IF NOT EXISTS public.project_contexts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  tech_stack text,
  target_audience text,
  domain_notes text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_contexts TO authenticated;
GRANT ALL ON public.project_contexts TO service_role;

ALTER TABLE public.project_contexts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='project_contexts' AND policyname='Users manage own project contexts') THEN
    CREATE POLICY "Users manage own project contexts"
      ON public.project_contexts FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DROP TRIGGER IF EXISTS project_contexts_updated_at ON public.project_contexts;
CREATE TRIGGER project_contexts_updated_at
  BEFORE UPDATE ON public.project_contexts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.prompts
  ADD COLUMN IF NOT EXISTS mode text,
  ADD COLUMN IF NOT EXISTS project_context_id uuid REFERENCES public.project_contexts(id) ON DELETE SET NULL;