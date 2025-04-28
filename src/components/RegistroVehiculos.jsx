import { useState } from 'react';

// URL de tu Apps Script (Web App)
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbynpRBhFHSITLYQoDyBv5BaI3tQanJ9n2gCjDhMRhFl179hj4aW5MhuyJcaTb7tcoClbg/exec';

export default function RegistroVehiculos() {
  const [patente, setPatente] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegistro = async () => {
    const p = patente.trim().toUpperCase();
    if (!p) {
      setMensaje('❌ Ingresá una patente válida.');
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
          nombre: p // usamos "nombre" para la patente
        })
      });

      // Si el status no es 200, lo tratamos como error
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Error ${res.status}`);
      }

      // Miramos el content-type antes de json
      const ct = res.headers.get('Content-Type') || '';
      let data;
      if (ct.includes('application/json')) {
        data = await res.json();
      } else {
        // no es JSON, caemos en error con el texto crudo
        const text = await res.text();
        throw new Error(text);
      }

      if (data.success) {
        setMensaje(
          `✅ ${data.mensaje} — ${data.patente} | ${data.auto} | ${data.propietario} a las ${data.hora}`
        );
        setPatente('');
      } else {
        // respuesta JSON válida pero success=false
        setMensaje(`❌ ${data.mensaje}`);
      }

    } catch (err) {
      console.error(err);
      // err.message tendrá el texto plano o el mensaje de error
      setMensaje(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Registro de Vehículos</h2>
      <input
        className="input"
        placeholder="Ingresá la Patente"
        value={patente}
        onChange={e => setPatente(e.target.value)}
        disabled={loading}
        onKeyDown={e => e.key === 'Enter' && handleRegistro()}
      />
      <button
        className="submit-button"
        onClick={handleRegistro}
        disabled={loading}
      >
        {loading ? 'Registrando...' : 'Registrar ingreso'}
      </button>
      {mensaje && (
        <p className={mensaje.startsWith('✅') ? 'success' : 'error'}>
          {mensaje}
        </p>
      )}
    </div>
  );
}
