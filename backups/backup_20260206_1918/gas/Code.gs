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

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetRegistros = ss.getSheetByName('REGISTROS');
    
    if (!sheetRegistros) {
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'No se encontró la pestaña REGISTROS' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const now = new Date();
    const fechaStr = Utilities.formatDate(now, ss.getSpreadsheetTimeZone(), "yyyy-MM-dd");
    const horaStr = Utilities.formatDate(now, ss.getSpreadsheetTimeZone(), "HH:mm:ss");
    
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

    return ContentService.createTextOutput(JSON.stringify({ status: 'ok', updated: (filaEncontrada > -1) }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
