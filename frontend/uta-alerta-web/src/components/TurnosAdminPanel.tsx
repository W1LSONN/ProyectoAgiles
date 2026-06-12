import { useState, useEffect } from 'react';
import './TurnosAdminPanel.css';

const INCIDENT_URL = import.meta.env.VITE_INCIDENT_URL ?? 'http://localhost:5008';

interface Turno {
    idTurno: number;
    nombreTurno: string;
    horaInicio: string; // TimeSpan format "HH:mm:ss"
    horaFin: string;
    idGuardia: number;
    nombreGuardia: string;
    diaSemana: string;
    activo: boolean;
}

const TurnosAdminPanel = () => {
    const [turnos, setTurnos] = useState<Turno[]>([]);
    const [cargando, setCargando] = useState(true);
    
    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [editando, setEditando] = useState<Turno | null>(null);
    const [formData, setFormData] = useState({
        nombreTurno: '',
        horaInicio: '08:00',
        horaFin: '16:00',
        idGuardia: 0,
        nombreGuardia: '',
        diaSemana: 'Todos'
    });

    const cargarTurnos = async () => {
        try {
            setCargando(true);
            const res = await fetch(`${INCIDENT_URL}/api/turnos?soloActivos=true`);
            if (res.ok) {
                const data = await res.json();
                setTurnos(data);
            }
        } catch (error) {
            console.error("Error cargando turnos", error);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarTurnos();
    }, []);

    const abrirModalNuevo = () => {
        setEditando(null);
        setFormData({
            nombreTurno: '',
            horaInicio: '08:00',
            horaFin: '16:00',
            idGuardia: 0,
            nombreGuardia: '',
            diaSemana: 'Todos'
        });
        setShowModal(true);
    };

    const abrirModalEditar = (turno: Turno) => {
        setEditando(turno);
        setFormData({
            nombreTurno: turno.nombreTurno,
            horaInicio: turno.horaInicio.substring(0, 5), // "08:00:00" -> "08:00"
            horaFin: turno.horaFin.substring(0, 5),
            idGuardia: turno.idGuardia,
            nombreGuardia: turno.nombreGuardia,
            diaSemana: turno.diaSemana
        });
        setShowModal(true);
    };

    const guardarTurno = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Formatear tiempos para C# TimeSpan (añadir :00)
            const payload = {
                ...formData,
                horaInicio: `${formData.horaInicio}:00`,
                horaFin: `${formData.horaFin}:00`,
                idGuardia: Number(formData.idGuardia)
            };

            const url = editando 
                ? `${INCIDENT_URL}/api/turnos/${editando.idTurno}`
                : `${INCIDENT_URL}/api/turnos`;
            
            const method = editando ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setShowModal(false);
                cargarTurnos();
            } else {
                alert("Error al guardar turno");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const desactivarTurno = async (id: number) => {
        if (!confirm("¿Seguro que deseas desactivar este turno?")) return;
        try {
            const res = await fetch(`${INCIDENT_URL}/api/turnos/${id}`, { method: 'DELETE' });
            if (res.ok) cargarTurnos();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="turnos-panel">
            <div className="turnos-header">
                <h2>Gestión de Turnos</h2>
                <button onClick={abrirModalNuevo} className="btn-primary">+ Nuevo Turno</button>
            </div>

            <div className="turnos-content">
                {cargando ? (
                    <div className="loading">Cargando turnos...</div>
                ) : turnos.length === 0 ? (
                    <div className="empty">No hay turnos registrados.</div>
                ) : (
                    <div className="grid-turnos">
                        {turnos.map(turno => (
                            <div key={turno.idTurno} className="turno-card">
                                <h3>{turno.nombreTurno}</h3>
                                <div className="turno-horario">
                                    <span className="icon">🕒</span> 
                                    {turno.horaInicio.substring(0, 5)} - {turno.horaFin.substring(0, 5)}
                                </div>
                                <div className="turno-detalle">
                                    <p><strong>Guardia:</strong> {turno.nombreGuardia || 'Cualquiera (Global)'} {turno.idGuardia !== 0 && `(ID: ${turno.idGuardia})`}</p>
                                    <p><strong>Días:</strong> {turno.diaSemana}</p>
                                </div>
                                <div className="turno-acciones">
                                    <button onClick={() => abrirModalEditar(turno)} className="btn-edit">✏️ Editar</button>
                                    <button onClick={() => desactivarTurno(turno.idTurno)} className="btn-delete">🗑️ Eliminar</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal de Crear/Editar */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>{editando ? 'Editar Turno' : 'Nuevo Turno'}</h3>
                        <form onSubmit={guardarTurno}>
                            <div className="form-group">
                                <label>Nombre del Turno</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={formData.nombreTurno}
                                    onChange={e => setFormData({...formData, nombreTurno: e.target.value})}
                                    placeholder="Ej: Turno Mañana"
                                />
                            </div>
                            
                            <div className="form-row">
                                <div className="form-group half">
                                    <label>Hora Inicio</label>
                                    <input 
                                        type="time" 
                                        required 
                                        value={formData.horaInicio}
                                        onChange={e => setFormData({...formData, horaInicio: e.target.value})}
                                    />
                                </div>
                                <div className="form-group half">
                                    <label>Hora Fin</label>
                                    <input 
                                        type="time" 
                                        required 
                                        value={formData.horaFin}
                                        onChange={e => setFormData({...formData, horaFin: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Día(s) de la semana</label>
                                <select 
                                    value={formData.diaSemana}
                                    onChange={e => setFormData({...formData, diaSemana: e.target.value})}
                                >
                                    <option value="Todos">Todos los días</option>
                                    <option value="Lunes">Lunes</option>
                                    <option value="Martes">Martes</option>
                                    <option value="Miércoles">Miércoles</option>
                                    <option value="Jueves">Jueves</option>
                                    <option value="Viernes">Viernes</option>
                                    <option value="Sábado">Sábado</option>
                                    <option value="Domingo">Domingo</option>
                                </select>
                            </div>

                            <div className="form-row">
                                <div className="form-group half">
                                    <label>ID Guardia (0 = Todos)</label>
                                    <input 
                                        type="number" 
                                        value={formData.idGuardia}
                                        onChange={e => setFormData({...formData, idGuardia: parseInt(e.target.value) || 0})}
                                    />
                                </div>
                                <div className="form-group half">
                                    <label>Nombre Guardia</label>
                                    <input 
                                        type="text" 
                                        value={formData.nombreGuardia}
                                        onChange={e => setFormData({...formData, nombreGuardia: e.target.value})}
                                        placeholder="Opcional"
                                    />
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-cancel">Cancelar</button>
                                <button type="submit" className="btn-save">Guardar Turno</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TurnosAdminPanel;
