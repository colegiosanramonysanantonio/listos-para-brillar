function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const parameter = e.parameter;
  
  if (parameter.type === 'alumnado') {
    return getAlumnado(ss);
  } else if (parameter.type === 'streak') {
    return getStreak(ss, parameter.curso, parameter.grupo, parameter.alumno);
  } else if (parameter.type === 'stats') {
    return getStats(ss);
  } else if (parameter.type === 'ranking') {
      return getRanking(ss);      
  } else {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Tipo desconocido' }));
  }
}

function getAlumnado(ss) {
  const sheets = ss.getSheets();
  const alumnado = {};

  sheets.forEach(sheet => {
    const name = sheet.getName();
    // Identificar hojas de clase (ej: "1º", "5ºB")
    // Filtramos hojas especiales como "REGISTROS", "DASHBOARD", etc.
    if (/^\d/.test(name) && !name.includes('REGISTROS')) {
      const data = sheet.getDataRange().getValues();
      // Asumimos que la fila 1 es encabezado
      // Y que los alumnos empiezan en fila 2, columna 1 (A)
      
      // Parsear nombre de hoja para Curso y Grupo
      // Ej: "1º" -> Curso 1º, Grupo ÚNICO
      // Ej: "5ºB" -> Curso 5º, Grupo B
      let curso, grupo;
      
      // Lógica simple de parseo
      // Buscamos el primer número
      const match = name.match(/^(\d+(?:º|°)?)(.*)$/);
      if (match) {
        curso = match[1];
        grupo = match[2].trim() || 'ÚNICO';
      } else {
        curso = name;
        grupo = 'ÚNICO';
      }
      
      if (!alumnado[curso]) alumnado[curso] = {};
      if (!alumnado[curso][grupo]) alumnado[curso][grupo] = [];
      
      for (let i = 1; i < data.length; i++) {
        const nombre = data[i][0]; // Columna A
        if (nombre && typeof nombre === 'string' && nombre.trim() !== '') {
           alumnado[curso][grupo].push(nombre);
        }
      }
    }
  });

  return ContentService.createTextOutput(JSON.stringify(alumnado))
    .setMimeType(ContentService.MimeType.JSON);
}

function getStats(ss) {
  const sheet = ss.getSheetByName('REGISTROS');
  if (!sheet) return ContentService.createTextOutput('{}').setMimeType(ContentService.MimeType.JSON);
  
  const data = sheet.getDataRange().getValues();
  // Asumimos formato: Fecha, Hora, Curso, Grupo, Alumno, Estado...
  // Columna 5 (F) = Estado ("Sí"/"No")
  // Columna 0 (A) = Fecha
  
  const hoy = Utilities.formatDate(new Date(), ss.getSpreadsheetTimeZone(), "yyyy-MM-dd");
  const stats = {
    totalHoy: 0,
    porClase: {}
  };
  
  // Empezamos en 1 para saltar cabecera
  for (let i = 1; i < data.length; i++) {
     const fecha = data[i][0]; // Fecha cadena yyyy-MM-dd ? O objeto Date?
     let fechaStr = fecha;
     if (feat instanceof Date) {
        fechaStr = Utilities.formatDate(fecha, ss.getSpreadsheetTimeZone(), "yyyy-MM-dd");
     }
     
     const estado = data[i][5];
     
     if (fechaStr === hoy && (estado === 'Sí' || estado === 'Si' || estado === 'SI')) {
        stats.totalHoy++;
        const curso = data[i][2]; // Columna C
        const grupo = data[i][3]; // Columna D
        const key = `${curso} ${grupo}`;
        if (!stats.porClase[key]) stats.porClase[key] = 0;
        stats.porClase[key]++;
     }
  }
  
  return ContentService.createTextOutput(JSON.stringify(stats))
    .setMimeType(ContentService.MimeType.JSON);
}

function getRanking(ss) {
  const sheets = ss.getSheets();
  const scores = {};

  sheets.forEach(sheet => {
    const name = sheet.getName();
    if (/^\d/.test(name) && !name.includes('REGISTROS')) {
       const lastRow = sheet.getLastRow();
       if (lastRow > 1) {
         const data = sheet.getRange(2, 2, lastRow - 1, 31).getValues();
         let totalClase = 0;
         let numAlumnos = lastRow - 1;
         
         data.forEach(row => {
           row.forEach(cell => {
             if (cell === true || cell === 'TRUE' || (typeof cell === 'string' && ['si','sí','yes'].includes(cell.toLowerCase()))) {
               totalClase++;
             }
           });
         });
         
         scores[name] = { total: totalClase, alumnos: numAlumnos, promedio: (numAlumnos > 0 ? (totalClase / numAlumnos).toFixed(2) : 0) };
       }
    }
  });

  const ranking = Object.keys(scores).map(clase => ({
    clase: clase,
    points: scores[clase].total, 
    promedio: scores[clase].promedio
  })).sort((a, b) => b.points - a.points);

  return ContentService.createTextOutput(JSON.stringify(ranking)).setMimeType(ContentService.MimeType.JSON);
}

function getStreak(ss, curso, grupo, alumno) {
  const timezone = ss.getSpreadsheetTimeZone();
  const hoySs = new Date(); 
  const strDate = Utilities.formatDate(hoySs, timezone, "yyyy-MM-dd");
  const diaHoy = parseInt(strDate.split('-')[2], 10);
  
  const cursoNorm = curso.toString().trim().replace('°', 'º'); 
  const grupoNorm = grupo.toString().trim().toUpperCase();     
  const alumnoNorm = alumno.toString().trim().toUpperCase();   
  
  let searchName = cursoNorm;
  if (grupoNorm && grupoNorm !== 'ÚNICO' && grupoNorm !== 'UNICO') {
    searchName += grupoNorm;
  }

  let sheet = ss.getSheetByName(searchName); 
  
  if (!sheet) {
    const sheets = ss.getSheets();
    for (let s of sheets) {
      const sName = s.getName().trim().toUpperCase();
      if (sName.includes(searchName)) {
        sheet = s;
        break;
      }
    }
  }
  
  if (!sheet) return ContentService.createTextOutput(JSON.stringify({ streak: 0 })).setMimeType(ContentService.MimeType.JSON);
  
  const data = sheet.getDataRange().getValues();
  let alumnoRow = -1;
  
  for (let i = 0; i < data.length; i++) {
    const nombreEnFila = data[i][0] ? data[i][0].toString().trim().toUpperCase() : '';
    if (nombreEnFila === alumnoNorm) {
      alumnoRow = i;
      break;
    }
  }
  
  if (alumnoRow === -1) return ContentService.createTextOutput(JSON.stringify({ streak: 0 })).setMimeType(ContentService.MimeType.JSON);
  
  let ultimoDiaMarcado = -1;
  for (let d = 31; d >= 1; d--) {
     if (d < data[alumnoRow].length) {
         const celda = data[alumnoRow][d]; 
         let esCheck = false;
         if (celda === true || celda === 'TRUE') esCheck = true;
         else if (typeof celda === 'string' && ['si', 'sí', 'yes', 'ok', 'x', 'v', 'true'].includes(celda.trim().toLowerCase())) esCheck = true;
         
         if (esCheck) {
             ultimoDiaMarcado = d;
             break;
         }
     }
  }
  
  if (ultimoDiaMarcado === -1) return ContentService.createTextOutput(JSON.stringify({ streak: 0 })).setMimeType(ContentService.MimeType.JSON);
  
  let streak = 0;
  
  for (let d = ultimoDiaMarcado; d >= 1; d--) {
      const celda = data[alumnoRow][d];
      let esCheck = false;
      if (celda === true || celda === 'TRUE') esCheck = true;
      else if (typeof celda === 'string' && ['si', 'sí', 'yes', 'ok', 'x', 'v', 'true'].includes(celda.trim().toLowerCase())) esCheck = true;
      
      const fechaParaDia = new Date(hoySs.getFullYear(), hoySs.getMonth(), d, 12, 0, 0);
      const isoDate = Utilities.formatDate(fechaParaDia, timezone, "yyyy-MM-dd");
      const diaSemana = fechaParaDia.getDay(); 
      
      const festivos = [
        '2025-10-13', '2025-11-01', '2025-11-03', '2025-12-06', '2025-12-08',
        '2026-02-27', '2026-03-02', '2026-05-01', '2026-05-02', '2026-05-15'
      ];
      const esNavidad = (isoDate >= '2025-12-20' && isoDate <= '2026-01-07');
      const esSemanaSanta = (isoDate >= '2026-03-27' && isoDate <= '2026-04-06');
      const esFinDeSemana = (diaSemana === 0 || diaSemana === 6);
      const esDiaProtegido = esFinDeSemana || festivos.includes(isoDate) || esNavidad || esSemanaSanta;

      if (esDiaProtegido && !esCheck) {
           continue;
      }
      
      if (esCheck) {
          streak++;
      } else {
          break;
      }
  }

  const includesToday = (ultimoDiaMarcado === diaHoy);
  return ContentService.createTextOutput(JSON.stringify({ 
      streak: streak,
      includesToday: includesToday
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    if (data.action) {
      if (data.action === 'resetCompetition') {
        const sheetRegistros = ss.getSheetByName('REGISTROS');
        if (sheetRegistros && sheetRegistros.getLastRow() > 1) {
          sheetRegistros.getRange(2, 1, sheetRegistros.getLastRow() - 1, sheetRegistros.getLastColumn()).clearContent();
        }

        const sheets = ss.getSheets();
        sheets.forEach(sh => {
          const name = sh.getName();
          if (/^\d/.test(name)) { 
             const lastRow = sh.getLastRow();
             if (lastRow > 1) {
               const checkboxRange = sh.getRange(2, 2, lastRow - 1, 31);
               const numRows = lastRow - 1;
               const numCols = 31;
               const falseValues = [];
               for (let r = 0; r < numRows; r++) {
                 falseValues[r] = [];
                 for (let c = 0; c < numCols; c++) {
                   falseValues[r][c] = ""; 
                 }
               }
               checkboxRange.setValues(falseValues);
             }
          }
        });
        return ContentService.createTextOutput(JSON.stringify({ status: 'ok', message: 'Competición reiniciada' })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    const sheetRegistros = ss.getSheetByName('REGISTROS');
    if (!sheetRegistros) return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'No se encontró la pestaña REGISTROS' })).setMimeType(ContentService.MimeType.JSON);

    const now = new Date();
    const timezone = ss.getSpreadsheetTimeZone();
    let fechaStr = data.fecha_override || Utilities.formatDate(now, timezone, "yyyy-MM-dd");
    const horaStr = Utilities.formatDate(now, timezone, "HH:mm:ss");
    
    const { curso, grupo, alumno, estado } = data;
    const grupoFinal = grupo || "Único";
    const registroID = `${fechaStr}_${curso}_${grupoFinal}_${alumno}`;
    
    const values = sheetRegistros.getDataRange().getValues();
    let filaEncontrada = -1;
    
    for (let i = 1; i < values.length; i++) {
      if (values[i][6] === registroID) { 
        filaEncontrada = i + 1;
        break;
      }
    }

    const rowData = [fechaStr, horaStr, curso, grupoFinal, alumno, estado, registroID];

    if (filaEncontrada > -1) {
      sheetRegistros.getRange(filaEncontrada, 1, 1, 7).setValues([rowData]);
    } else {
      sheetRegistros.appendRow(rowData);
    }

    if (estado && (estado.toLowerCase() === 'sí' || estado.toLowerCase() === 'si')) {
      try {
        const cursoNorm = curso.toString().trim().replace('°', 'º');
        const grupoNorm = grupoFinal.toString().trim().toUpperCase();
        let sheetName = cursoNorm;
        if (grupoNorm && grupoNorm !== 'ÚNICO' && grupoNorm !== 'UNICO') {
          sheetName = cursoNorm + grupoNorm; 
        }
        
        let sheetClase = ss.getSheetByName(sheetName);
        if (!sheetClase) {
          const sheets = ss.getSheets();
          for (let s of sheets) {
            if (s.getName().toUpperCase().includes(sheetName.toUpperCase())) {
              sheetClase = s;
              break;
            }
          }
        }
        
        if (sheetClase) {
          const dataClase = sheetClase.getDataRange().getValues();
          const alumnoNorm = alumno.toString().trim().toUpperCase();
          let alumnoRowIndex = -1;
          for (let i = 0; i < dataClase.length; i++) {
            const nombreEnFila = dataClase[i][0] ? dataClase[i][0].toString().trim().toUpperCase() : '';
            if (nombreEnFila === alumnoNorm) {
              alumnoRowIndex = i + 1; 
              break;
            }
          }
          
          if (alumnoRowIndex > 0) {
            const diaDelMes = parseInt(fechaStr.split('-')[2], 10);
            const columnaDelDia = diaDelMes + 1; 
            sheetClase.getRange(alumnoRowIndex, columnaDelDia).setValue(true);
          }
        }
      } catch (checkboxErr) {
        console.error('Error marcando checkbox:', checkboxErr);
      }
    }

    return ContentService.createTextOutput(JSON.stringify({ status: 'ok', updated: (filaEncontrada > -1) })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}
