import { useState, useEffect, useRef } from 'react';

// URL de tu Google Apps Script (publicada como Web App, acceso público)
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbynpRBhFHSITLYQoDyBv5BaI3tQanJ9n2gCjDhMRhFl179hj4aW5MhuyJcaTb7tcoClbg/exec';

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
    'Prensa',
    'Municipales',
    'Comunales',
    'Asesores',
    'Familiar'
  ];

  // Dispara intento de pautada al escanear
  useEffect(() => {
    if (!modoManual && input.length > 20) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(handlePautada, 1000);
    }
  }, [input, modoManual]);

  // 1) Intento de visita pautada
  async function handlePautada() {
    const dni = modoManual ? input.trim() : parseDNI(input);
    const nombre = modoManual ? manualNombre.trim() : parseNombre(input);

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
    setPendingNombre(nombre);

    try {
      const res = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          tipo: 'visita',
          subtipo: 'pautada',
          nombre,
          dni,
          motivo: ''
        })
      });
      const data = await res.json();

      if (data.success) {
        // Muestro también el motivo traído de Pautados
        setMensaje(`✅ ${data.mensaje} (${data.motivo}) a las ${data.hora}`);
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

  // 2) Registro de visita común tras elegir motivo
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

  // Helpers para parsear scan
  function parseDNI(raw) {
    const esc = raw.match(/"M"(\d{7,8})"/);
    if (esc) return esc[1];
    const man = raw.trim().match(/^(\d{7,8})$/);
    return man ? man[1] : null;
  }
  function parseNombre(raw) {
    const parts = raw.split('"');
    return [parts[1], parts[2]].filter(Boolean).join(' ').trim();
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
        placeholder={modoManual ? 'Ingresá el DNI a mano' : 'Escaneá el código del DNI'}
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

      <p className={mensaje.includes('✅') ? 'success' : 'error'}>
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
