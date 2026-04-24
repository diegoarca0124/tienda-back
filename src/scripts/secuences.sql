CREATE SEQUENCE public.categories_code_seq
START WITH 1000
INCREMENT BY 1;

ALTER TABLE public.categories
ALTER COLUMN code
SET DEFAULT nextval('public.categories_code_seq');