import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, CheckCircle, Clock, Search, CornerUpLeft, X, Send, Camera, Eye, Loader, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function AdminView() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('pendiente');

    // Modal state para devolver (rechazar)
    const [modalAbierto, setModalAbierto] = useState(false);
    const [reporteSeleccionado, setReporteSeleccionado] = useState(null);
    const [mensajeDevolucion, setMensajeDevolucion] = useState('');
    const [imagenAdjunta, setImagenAdjunta] = useState(null);

    // Modal state para aprobar (con imagen opcional)
    const [modalAprobarAbierto, setModalAprobarAbierto] = useState(false);
    const [reporteParaAprobar, setReporteParaAprobar] = useState(null);
    const [mensajeAprobacion, setMensajeAprobacion] = useState('');
    const [imagenAprobacion, setImagenAprobacion] = useState(null);

    const [loading, setLoading] = useState(true);
    const [reportes, setReportes] = useState([]);
    const [pagosAsociados, setPagosAsociados] = useState({}); // Mapa reporte_id -> pagos[]

    // Polling básico para simular tiempo real si no usamos WebSockets completos
    useEffect(() => {
        cargarReportes();
    }, [activeTab]);

    const cargarReportes = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('reportes')
                .select('*')
                .eq('estado', activeTab) // 'pendiente' o 'procesado'
                .order('created_at', { ascending: false });

            if (error) throw error;
            setReportes(data || []);

            // Cargar transferencias asociadas para cada reporte
            if (data && data.length > 0) {
                const reporteIds = data.map(r => r.id);
                const { data: pagosData, error: pagosError } = await supabase
                    .from('pagos_asociados')
                    .select('*')
                    .in('reporte_id', reporteIds);

                if (pagosError) throw pagosError;

                const pagosMap = {};
                pagosData.forEach(p => {
                    if (!pagosMap[p.reporte_id]) pagosMap[p.reporte_id] = [];
                    pagosMap[p.reporte_id].push(p);
                });
                setPagosAsociados(pagosMap);
            }
        } catch (error) {
            console.error("Error cargando reportes:", error);
        } finally {
            setLoading(false);
        }
    };

    const abrirAprobacion = (rep) => {
        setReporteParaAprobar(rep);
        setMensajeAprobacion('Pago verificado y aprobado.');
        setImagenAprobacion(null);
        setModalAprobarAbierto(true);
    };

    const handleAprobar = async (e) => {
        e.preventDefault();
        try {
            let imagen_url = null;

            if (imagenAprobacion) {
                const fileExt = imagenAprobacion.name.split('.').pop();
                const fileName = `admin_apro_${reporteParaAprobar.id}_${Date.now()}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('comprobantes')
                    .upload(`admin/${fileName}`, imagenAprobacion);

                if (uploadError) throw uploadError;

                const { data: publicUrlData } = supabase.storage
                    .from('comprobantes')
                    .getPublicUrl(`admin/${fileName}`);

                imagen_url = publicUrlData.publicUrl;
            }

            const { error } = await supabase
                .from('reportes')
                .update({
                    estado: 'procesado',
                    mensaje_admin: mensajeAprobacion,
                    imagen_admin_url: imagen_url
                })
                .eq('id', reporteParaAprobar.id);

            if (error) throw error;

            alert('Reporte aprobado exitosamente.');
            setModalAprobarAbierto(false);
            cargarReportes(); // Recargar lista
        } catch (error) {
            console.error("Error al aprobar:", error);
            alert('Error al aprobar el reporte.');
        }
    };

    const abrirDevolucion = (rep) => {
        setReporteSeleccionado(rep);
        setMensajeDevolucion('');
        setImagenAdjunta(null);
        setModalAbierto(true);
    };

    const handleDevolver = async (e) => {
        e.preventDefault();
        try {
            let imagen_url = null;

            if (imagenAdjunta) {
                const fileExt = imagenAdjunta.name.split('.').pop();
                const fileName = `admin_dev_${reporteSeleccionado.id}_${Date.now()}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('comprobantes')
                    .upload(`admin/${fileName}`, imagenAdjunta);

                if (uploadError) throw uploadError;

                const { data: publicUrlData } = supabase.storage
                    .from('comprobantes')
                    .getPublicUrl(`admin/${fileName}`);

                imagen_url = publicUrlData.publicUrl;
            }

            const { error } = await supabase
                .from('reportes')
                .update({
                    estado: 'devuelto',
                    mensaje_admin: mensajeDevolucion,
                    imagen_admin_url: imagen_url
                })
                .eq('id', reporteSeleccionado.id);

            if (error) throw error;

            alert(`Reporte devuelto exitosamente a @${reporteSeleccionado.asesor_id}.`);
            setModalAbierto(false);
            cargarReportes(); // Recargar
        } catch (error) {
            console.error("Error al devolver:", error);
            alert("Hubo un problema procesando la devolución.");
        }
    };

    // Función auxiliar para descargar la imagen en el navegador del admin
    const descargarImagen = async (url, nombreArchivo) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const urlBlob = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = urlBlob;
            a.download = nombreArchivo || 'capture.png';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(urlBlob);
        } catch (error) {
            console.error("No se pudo descargar:", error);
            // Fallback: abrir en nueva pestaña
            window.open(url, '_blank');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('vnet_user');
        localStorage.removeItem('vnet_role');
        navigate('/login');
    };

    return (
        <div className="container" style={{ paddingBottom: '4rem', position: 'relative' }}>

            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', margin: 0, color: 'var(--accent-warning)' }}>Dashboard Admin</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Gestión de Reportes de Pago</p>
                </div>
                <button className="btn" style={{ background: 'var(--glass-bg)', color: 'var(--accent-danger)' }} onClick={handleLogout}>
                    <LogOut size={18} />
                    <span className="hide-mobile">Salir</span>
                </button>
            </header>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <button
                    className="btn"
                    style={{ flex: 1, background: activeTab === 'pendiente' ? 'var(--accent-primary)' : 'var(--glass-bg)', color: '#fff' }}
                    onClick={() => setActiveTab('pendiente')}
                >
                    <Clock size={18} /> Pendientes
                </button>
                <button
                    className="btn"
                    style={{ flex: 1, background: activeTab === 'procesado' ? 'var(--accent-success)' : 'var(--glass-bg)', color: '#fff' }}
                    onClick={() => setActiveTab('procesado')}
                >
                    <CheckCircle size={18} /> Procesados
                </button>
            </div>

            <div className="glass-panel fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <h3 style={{ margin: 0, textTransform: 'capitalize' }}>
                        Reportes {activeTab}s
                    </h3>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                        <Loader className="spin" size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                        <p>Cargando Base de Datos...</p>
                    </div>
                ) : reportes.length > 0 ? (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {reportes.map(rep => {
                            const pagos = pagosAsociados[rep.id] || [];
                            return (
                                <div key={rep.id} style={{
                                    background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '8px',
                                    borderLeft: `4px solid ${activeTab === 'pendiente' ? 'var(--accent-warning)' : 'var(--accent-success)'}`
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                                        <div>
                                            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--accent-primary)', fontSize: '1.2rem' }}>
                                                Titular del Contrato: {rep.cedula_contrato}
                                            </h4>
                                            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                                Enviado por: <strong style={{ color: '#fff' }}>@{rep.asesor_id}</strong> | {new Date(rep.created_at).toLocaleString()}
                                            </p>
                                            {rep.observacion && (
                                                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.95rem', color: '#fff' }}>
                                                    <strong>📝 Observación:</strong> <i>{rep.observacion}</i>
                                                </p>
                                            )}
                                        </div>
                                        {activeTab === 'pendiente' && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                <button className="btn" style={{ background: 'var(--accent-success)', color: '#fff' }} onClick={() => abrirAprobacion(rep)}>
                                                    <CheckCircle size={18} /> Aprobar
                                                </button>
                                                <button className="btn" style={{ background: 'var(--glass-bg)', color: 'var(--accent-warning)' }} onClick={() => abrirDevolucion(rep)}>
                                                    <CornerUpLeft size={18} /> Devolver
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Lista de transferencias adjuntas con todos los detalles */}
                                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '6px' }}>
                                        <p style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 'bold' }}>
                                            {pagos.length} Comprobante(s) Adjunto(s):
                                        </p>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            {pagos.map((p, idx) => (
                                                <div key={p.id} style={{
                                                    display: 'flex', flexDirection: 'column', gap: '0.5rem',
                                                    background: 'var(--glass-bg)', padding: '1rem', borderRadius: '8px',
                                                    border: '1px solid rgba(255,255,255,0.05)'
                                                }}>

                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                                        <div>
                                                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', display: 'block' }}>CI Cuenta Origen</span>
                                                            <strong style={{ fontSize: '1.1rem' }}>{p.cedula_cuenta}</strong>
                                                        </div>
                                                        <div>
                                                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', display: 'block' }}>Teléfono (Pago Móvil)</span>
                                                            <strong style={{ fontSize: '1.1rem' }}>{p.telefono_bancario || 'N/A'}</strong>
                                                        </div>
                                                        <div>
                                                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', display: 'block' }}>Fecha de Pago</span>
                                                            <strong style={{ fontSize: '1.1rem' }}>{p.fecha_pago}</strong>
                                                        </div>
                                                    </div>

                                                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                                        <a href={p.imagen_url} target="_blank" rel="noreferrer" className="btn" style={{ background: 'var(--accent-primary)', color: '#fff', flex: 1, justifyContent: 'center' }}>
                                                            <Eye size={18} /> Ver Capture
                                                        </a>
                                                        <button
                                                            className="btn"
                                                            style={{ background: 'rgba(255,255,255,0.1)', flex: 1, justifyContent: 'center' }}
                                                            onClick={() => descargarImagen(p.imagen_url, `capture_${p.cedula_cuenta}_${idx}.png`)}
                                                        >
                                                            <Download size={18} /> Descargar
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                        <CheckCircle size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                        <p>No hay reportes {activeTab}s.</p>
                    </div>
                )}
            </div>

            {/* Modal de Aprobación */}
            {modalAprobarAbierto && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000, padding: '1rem'
                }}>
                    <div className="glass-panel fade-in" style={{ width: '100%', maxWidth: '500px', position: 'relative', borderTop: '4px solid var(--accent-success)' }}>
                        <button onClick={() => setModalAprobarAbierto(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                            <X size={24} />
                        </button>

                        <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-success)' }}>
                            <CheckCircle size={24} /> Aprobar Reporte
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                            Aprobando pagos del contrato <strong>{reporteParaAprobar?.cedula_contrato}</strong>.
                        </p>

                        <form onSubmit={handleAprobar}>
                            <div className="input-group">
                                <label>Mensaje para el Asesor (Opcional)</label>
                                <textarea
                                    rows="3"
                                    value={mensajeAprobacion}
                                    onChange={(e) => setMensajeAprobacion(e.target.value)}
                                ></textarea>
                            </div>

                            <div className="input-group">
                                <label>Adjuntar Recibo de Aprobación para el Cliente (Opcional)</label>
                                <div style={{
                                    border: '2px dashed var(--glass-border)', borderRadius: '8px',
                                    padding: '1rem', textAlign: 'center', cursor: 'pointer', position: 'relative'
                                }}>
                                    <input
                                        type="file" accept="image/*"
                                        onChange={(e) => setImagenAprobacion(e.target.files[0])}
                                        style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%' }}
                                    />
                                    <Camera size={24} color="var(--text-secondary)" style={{ marginBottom: '0.25rem' }} />
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: imagenAprobacion ? 'var(--accent-success)' : 'var(--text-secondary)' }}>
                                        {imagenAprobacion ? imagenAprobacion.name : 'Toca para subir factura procesada'}
                                    </p>
                                </div>
                            </div>

                            <button type="submit" className="btn" style={{ width: '100%', background: 'var(--accent-success)', color: '#fff', marginTop: '1rem', padding: '0.75rem' }}>
                                <CheckCircle size={18} /> Confirmar Aprobación
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Devolución */}
            {modalAbierto && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000, padding: '1rem'
                }}>
                    <div className="glass-panel fade-in" style={{ width: '100%', maxWidth: '500px', position: 'relative', borderTop: '4px solid var(--accent-warning)' }}>
                        <button onClick={() => setModalAbierto(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                            <X size={24} />
                        </button>

                        <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-warning)' }}>
                            <CornerUpLeft size={24} /> Devolver Reporte
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                            Enviando de regreso a <strong>@{reporteSeleccionado?.asesor_id}</strong> para corrección.
                        </p>

                        <form onSubmit={handleDevolver}>
                            <div className="input-group">
                                <label>Instrucciones de Corrección</label>
                                <textarea
                                    required
                                    rows="4"
                                    placeholder="Ej: El capture está borroso..."
                                    value={mensajeDevolucion}
                                    onChange={(e) => setMensajeDevolucion(e.target.value)}
                                ></textarea>
                            </div>

                            <div className="input-group">
                                <label>Adjuntar Imagen de Referencia (Opcional)</label>
                                <div style={{
                                    border: '2px dashed var(--glass-border)', borderRadius: '8px',
                                    padding: '1rem', textAlign: 'center', cursor: 'pointer', position: 'relative'
                                }}>
                                    <input
                                        type="file" accept="image/*"
                                        onChange={(e) => setImagenAdjunta(e.target.files[0])}
                                        style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%' }}
                                    />
                                    <Camera size={24} color="var(--text-secondary)" style={{ marginBottom: '0.25rem' }} />
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: imagenAdjunta ? 'var(--accent-success)' : 'var(--text-secondary)' }}>
                                        {imagenAdjunta ? imagenAdjunta.name : 'Toca para subir referencia de error'}
                                    </p>
                                </div>
                            </div>

                            <button type="submit" className="btn" style={{ width: '100%', background: 'var(--accent-warning)', color: '#000', marginTop: '1rem', padding: '0.75rem' }}>
                                <Send size={18} /> Enviar Devolución
                            </button>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
