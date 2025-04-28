import { useState, useEffect, useRef } from 'react';

function RegistroAsistencia() {
  const [input, setInput] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [modoManual, setModoManual] = useState(false);
  const [datosPersona, setDatosPersona] = useState(null);
  const [horaRegistro, setHoraRegistro] = useState('');
  const timeoutRef = useRef(null);

  // Detectar escaneo automático
  useEffect(() => {
    if (!modoManual && input.length > 20) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(handleSubmit, 1000);
    }
  }, [input, modoManual]);

  const handleSubmit = async () => {
    const dni = parseDNI(input);
    if (!dni) {
      setMessage('❌ No se pudo extraer el DNI.');
      return;
    }

    setLoading(true);
    setDisabled(true);
    setMessage('Registrando...');
    setDatosPersona(null);

    try {
      const res = await fetch(
        "https://script.google.com/macros/s/AKfycbynpRBhFHSITLYQoDyBv5BaI3tQanJ9n2gCjDhMRhFl179hj4aW5MhuyJcaTb7tcoClbg/exec",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ tipo: "asistencia", dni }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setMessage(data.mensaje);
        setDatosPersona({
          nombre: data.nombre,
          apellido: data.apellido,
          dni: data.dni,
          cargo: data.cargo,
        });
        setHoraRegistro(data.hora);
      } else {
        setMessage(data.mensaje || "❌ No se pudo registrar asistencia.");
      }
      setInput('');
    } catch (err) {
      console.error(err);
      setMessage("❌ Error al registrar asistencia.");
    } finally {
      setLoading(false);
      setTimeout(() => setDisabled(false), 1000);
    }
  };

  // Ahora detecta cadenas tipo "M"12345678" y también solo dígitos manuales
  const parseDNI = raw => {
    // caso manual: exactamente 7 u 8 dígitos
    const manual = raw.trim().match(/^\d{7,8}$/);
    if (manual) return manual[0];
    // caso escaneo: "...\"M\"12345678\"..."
    const escaneado = raw.match(/"M"(\d{7,8})"/);
    return escaneado ? escaneado[1] : null;
  };

  return (
    <div className="card">
      <h1 className="title">Registro de Asistencia</h1>
      <div className="mode-buttons">
        <button
          className={`btn-left ${!modoManual ? 'btn-active' : ''}`}
          onClick={() => setModoManual(false)}
        >
          Escáner
        </button>
        <button
          className={`btn-right ${modoManual ? 'btn-active' : ''}`}
          onClick={() => setModoManual(true)}
        >
          Manual
        </button>
      </div>

      <input
        type="text"
        placeholder={modoManual ? "Ingresá el DNI a mano" : "Escaneá el código del DNI"}
        value={input}
        onChange={e => setInput(e.target.value)}
        className="input"
        autoFocus
        disabled={disabled}
        onKeyDown={e => modoManual && e.key === 'Enter' && handleSubmit()}
      />

      {modoManual && (
        <button onClick={handleSubmit} className="submit-button" disabled={disabled}>
          Registrar asistencia
        </button>
      )}

      <p className={`message ${message.includes("registrada") ? "success" : "error"}`}>
        {loading ? "Registrando..." : message}
      </p>

      {datosPersona && (
        <div className="datos">
          <h2 className="datos-title">✅ Asistencia registrada</h2>
          <p><strong>Nombre:</strong> {datosPersona.nombre}</p>
          <p><strong>Apellido:</strong> {datosPersona.apellido}</p>
          <p><strong>DNI:</strong> {datosPersona.dni}</p>
          <p><strong>Cargo:</strong> {datosPersona.cargo}</p>
          <p className="hora">Registrado a las {horaRegistro}</p>
        </div>
      )}
    </div>
  );
}

export default RegistroAsistencia;
