-- Migration to trim common prefixes (Muhammed/Muhammad/Mohammed/Mohamed/Muhamad) from student names
-- This ensures names are correctly standardized for indexing and initials.

CREATE OR REPLACE FUNCTION public.clean_student_name()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.name ~* '^(Muhammed|Muhammad|Mohammed|Mohamed|Muhamad)\s+' THEN
    NEW.name := REGEXP_REPLACE(NEW.name, '^(Muhammed|Muhammad|Mohammed|Mohamed|Muhamad)\s+', '', 'i');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_clean_student_name
BEFORE INSERT OR UPDATE ON public.students
FOR EACH ROW
EXECUTE FUNCTION public.clean_student_name();

-- Apply retroactively to existing student names
UPDATE public.students
SET name = REGEXP_REPLACE(
    name,
    '^(Muhammed|Muhammad|Mohammed|Mohamed|Muhamad)\s+',
    '',
    'i'
)
WHERE name ~* '^(Muhammed|Muhammad|Mohammed|Mohamed|Muhamad)\s+';
