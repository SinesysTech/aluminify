-- Enable Postgres unaccent extension (required by importar_cronograma_aulas)
-- Fix for: "function unaccent(text) does not exist" (42883)

CREATE EXTENSION IF NOT EXISTS unaccent;


