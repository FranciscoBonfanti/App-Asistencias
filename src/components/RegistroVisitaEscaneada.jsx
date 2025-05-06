import { useState, useEffect, useRef } from 'react';

// URL de tu Google Apps Script (publicada como Web App)
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby8Tx8upOWZW7NZ-wynZp63lj9CBExwIwjAFvPk4AevdDfjetN44gAiA-odgUOZ_rXYOg/exec';

export default function RegistroVisitaEscaneada() {
  const [input, setInput] = useState('');
  const [modoManual, setModoManual] = useState(false);
  const [manualNombre, setManualNombre] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(false);
  const [mostrarPopup, setMostrarPopup] = useState(false);
  const [pendingDni, setPendingDni] = useState('');
  const [pendingNombre, setPendingNombre] = useState('');
  const timeoutRef = useRef(null);

  const motivosAlternativos = [
    'Visita guiada',
    'Contingente',
    'Prensa',
    'Ceremonial y protocolo',
    'Asistente Técnico'
  ];

  //  Dispara intento de "pautada" tras escaneo de QR o barcode
  useEffect(() => {
    if (!modoManual && input.length > 10) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(handlePautada, 800);
    }
  }, [input, modoManual]);

  // 1) Intento de visita pautada
  async function handlePautada() {
    // parseamos
    let dni, nombre, motivo;
    if (modoManual) {
      dni = input.trim();
      nombre = manualNombre.trim();
      motivo = '';
    } else {
      ({ dni, nombre, motivo } = parseInput(input));
    }

    if (!dni) {
      setMensaje('❌ No se pudo extraer el DNI.');
      return;
    }
    if (modoManual && !nombre) {
      setMensaje('❌ Debés ingresar el Nombre.');
      return;
    }

    setLoading(true);
    setMensaje('');
    setPendingDni(dni);
    setPendingNombre(nombre || '');

    try {
      const res = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          tipo: 'visita',
          subtipo: 'pautada',
          nombre: nombre || '',
          dni,
          motivo: '' // forzamos al servidor a usar su motivo de Pautados
        })
      });
      const data = await res.json();

      if (data.success) {
        setMensaje(
          `✅ ${data.mensaje}: ${data.nombre} (${data.motivo}) a las ${data.hora}`
        );
      } else if (data.necesitaMotivo) {
        setMostrarPopup(true);
      } else {
        setMensaje('❌ Error al registrar visita.');
      }
    } catch {
      setMensaje('❌ Error de conexión.');
    } finally {
      setLoading(false);
      setInput('');
      setManualNombre('');
    }
  }

  // 2) Si el servidor pide motivo, registramos como visita común
  async function handleComun(motivo) {
    setMostrarPopup(false);
    setLoading(true);
    try {
      const res = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          tipo: 'visita',
          subtipo: 'comun',
          nombre: pendingNombre,
          dni: pendingDni,
          motivo
        })
      });
      const data = await res.json();
      if (data.success) {
        setMensaje(`✅ ${data.mensaje} a las ${data.hora}`);
      } else {
        setMensaje('❌ No se pudo registrar la visita.');
      }
    } catch {
      setMensaje('❌ Error registrando motivo.');
    } finally {
      setLoading(false);
      setPendingDni('');
      setPendingNombre('');
    }
  }

  // ------ PARSER ------ 
  function parseInput(raw) {
    // 1) si viene URL de QR, sacamos payload después de "data="
    let payload = raw;
    const idx = raw.indexOf('data=');
    if (idx !== -1) {
      payload = raw.slice(idx + 5);
    }

    // 2) intento extraer barcode tipo "M"44025563" u otros 7-8 dígitos
    let mBar = payload.match(/"M"?(\d{7,8})/);
    if (!mBar) mBar = payload.match(/\b(\d{7,8})\b/);
    if (mBar && payload.includes('"M"')) {
      return { dni: mBar[1], nombre: '', motivo: '' };
    }

    // 3) si llegamos aquí, asumimos QR estilo:
    //    [16 caracteres fecha/hora] [NombreApellido][DNI][Motivo][...]
    //    Fecha/hora ocupa siempre 16 chars: "dd/MM/yyyy HH:mm"
    if (payload.length < 20) {
      return { dni: null, nombre: '', motivo: '' };
    }
    // cortamos la parte inicial de 16 chars:
    const afterDate = payload.slice(16);
    // Regex para: nombre+apellido (todo NO-dígito), luego DNI 7-8 dígitos, luego resto
    const m = afterDate.match(/^([^\d]+?)(\d{7,8})(.+)$/);
    if (!m) {
      return { dni: null, nombre: '', motivo: '' };
    }
    let [ , nameRaw, dni, rest ] = m;
    // insertamos espacio entre palabra y mayúsculas:
    const nombre = nameRaw
      .replace(/([a-záéíóúñ])([A-ZÁÉÍÓÚÑ])/g, '$1 $2')
      .trim();
    // en 'rest' arrancamos con motivo hasta antes de la próxima fecha
    const fechaPos = rest.search(/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/);
    const motivo = fechaPos > -1
      ? rest.slice(0, fechaPos).trim()
      : rest.trim();

    return { dni, nombre, motivo };
  }

  return (
    <div className="card">
      <h2>Registro de Visita</h2>

      <div className="mode-buttons">
        <button
          className={!modoManual ? 'btn-active' : ''}
          onClick={() => setModoManual(false)}
        >
          Escanear DNI
        </button>
        <button
          className={modoManual ? 'btn-active' : ''}
          onClick={() => setModoManual(true)}
        >
          Manual
        </button>
      </div>

      {modoManual && (
        <input
          className="input"
          placeholder="Ingresá el Nombre"
          value={manualNombre}
          onChange={e => setManualNombre(e.target.value)}
          disabled={loading}
        />
      )}

      <input
        className="input"
        placeholder={
          modoManual
            ? 'Ingresá el DNI a mano'
            : 'Escaneá el código de barras o QR'
        }
        value={input}
        onChange={e => setInput(e.target.value)}
        disabled={loading}
        autoFocus
        onKeyDown={e =>
          modoManual && e.key === 'Enter' && handlePautada()
        }
      />

      {modoManual && (
        <button
          className="submit-button"
          onClick={handlePautada}
          disabled={loading}
        >
          Registrar visita
        </button>
      )}

      <p className={mensaje.startsWith('✅') ? 'success' : 'error'}>
        {mensaje}
      </p>

      {mostrarPopup && (
        <div className="popup-overlay">
          <div className="popup">
            <h3>Seleccioná un motivo</h3>
            <div className="motivo-opciones">
              {motivosAlternativos.map(m => (
                <button key={m} onClick={() => handleComun(m)}>
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
