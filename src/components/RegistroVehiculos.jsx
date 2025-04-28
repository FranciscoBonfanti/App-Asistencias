import { useState, useEffect, useRef } from 'react';

// URL de tu Apps Script (Web App)
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby8Tx8upOWZW7NZ-wynZp63lj9CBExwIwjAFvPk4AevdDfjetN44gAiA-odgUOZ_rXYOg/exec';

export default function RegistroVehiculos() {
  const [input, setInput]             = useState('');
  const [modoManual, setModoManual]   = useState(false);
  const [patenteManual, setPatenteManual]     = useState('');
  const [autoManual, setAutoManual]           = useState('');
  const [propManual, setPropManual]           = useState('');
  const [mensaje, setMensaje]         = useState('');
  const [loading, setLoading]         = useState(false);
  const timeoutRef = useRef(null);

  // Al escanear, dispara registro automático
  useEffect(() => {
    if (!modoManual && input.length >= 5) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(handleScan, 800);
    }
    return () => clearTimeout(timeoutRef.current);
  }, [input, modoManual]);

  // Extrae patente de la cadena escaneada (simplemente trim+uppercase)
  function parsePatente(raw) {
    return raw.trim().toUpperCase();
  }

  // 1) Modo Escáner
  async function handleScan() {
    const p = parsePatente(input);
    if (!p) {
      setMensaje('❌ No se pudo extraer la patente.');
      return;
    }
    setLoading(true);
    setMensaje('');
    try {
      const res = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          tipo: 'vehiculo',
          nombre: p    // usamos "nombre" para la patente
        })
      });
      const data = await res.json();
      if (data.success) {
        setMensaje(
          `✅ ${data.mensaje} — ${data.patente} | ${data.auto} | ${data.propietario} a las ${data.hora}`
        );
      } else {
        setMensaje(`❌ ${data.mensaje}`);
      }
    } catch (err) {
      console.error(err);
      setMensaje('❌ Error de conexión.');
    } finally {
      setLoading(false);
      setInput('');
    }
  }

  // 2) Modo Manual
  async function handleManual() {
    const p = patenteManual.trim().toUpperCase();
    if (!p || !autoManual.trim() || !propManual.trim()) {
      setMensaje('❌ Completar Patente, Auto y Propietario.');
      return;
    }
    setLoading(true);
    setMensaje('');
    try {
      const res = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          tipo:   'vehiculo',
          manual: 'true',
          nombre: p,
          auto:   autoManual.trim(),
          propietario: propManual.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        setMensaje(
          `✅ ${data.mensaje} — ${data.patente} | ${data.auto} | ${data.propietario} a las ${data.hora}`
        );
        setPatenteManual('');
        setAutoManual('');
        setPropManual('');
      } else {
        setMensaje(`❌ ${data.mensaje}`);
      }
    } catch (err) {
      console.error(err);
      setMensaje('❌ Error de conexión.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h2>Registro de Vehículos</h2>

      <div className="mode-buttons">
        <button
          className={!modoManual ? 'btn-active' : ''}
          onClick={() => setModoManual(false)}
        >Ingresar Patente</button>
        <button
          className={modoManual ? 'btn-active' : ''}
          onClick={() => setModoManual(true)}
        >Carga Manual</button>
      </div>

      {modoManual ? (
        <>
          <input
            className="input"
            placeholder="Patente"
            value={patenteManual}
            onChange={e => setPatenteManual(e.target.value)}
            disabled={loading}
          />
          <input
            className="input"
            placeholder="Auto"
            value={autoManual}
            onChange={e => setAutoManual(e.target.value)}
            disabled={loading}
          />
          <input
            className="input"
            placeholder="Propietario"
            value={propManual}
            onChange={e => setPropManual(e.target.value)}
            disabled={loading}
          />
          <button
            className="submit-button"
            onClick={handleManual}
            disabled={loading}
          >
            {loading ? 'Registrando...' : 'Registrar ingreso'}
          </button>
        </>
      ) : (
        <input
          className="input"
          placeholder="Ingresa la Patente"
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={loading}
          autoFocus
        />
      )}

      {mensaje && (
        <p className={mensaje.startsWith('✅') ? 'success' : 'error'}>
          {mensaje}
        </p>
      )}
    </div>
  );
}
