-- Probar sin RLS (Debe dar error o 0 registros):
SELECT COUNT(*) AS conteo_sin_rls FROM personas;

-- Probar con Yamboro:
SET rls.tenant_id = 'yamboro';
SET rls.is_superadmin = 'false';
SELECT COUNT(*) AS conteo_yamboro FROM personas;

-- Probar con Pitalito (donde no hay nadie todavía):
SET rls.tenant_id = 'pitalito';
SELECT COUNT(*) AS conteo_pitalito FROM personas;

-- Probar bypass superadmin:
RESET rls.tenant_id;
SET rls.is_superadmin = 'true';
SELECT COUNT(*) AS conteo_superadmin FROM personas;

-- Resetear todo:
RESET rls.tenant_id;
RESET rls.is_superadmin;
