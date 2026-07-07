const fs = require('fs');
const path = require('path');

const files = [
  'modules/erp-users/domain/usuario.entity.ts',
  'modules/erp-users/domain/persona.entity.ts',
  'modules/erp-centers/domain/ambiente.entity.ts',
  'modules/erp-academics/domain/curso.entity.ts',
  'modules/chronogest-schedules/domain/horario.entity.ts',
  'modules/chronogest-schedules/domain/horario-detalle.entity.ts',
  'modules/erp-centers/domain/area.entity.ts',
  'modules/erp-academics/domain/programa.entity.ts',
  'modules/chronogest-requests/domain/solicitud-cambio.entity.ts',
  'modules/chronogest-schedules/domain/entities/registro-clase.entity.ts',
  'modules/chronogest-requests/domain/notificacion.entity.ts',
  'modules/erp-academics/domain/matricula.entity.ts'
];

for (const f of files) {
  const fullPath = path.join(__dirname, f);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Check if we already have sede_id
    if (content.includes('sede_id?: string;')) continue;
    
    const columnDef = `\n  @Column({ type: 'uuid', nullable: true })\n  sede_id?: string;\n`;
    
    // Insert before the last closing brace
    const lastBraceIndex = content.lastIndexOf('}');
    if (lastBraceIndex !== -1) {
       content = content.substring(0, lastBraceIndex) + columnDef + content.substring(lastBraceIndex);
       fs.writeFileSync(fullPath, content);
       console.log('Updated', f);
    }
  } else {
    console.log('Not found', f);
  }
}
