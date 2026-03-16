-- Función atómica para check+increment de uso diario.
-- Evita race conditions cuando se envían correcciones concurrentes.
-- Retorna JSON: { allowed: bool, used: int, limit: int }
CREATE OR REPLACE FUNCTION try_increment_usage(p_user_id uuid, p_limit int)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_date date;
  v_count int;
BEGIN
  -- Fecha actual en hora canaria
  v_date := (now() AT TIME ZONE 'Atlantic/Canary')::date;

  -- Asegurar que existe la fila (sin conflicto si ya existe)
  INSERT INTO usage_logs (user_id, date, corrections_count)
  VALUES (p_user_id, v_date, 0)
  ON CONFLICT (user_id, date) DO NOTHING;

  -- Incremento atómico condicional: solo si no se ha alcanzado el límite
  UPDATE usage_logs
  SET corrections_count = corrections_count + 1
  WHERE user_id = p_user_id
    AND date = v_date
    AND corrections_count < p_limit
  RETURNING corrections_count INTO v_count;

  -- Si v_count es NULL, el UPDATE no afectó filas → límite alcanzado
  IF v_count IS NULL THEN
    SELECT corrections_count INTO v_count
    FROM usage_logs
    WHERE user_id = p_user_id AND date = v_date;

    RETURN json_build_object('allowed', false, 'used', v_count, 'limit', p_limit);
  END IF;

  RETURN json_build_object('allowed', true, 'used', v_count, 'limit', p_limit);
END;
$$;
