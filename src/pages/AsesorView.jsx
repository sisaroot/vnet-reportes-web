import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Plus, Trash2, Send, Camera, ArrowLeft } from 'lucide-react';

export default function AsesorView() {
    const navigate = useNavigate();
    const [clientData, setClientData] = useState({
        nombre_cliente: '',
        cedula_contrato: '',
    });

    const [pagos, setPagos] = useState([
        { id: 1, monto: '', cedula_cuenta: '', telefono_bancario: '', fecha_pago: '', fileName: '' }
    ]);

    const handlePagoChange = (id, field, value) => {
        setPagos(pagos.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    const handleFileChange = (id, e) => {
        const file = e.target.files[0];
        if (file) {
            handlePagoChange(id, 'fileName', file.name);
        }
    };

    const agregarPago = () => {
        setPagos([...pagos, { id: Date.now(), monto: '', cedula_cuenta: '', telefono_bancario: '', fecha_pago: '', fileName: '' }]);
    };

    const eliminarPago = (id) => {
        if (pagos.length === 1) return;
        setPagos(pagos.filter(p => p.id !== id));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        alert(`Reporte enviado con ${pagos.length} comprobantes para el cliente ${clientData.nombre_cliente}`);
        // Clear form after simulation
        setClientData({ nombre_cliente: '', cedula_contrato: '' });
        setPagos([{ id: Date.now(), monto: '', cedula_cuenta: '', telefono_bancario: '', fecha_pago: '', fileName: '' }]);
    };

    return (
        <div className="container" style={{ paddingBottom: '4rem' }}>

            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', margin: 0 }}>Panel de Asesor</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Nuevo Reporte de Pago</p>
                </div>
                <button className="btn" style={{ background: 'var(--glass-bg)', color: 'var(--accent-danger)' }} onClick={() => navigate('/login')}>
                    <LogOut size={18} />
                    <span className="hide-mobile">Salir</span>
                </button>
            </header>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                {/* Datos del Cliente */}
                <section className="glass-panel fade-in">
                    <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ color: 'var(--accent-primary)' }}>1.</span> Datos del Cliente
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <div className="input-group" style={{ margin: 0 }}>
                            <label>Nombre y Apellido</label>
                            <input
                                type="text" required placeholder="Ej: Juan Perez"
                                value={clientData.nombre_cliente}
                                onChange={e => setClientData({ ...clientData, nombre_cliente: e.target.value })}
                            />
                        </div>
                        <div className="input-group" style={{ margin: 0 }}>
                            <label>Cédula de Contrato</label>
                            <input
                                type="text" required placeholder="V-12345678"
                                value={clientData.cedula_contrato}
                                onChange={e => setClientData({ ...clientData, cedula_contrato: e.target.value })}
                            />
                        </div>
                    </div>
                </section>

                {/* Pagos / Transferencias */}
                <section className="glass-panel fade-in" style={{ animationDelay: '0.1s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ color: 'var(--accent-primary)' }}>2.</span> Detalles de los Pagos
                        </h3>
                        <button type="button" className="btn" onClick={agregarPago} style={{ background: 'rgba(46, 160, 67, 0.2)', color: 'var(--accent-success)' }}>
                            <Plus size={16} /> Añadir otro pago
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {pagos.map((pago, index) => (
                            <div key={pago.id} style={{
                                background: 'rgba(0,0,0,0.2)', padding: '1.25rem', borderRadius: '8px',
                                borderLeft: '4px solid var(--accent-primary)', position: 'relative'
                            }}>
                                <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                                    {pagos.length > 1 && (
                                        <button type="button" onClick={() => eliminarPago(pago.id)} style={{ background: 'none', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer', padding: '0.5rem' }}>
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>

                                <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Pago / Transferencia #{index + 1}</h4>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                                    <div className="input-group" style={{ margin: 0 }}>
                                        <label>Monto</label>
                                        <input
                                            type="text" required placeholder="Ej: 20$"
                                            value={pago.monto} onChange={e => handlePagoChange(pago.id, 'monto', e.target.value)}
                                        />
                                    </div>
                                    <div className="input-group" style={{ margin: 0 }}>
                                        <label>Fecha del Pago</label>
                                        <input
                                            type="date" required
                                            value={pago.fecha_pago} onChange={e => handlePagoChange(pago.id, 'fecha_pago', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                                    <div className="input-group" style={{ margin: 0 }}>
                                        <label>Cédula de la Cuenta</label>
                                        <input
                                            type="text" required placeholder="Cédula del titular"
                                            value={pago.cedula_cuenta} onChange={e => handlePagoChange(pago.id, 'cedula_cuenta', e.target.value)}
                                        />
                                    </div>
                                    <div className="input-group" style={{ margin: 0 }}>
                                        <label>Teléfono (Solo si es Pago Móvil)</label>
                                        <input
                                            type="text" placeholder="0412-1234567"
                                            value={pago.telefono_bancario} onChange={e => handlePagoChange(pago.id, 'telefono_bancario', e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* File Upload Simulator */}
                                <div className="input-group" style={{ margin: 0 }}>
                                    <label>Comprobante o Captura</label>
                                    <div style={{
                                        border: '2px dashed var(--glass-border)', borderRadius: '8px',
                                        padding: '1.5rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)',
                                        cursor: 'pointer', position: 'relative'
                                    }}>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            required
                                            onChange={(e) => handleFileChange(pago.id, e)}
                                            style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%' }}
                                        />
                                        <Camera size={32} color="var(--text-secondary)" style={{ marginBottom: '0.5rem' }} />
                                        <p style={{ margin: 0, color: pago.fileName ? 'var(--accent-success)' : 'var(--text-secondary)' }}>
                                            {pago.fileName ? pago.fileName : 'Toca para adjuntar imagen del pago'}
                                        </p>
                                    </div>
                                </div>

                            </div>
                        ))}
                    </div>
                </section>

                {/* Submit */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', maxWidth: '300px', padding: '1rem', fontSize: '1.1rem' }}>
                        <Send size={20} />
                        Enviar Reporte Completo
                    </button>
                </div>

            </form>

        </div>
    );
}
