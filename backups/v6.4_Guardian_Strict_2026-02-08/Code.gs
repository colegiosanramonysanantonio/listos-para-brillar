/**
 * App "Cepillos" - Backend Google Apps Script
 * VERSION: 6.0 (FINAL - CATEGORIAS)
 */

function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const type = e.parameter.type;

  if (type === 'stats') {
    return getStats(ss);
  }

  if (type === 'streak') {
    const curso = e.parameter.curso || '';
    const grupo = e.parameter.grupo || '';
    const alumno = e.parameter.alumno || '';
    return getStreak(ss, curso, grupo, alumno);
  }


  // ALUMNADO
  const sheetAlumnado = ss.getSheetByName('ALUMNADO');
  if (!sheetAlumnado) {
    return ContentService.createTextOutput(JSON.stringify({ error: 'No se encontró la pestaña ALUMNADO' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const data = sheetAlumnado.getDataRange().getValues();
  data.shift(); 
  
  const alumnado = data.reduce((acc, row) => {
    let [curso, grupo, nombre] = row;
    if (!curso || !nombre) return acc;
    
    const cursoKey = curso.toString().trim();
    const grupoKey = grupo ? grupo.toString().trim().toUpperCase() : "ÚNICO"; // Normalizado a mayúsculas
    
    if (!acc[cursoKey]) acc[cursoKey] = {};
    if (!acc[cursoKey][grupoKey]) acc[cursoKey][grupoKey] = [];
    acc[cursoKey][grupoKey].push(nombre);
    return acc;
  }, {});

  return ContentService.createTextOutput(JSON.stringify(alumnado))
    .setMimeType(ContentService.MimeType.JSON);
}

function getStats(ss) {
  const sheetRegistros = ss.getSheetByName('REGISTROS');
  if (!sheetRegistros) {
    return ContentService.createTextOutput(JSON.stringify({ error: 'No se encontró la pestaña REGISTROS' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const data = sheetRegistros.getDataRange().getValues();
  data.shift(); // Quitar encabezados

  // Zona horaria
  const timezone = ss.getSpreadsheetTimeZone();
  const hoy = Utilities.formatDate(new Date(), timezone, "yyyy-MM-dd");

  // Inicializar contadores con la estructura solicitada
  const stats = {
    "1º": 0,
    "2ºA": 0, "2ºB": 0,
    "3ºA": 0, "3ºB": 0,
    "4ºA": 0, "4ºB": 0,
    "5ºA": 0, "5ºB": 0,
    "6ºA": 0, "6ºB": 0
  };

  data.forEach(row => {
    // A=0 (Fecha), C=2 (Curso), D=3 (Grupo), F=5 (Estado)
    const fechaRaw = row[0];
    let curso = row[2];
    let grupo = row[3]; // Columna D: Grupo
    let estado = row[5];

    if (!curso) return;

    // Normalizado de Curso: 1º vs 1°
    curso = curso.toString().trim().replace('°', 'º');
    
    // Normalizado de Grupo (A, B)
    const grupoStr = grupo ? grupo.toString().trim().toUpperCase() : "";

    // Construir la clave (Key)
    // Si es 1º se queda como "1º", para el resto agregamos la letra si es A o B
    let key = curso;
    if (curso !== "1º" && (grupoStr === 'A' || grupoStr === 'B')) {
      key += grupoStr;
    }

    // Normalizado de Estado
    const estadoStr = estado ? estado.toString().trim().toLowerCase() : "";
    const esAfirmativo = (estadoStr === 'sí' || estadoStr === 'si');

    if (!esAfirmativo) return;

    // Normalizado de Fecha
    let fechaStr = "";
    if (fechaRaw instanceof Date) {
      fechaStr = Utilities.formatDate(fechaRaw, timezone, "yyyy-MM-dd");
    } else if (typeof fechaRaw === 'string') {
      fechaStr = fechaRaw.substring(0, 10);
    } 

    // Comparar fecha y sumar
    if (fechaStr === hoy) {
      if (stats.hasOwnProperty(key)) {
        stats[key]++;
      }
    }
  });

  return ContentService.createTextOutput(JSON.stringify(stats))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Calcula la racha de días consecutivos de un alumno
 * Lee desde las hojas de clase (Dashboard con checkboxes)
 */
/**
 * Calcula la racha de días consecutivos de un alumno
 * Lee desde las hojas de clase (Dashboard con checkboxes)
 */
function getStreak(ss, curso, grupo, alumno) {
  const timezone = ss.getSpreadsheetTimeZone();
  
  // Calcular "hoy" en la zona horaria de la hoja de cálculo
  const hoySs = new Date(); // Variable para cálculos de fecha
  const strDate = Utilities.formatDate(hoySs, timezone, "yyyy-MM-dd");
  // Extraer el día del mes (1-31)
  const diaHoy = parseInt(strDate.split('-')[2], 10);
  
  // Normalizar nombres
  const cursoNorm = curso.toString().trim().replace('°', 'º'); // 1º
  const grupoNorm = grupo.toString().trim().toUpperCase();     // ÚNICO
  const alumnoNorm = alumno.toString().trim().toUpperCase();   // JADE

  // 1. Buscar Hoja
  // Construir nombre objetivo: "3º" + "B" = "3ºB" (si no es ÚNICO)
  let searchName = cursoNorm;
  if (grupoNorm && grupoNorm !== 'ÚNICO' && grupoNorm !== 'UNICO') {
    searchName += grupoNorm;
  }

  let sheet = ss.getSheetByName(searchName); // Intento directo "3ºB" o "3º"
  
  // Si no encuentra, búsqueda flexible
  if (!sheet) {
    const sheets = ss.getSheets();
    for (let s of sheets) {
      const sName = s.getName().trim().toUpperCase();
      // Debe contener el nombre completo (ej: "CLASE 3ºB" contiene "3ºB")
      if (sName.includes(searchName)) {
        sheet = s;
        break;
      }
    }
  }
  
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({ 
      streak: 0, 
      error: `Hoja no encontrada para curso ${searchName}`,
      lastDate: strDate
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  // 2. Buscar Alumno
  const data = sheet.getDataRange().getValues();
  let alumnoRow = -1;
  
  for (let i = 0; i < data.length; i++) {
    // Columna A (índice 0) suele tener los nombres
    const nombreEnFila = data[i][0] ? data[i][0].toString().trim().toUpperCase() : '';
    if (nombreEnFila === alumnoNorm) {
      alumnoRow = i;
      break;
    }
  }
  
  if (alumnoRow === -1) {
    return ContentService.createTextOutput(JSON.stringify({ 
      streak: 0, 
      error: `Alumno ${alumnoNorm} no encontrado en hoja ${sheet.getName()}`,
      lastDate: strDate
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  // 3. Estrategia Robusta V3: Buscar el último día marcado del mes
  let ultimoDiaMarcado = -1;
  // Buscamos desde el final del mes hacia atrás para encontrar la marca más reciente
  // Nota: Column A = nombres, Column B = día 1 (índice 1), Column C = día 2 (índice 2), etc.
  // Por lo tanto, data[row][d] corresponde al día d del mes
  for (let d = 31; d >= 1; d--) {
     if (d < data[alumnoRow].length) {
         const celda = data[alumnoRow][d]; // Índice d = Día d
         let esCheck = false;
         
         if (celda === true || celda === 'TRUE') {
             esCheck = true;
         } else if (typeof celda === 'string') {
             const val = celda.trim().toLowerCase();
             if (['si', 'sí', 'yes', 'ok', 'x', 'v', 'true'].includes(val)) {
                 esCheck = true;
             }
         }
         
         if (esCheck) {
             ultimoDiaMarcado = d;
             break;
         }
     }
  }
  
  // Si no hay ninguna marca en todo el mes
  if (ultimoDiaMarcado === -1) {
      return ContentService.createTextOutput(JSON.stringify({ 
        streak: 0, 
        lastDate: strDate,
        debug: { msg: "No marks found in sheet", diaHoy: diaHoy }
      })).setMimeType(ContentService.MimeType.JSON);
  }
  
  // Ahora contamos hacia atrás CONSECUTIVAMENTE desde ese último día marcado
  let streak = 0;
  let diasRacha = []; 
  let valorRuptura = "N/A";
  
  for (let d = ultimoDiaMarcado; d >= 1; d--) {
      // Chequear casilla (índice d = día d)
      const celda = data[alumnoRow][d];
      let esCheck = false;
      
      if (celda === true || celda === 'TRUE') {
          esCheck = true;
      } else if (typeof celda === 'string') {
          const val = celda.trim().toLowerCase();
          if (['si', 'sí', 'yes', 'ok', 'x', 'v', 'true'].includes(val)) {
              esCheck = true;
          }
      }
      
      // Soporte para Guardián de la Racha (Madrid 25/26)
      // Primero determinamos si es un día protegido
      const fechaParaDia = new Date(hoySs.getFullYear(), hoySs.getMonth(), d, 12, 0, 0);
      const isoDate = Utilities.formatDate(fechaParaDia, timezone, "yyyy-MM-dd");
      const diaSemana = fechaParaDia.getDay(); // 0: Dom, 6: Sáb
      
      const festivos = [
        '2025-10-13', '2025-11-01', '2025-11-03', '2025-12-06', '2025-12-08',
        '2026-02-27', '2026-03-02', '2026-05-01', '2026-05-02', '2026-05-15'
      ];
      const esNavidad = (isoDate >= '2025-12-20' && isoDate <= '2026-01-07');
      const esSemanaSanta = (isoDate >= '2026-03-27' && isoDate <= '2026-04-06');
      const esFinDeSemana = (diaSemana === 0 || diaSemana === 6);
      const esDiaProtegido = esFinDeSemana || festivos.includes(isoDate) || esNavidad || esSemanaSanta;

      if (esDiaProtegido) {
           // Si es día protegido, NO suma racha (aunque haya check), pero tampoco rompe.
           // Simplemente lo ignoramos y seguimos buscando hacia atrás.
           continue;
      }

      // Si NO es protegido, evaluamos el check
      if (esCheck) {
          streak++;
          diasRacha.push(d);
      } else {
          // No hay check y no es protegido -> Racha rota
          valorRuptura = `Día ${d}: ${celda} (Semana: ${diaSemana})`; 
          break;
      }
  }

  return ContentService.createTextOutput(JSON.stringify({ 
    streak: streak, 
    lastDate: strDate,
    debug: { 
        diaCalculado: diaHoy,
        diaInicioRacha: ultimoDiaMarcado,
        diasContados: diasRacha,
        valorRuptura: valorRuptura,
        fechaServidor: strDate
    }
  })).setMimeType(ContentService.MimeType.JSON);
}



function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // ACCIONES ADMINISTRATIVAS
    if (data.action) {
      if (data.action === 'resetCompetition') {
        // 1. Limpiar REGISTROS (excepto cabecera)
        const sheetRegistros = ss.getSheetByName('REGISTROS');
        if (sheetRegistros && sheetRegistros.getLastRow() > 1) {
          sheetRegistros.getRange(2, 1, sheetRegistros.getLastRow() - 1, sheetRegistros.getLastColumn()).clearContent();
        }

        // 2. Desmarcar Checkboxes en hojas de clase (SIN borrar fórmulas)
        // Buscamos hojas que empiecen por número (1º, 2ºA, etc)
        const sheets = ss.getSheets();
        sheets.forEach(sh => {
          const name = sh.getName();
          if (/^\d/.test(name)) { // Si empieza por dígito
             const lastRow = sh.getLastRow();
             if (lastRow > 1) {
               // Solo desmarcar los checkboxes (columnas B a AF = días 1-31)
               // NO usamos clearContent porque borra fórmulas
               // Ponemos FALSE en cada celda de checkbox
               const checkboxRange = sh.getRange(2, 2, lastRow - 1, 31);
               const numRows = lastRow - 1;
               const numCols = 31;
               const falseValues = [];
               for (let r = 0; r < numRows; r++) {
                 falseValues[r] = [];
                 for (let c = 0; c < numCols; c++) {
                   // Usamos comillas vacías para que la celda se vea limpia
                   // en lugar de mostrar "FALSE"
                   falseValues[r][c] = ""; 
                 }
               }
               checkboxRange.setValues(falseValues);
             }
          }
        });


        return ContentService.createTextOutput(JSON.stringify({ status: 'ok', message: 'Competición reiniciada' }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }


    // REGISTRO DE HIGIENE (DO POST ESTÁNDAR)
    const sheetRegistros = ss.getSheetByName('REGISTROS');
    if (!sheetRegistros) {
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'No se encontró la pestaña REGISTROS' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const now = new Date();
    const timezone = ss.getSpreadsheetTimeZone();
    
    // SOPORTE PARA VIAJE EN EL TIEMPO: Usar fecha_override si existe
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

    // ========== MARCAR CHECKBOX AUTOMÁTICAMENTE ==========
    // Solo si el estado es "Sí"
    if (estado && (estado.toLowerCase() === 'sí' || estado.toLowerCase() === 'si')) {
      try {
        // Buscar la hoja de clase
        const cursoNorm = curso.toString().trim().replace('°', 'º');
        const grupoNorm = grupoFinal.toString().trim().toUpperCase();
        
        // Construir nombre de hoja: "5º" + "B" = "5ºB" (excepto si es ÚNICO)
        let sheetName = cursoNorm;
        if (grupoNorm && grupoNorm !== 'ÚNICO' && grupoNorm !== 'UNICO') {
          sheetName = cursoNorm + grupoNorm; // "5ºB"
        }
        
        let sheetClase = ss.getSheetByName(sheetName);
        
        // Si no encuentra, intento flexibilizado
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
          
          // Encontrar fila del alumno
          let alumnoRowIndex = -1;
          for (let i = 0; i < dataClase.length; i++) {
            const nombreEnFila = dataClase[i][0] ? dataClase[i][0].toString().trim().toUpperCase() : '';
            if (nombreEnFila === alumnoNorm) {
              alumnoRowIndex = i + 1; // +1 porque getRange usa índices 1-based
              break;
            }
          }
          
          if (alumnoRowIndex > 0) {
            // Calcular columna del día (día 1 = columna B = índice 2, día 8 = columna I = índice 9)
            const diaDelMes = parseInt(fechaStr.split('-')[2], 10);
            const columnaDelDia = diaDelMes + 1; // Columna A=1 (nombres), B=2 (día 1), C=3 (día 2)...
            
            // Marcar el checkbox
            sheetClase.getRange(alumnoRowIndex, columnaDelDia).setValue(true);
          }
        }
      } catch (checkboxErr) {
        // Si falla el checkbox, no interrumpir el registro principal
        console.error('Error marcando checkbox:', checkboxErr);
      }
    }

    return ContentService.createTextOutput(JSON.stringify({ status: 'ok', updated: (filaEncontrada > -1) }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
