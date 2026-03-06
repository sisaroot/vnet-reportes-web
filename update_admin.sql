-- 1. Eliminar el admin de prueba anterior (opcional)
DELETE FROM "public"."usuarios" WHERE role = 'admin';

-- 2. Insertar el Nuevo Administrador Oficial (Credenciales solicitadas)
INSERT INTO "public"."usuarios" (username, password, role) 
VALUES ('cesar', '30440573', 'admin');
