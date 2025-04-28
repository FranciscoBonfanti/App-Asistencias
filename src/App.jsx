import RegistroAsistencia from './components/RegistroAsistencia';
import RegistroVisitaEscaneada from './components/RegistroVisitaEscaneada';
import RegistroVehiculos from './components/RegistroVehiculos';
import './index.css';

function App() {
  return (
    <div className="container">
      <RegistroAsistencia />
      {/* <hr style={{ margin: '0.5rem 0' }} /> */}
      <RegistroVisitaEscaneada />
      {/* <hr style={{ margin: '0.5rem 0' }} /> */}
      <RegistroVehiculos />
    </div>
  );
}

export default App;
