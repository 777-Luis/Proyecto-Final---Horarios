# Documentación Técnica - ChronoGest Backend

## 1. DESCRIPCIÓN GENERAL DEL PROYECTO
**ChronoGest** es un sistema integral para la gestión, planeación y administración de horarios académicos diseñado específicamente para la Sede Yamboro del SENA. El sistema unifica la administración de instructores, aprendices, áreas, programas, ambientes físicos y franjas de formación.

### Tecnologías Utilizadas
- **Framework Core**: NestJS v11 (Node.js)
- **Lenguaje**: TypeScript (Modo Estricto)
- **ORM & BD**: TypeORM v0.3 / PostgreSQL v15 (Dockerizado)
- **Autenticación**: Passport.js + JSON Web Tokens (JWT) + Bcrypt (Hashing)
- **Generación Documental y Excel**: `pdfkit` nativo, `exceljs`
- **Llamadas Internas (Microservicios)**: `@nestjs/axios` (HttpModule)

## 2. CÓMO LEVANTAR EL PROYECTO

### Requisitos Previos
- **Node.js**: v20+ recomendado
- **Docker & Docker Compose**: Para la capa de base de datos
- **NPM**: Gestor de paquetes

### Pasos de Configuración y Ejecución
1. **Clonar el proyecto y acceder a la ruta**:
   ```bash
   cd m-erp-backend
   ```
2. **Configurar el entorno**:
   Asegúrate de contar con un archivo `.env` en la raíz con las variables de conexión a Postgres (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`, etc).
3. **Levantar la Base de Datos**:
   ```bash
   docker-compose up -d
   ```
4. **Instalar Dependencias**:
   ```bash
   npm install
   ```
5. **Generar y Correr Migraciones (Si aplica)**:
   Si existen migraciones pendientes para las entidades, ejecutar:
   ```bash
   npm run migration:run
   ```
   *(Nota: Puedes simular la tabla notificaciones mediante el script manual `npx ts-node run-migration.ts` si tu ambiente Windows reporta fallos con TypeORM CLI).*
6. **Levantar el Backend**:
   ```bash
   npm run start:dev
   ```
7. **Poblar la Semilla (Yamboro Base)**:
   A través de un cliente HTTP (Postman/ThunderClient) como Administrador, ejecutar: `POST http://localhost:3000/academics-seed`

## 3. ARQUITECTURA TÉCNICA
El proyecto está construido bajo una **Arquitectura Hexagonal Modular** acoplada al patrón **RIVAC**.

### Patrones Clave
- **Arquitectura Hexagonal**: Separación clara entre el **Dominio** (entidades y lógica purísima de negocio independiente del framework), la **Aplicación** (Servicios y Casos de Uso), y la **Infraestructura** (Controladores REST, conexiones TypeORM, Guards).
- **RIVAC** (Routes, Interfaces, Validation, Application, Controllers): Organiza de forma altamente predecible el ciclo de vida de un request. La validación ocurre vía `class-validator` en DTOs protegiendo a los Servicios de inyección de datos corruptos.

### Estructura de Módulos Centrales
1. **`auth`**: Gestión JWT, flujos de contraseñas y login.
2. **`erp-locations`**: Diccionarios geográficos (Departamentos, Municipios).
3. **`erp-users`**: Control de Usuarios, Personas, Roles, Permisos y carga masiva por Excel.
4. **`erp-apps`**: Gestión del enjambre de sub-aplicativos ERP.
5. **`erp-centers`**: Core físico. Abarca Sedes, Centros de Formación, Áreas y Ambientes limitados por su capacidad.
6. **`erp-academics`**: Core académico. Programas formativos, Cursos base y Matrículas.
7. **`chronogest-schedules`** (API Horarios): Módulo dinámico para la asignación de instructores en franjas sobre cursos.
8. **`chronogest-requests`**: Máquina de estados para Solicitudes de Cambio y Notificaciones Push internas.

### API Principal vs API Horarios
Aunque el proyecto conforma un Monolito Modular en un solo repositorio, existe un desacoplamiento a nivel de dominio. El módulo `chronogest-schedules` asume el rol de **API de Horarios**, utilizando internamente `@nestjs/axios` para hacer peticiones proxy simuladas extrañendo datos a la **API Principal** (por ejemplo, verificando qué cursos no tienen horarios) inyectando el token original para asegurar el flujo de autorización distribuido.

## 4. BASE DE DATOS Y RLS
Contamos con una topología relacional de +21 tablas en PostgreSQL. El diseño está protegido en su núcleo por restricciones declarativas y modelado orientado a integridad referencial.
- **Relaciones Clave**: Un *Usuario* debe ser una *Persona* con *Credenciales* validas. Un *Programa* le pertenece inexorablemente a una sola *Área*. Un *Ambiente* es asignado unívocamente sin intersolapamiento gracias a la regla de *Jornada*.
- **Row Level Security (RLS)**: PostgreSQL se encargará, mediante su sistema nativo RLS integrado en las migraciones tempranas, de segmentar el acceso crudo a las filas dependiendo de si el tenant/rol operativo puede o no manipular información inter-sedes, incrementando drásticamente la seguridad anti-fugas.

## 5. AUTENTICACIÓN Y SEGURIDAD
- **JWT Stateless**: El sistema depende netamente de tokens asimétricos. No guarda el estado de la sesión en disco; cada payload del JWT contiene compresa la identidad (`sub`) y su `role` agilizando la resolución.
- **Sistema de 3 Roles**: 
  - `Administrador`: Acceso global a configuración y dictámenes finales.
  - `Instructor`: Agente activo a quien se le asignan cruces de horarios.
  - `Aprendiz`: Target de consulta de matrículas y lectura.
- **Detección Automática de "Líder"**: No existe un "rol" artificial llamado Líder. Un Instructor asume facultades de mando y aprobación en ChronoGest **si y solo si** su Identificador de Persona (`persona.id`) se encuentra mapeado en la columna `lider_area_id` de la tabla física `Areas`. La seguridad del backend inyecta dinámicamente este cruce.
- **Recuperación**: Genera tokens temporales (`expiresIn: 15m`) expedidos directamente al correo (Nodemailer config).

## 6. ENDPOINTS DISPONIBLES (Resumen de Importantes)
- `POST /auth/login` (Público): Devuelve Token JWT.
- `GET /users/excel-template?role=X` (Admin): Exporta Plantilla Excel.
- `POST /users/mass-upload` (Admin): Importa masiva transaccional.
- `GET /ambientes/disponibles?jornada=X` (Auth + Instructor): Extrae ambientes no copados para la jornada indicada sin conflictos de fecha.
- `GET /ambientes/estado` (Admin): Dashboard global con tarjetas de la disponibilidad desglosada (Mañana y Tarde).
- `GET /cursos/sin-horario` (Admin): Cursos Vírgenes (Cruza `LEFT JOIN horarios` en DB).
- `POST /horarios` (Admin): Transacción principal de agenda. (Aisla choques).
- `GET /horarios/:id/pdf` (Admin, Instructor, Aprendiz): Exportación binaria rápida.
- `PATCH /solicitudes/:id/reenviar` (Instructor [Lider Area Validado]): Sube estado a ENVIADO_ADMIN.

## 7. REGLAS DE NEGOCIO IMPLEMENTADAS
- **Superposición Cero de Ambientes**: Es imposible guardar un curso en un ambiente si la fecha actual (`NOW()`) cae dentro de la `inicio_lectiva` a `fin_lectiva` de otró curso para **esa misma jornada**. Mañana y Tarde se tratan independientes.
- **Choques de Instructores**: El motor evalúa celda a celda qué instructor se solicita a nivel de `.detalles`. Bloquea la inserción o edición si ese instructor ya está reservado ese mismo `dia` en esa franja de `hora_inicio` y `hora_fin`.
- **Franjas Transversales Rígidas**: Al marcar `es_transversal: true`, se exige restrictivamente en backend que su imput caiga obligatoriamente en `08:00 - 12:00`.
- **StateMachine de Solicitudes**: Un escalamiento restrictivo. El Líder no puede aprobar (`APROBAR/RECHAZAR` recae en el Admin). El Líder actúa como primer candado, él solo **Reenvía**. Todo avance dispara un registro cruzado en la tabla `Notificaciones` a los involucrados.
- **PDF Dinámico**: Usa las primitivas de `pdfkit` (rectángulos, coloreado dinámico) para destacar clases de Transversales frente a Técnicas, agilizando la lectura final en documentos formales.

## 8. COMANDOS ÚTILES
- Iniciar en Modo Desarrollo (Hot Reload): `npm run start:dev`
- Verificar el código y compilar: `npm run build`
- Formateo estándar (Linter): `npm run lint` y `npm run format`
- Consola CLI TypeORM Generador: `npm run typeorm -- migration:generate -d src/config/data-source.ts PATH_DESTINO`
- Consola Postgres de Docker (Ej: Verificar Tablas):
  ```bash
  docker exec -it <NOMBRE_CONTENEDOR_DB> psql -U erp_user -d erpdblocal
  ```
