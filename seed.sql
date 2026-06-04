DO $$ 
DECLARE 
  v_curso_id uuid := 'ac3c6c01-a809-4887-81f6-fb1e1ca9b7aa';
  v_ambiente_id uuid := '2f7e47a6-499a-47d9-8ed4-93a3116ccd85';
  v_instructor_id uuid := 'a2a5d83c-6983-4d77-9ff3-0566ccb7d1a0';
  v_horario_id uuid;
BEGIN
  INSERT INTO horarios (jornada, curso_id, ambiente_id) 
  VALUES ('Mañana', v_curso_id, v_ambiente_id) 
  RETURNING id INTO v_horario_id;

  INSERT INTO horario_detalle (dia, hora_inicio, hora_fin, es_transversal, horario_id, instructor_id)
  VALUES (1, '07:00:00', '12:00:00', false, v_horario_id, v_instructor_id);

  INSERT INTO horario_detalle (dia, hora_inicio, hora_fin, es_transversal, horario_id, instructor_id)
  VALUES (2, '07:00:00', '12:00:00', false, v_horario_id, v_instructor_id);

  INSERT INTO horario_detalle (dia, hora_inicio, hora_fin, es_transversal, horario_id, instructor_id)
  VALUES (3, '07:00:00', '12:00:00', false, v_horario_id, v_instructor_id);

  INSERT INTO horario_detalle (dia, hora_inicio, hora_fin, es_transversal, horario_id, instructor_id)
  VALUES (4, '07:00:00', '12:00:00', false, v_horario_id, v_instructor_id);

  INSERT INTO horario_detalle (dia, hora_inicio, hora_fin, es_transversal, horario_id, instructor_id)
  VALUES (5, '07:00:00', '12:00:00', false, v_horario_id, v_instructor_id);
END $$;
