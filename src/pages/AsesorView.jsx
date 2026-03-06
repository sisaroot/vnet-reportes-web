import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Plus, Trash2, Send, Camera, AlertCircle, FileEdit, FileText, Loader, CheckCircle, Eye, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';
import clientesData from '../data/clientes.json';

export default function AsesorView() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('nuevo'); // nuevo | devueltos | aprobados
    const [loading, setLoading] = useState(false);

    const asesorActual = localStorage.getItem('vnet_user') || 'asesor_desconocido';

    const [clientData, setClientData] = useState({
        cedula_contrato: '',
        nombre_cliente: '' // Auto-fill target
    });

    const [pagos, setPagos] = useState([
        { id: 1, cedula_cuenta: '', telefono_bancario: '', fecha_pago: '', file: null, fileName: '' }
    ]);

    const [reportesDevueltos, setReportesDevueltos] = useState([]);
    const [reportesAprobados, setReportesAprobados] = useState([]); // Historial 

    // Auto-completado de nombre de cliente basado en Json local
    useEffect(() => {
        const queryStr = clientData.cedula_contrato.trim();
        const numericQueryStr = queryStr.replace(/\D/g, ''); // Quitar V, E, J, guiones, etc
        const queryNumber = parseInt(numericQueryStr, 10); // Convertir 0030440573 -> 30440573

        // Si ya tecleó al menos 5 o 6 números, empezamos a buscar
        if (!isNaN(queryNumber) && numericQueryStr.length > 5) {
            const found = clientesData.find(c => {
                const numericDBStr = c.cedula.replace(/\D/g, '');
                const dbNumber = parseInt(numericDBStr, 10);
                return dbNumber === queryNumber;
            });

            if (found) {
                setClientData(prev => ({ ...prev, nombre_cliente: found.nombre }));
            } else {
                setClientData(prev => ({ ...prev, nombre_cliente: '' }));
            }
        } else {
            setClientData(prev => ({ ...prev, nombre_cliente: '' }));
        }
    }, [clientData.cedula_contrato]);

    useEffect(() => {
        cargarListas();
    }, [activeTab]);

    const cargarListas = async () => {
        const { data, error } = await supabase
            .from('reportes')
            .select('*')
            .eq('asesor_id', asesorActual)
            .order('created_at', { ascending: false });

        if (!error && data) {
            setReportesDevueltos(data.filter(r => r.estado === 'devuelto'));
            setReportesAprobados(data.filter(r => r.estado === 'procesado').slice(0, 10)); // Solo ultimos 10 aprobados guardados
        }
    };

    const handlePagoChange = (id, field, value) => {
        setPagos(pagos.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    const handleFileChange = (id, e) => {
        const file = e.target.files[0];
        if (file) {
            setPagos(pagos.map(p => p.id === id ? { ...p, file: file, fileName: file.name } : p));
        }
    };

    const agregarPago = () => {
        setPagos([...pagos, { id: Date.now(), cedula_cuenta: '', telefono_bancario: '', fecha_pago: '', file: null, fileName: '' }]);
    };

    const eliminarPago = (id) => {
        if (pagos.length === 1) return;
        setPagos(pagos.filter(p => p.id !== id));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        for (const p of pagos) {
            if (!p.file) {
                alert("Debes subir un comprobante para todos los pagos.");
                return;
            }
        }

        setLoading(true);

        try {
            const { data: reporteData, error: reporteError } = await supabase
                .from('reportes')
                .insert([{
                    asesor_id: asesorActual,
                    cedula_contrato: clientData.cedula_contrato,
                    estado: 'pendiente'
                }])
                .select()
                .single();

            if (reporteError) throw reporteError;

            const reporte_id = reporteData.id;

            for (const pago of pagos) {
                const fileExt = pago.file.name.split('.').pop();
                const fileName = `${reporte_id}_${pago.id}.${fileExt}`;
                const filePath = `${asesorActual}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('comprobantes')
                    .upload(filePath, pago.file);

                if (uploadError) throw uploadError;

                const { data: publicUrlData } = supabase.storage
                    .from('comprobantes')
                    .getPublicUrl(filePath);

                const { error: pagoError } = await supabase
                    .from('pagos_asociados')
                    .insert([{
                        reporte_id: reporte_id,
                        fecha_pago: pago.fecha_pago,
                        cedula_cuenta: pago.cedula_cuenta,
                        telefono_bancario: pago.telefono_bancario,
                        imagen_url: publicUrlData.publicUrl
                    }]);

                if (pagoError) throw pagoError;
            }

            alert(`¡Reporte enviado exitosamente con ${pagos.length} pagos comprobados!`);
            setClientData({ cedula_contrato: '', nombre_cliente: '' });
            setPagos([{ id: Date.now(), cedula_cuenta: '', telefono_bancario: '', fecha_pago: '', file: null, fileName: '' }]);

        } catch (error) {
            console.error("Error al enviar reporte:", error);
            alert("Hubo un error al enviar el reporte. Por favor intente de nuevo.");
        } finally {
            setLoading(false);
        }
    };

    const corregirReporte = async (reporte) => {
        setClientData({ cedula_contrato: reporte.cedula_contrato, nombre_cliente: '' });
        alert("Cédula recuperada. Reconstruya los pagos con las correcciones indicadas por el administrador.");
        setActiveTab('nuevo');
    };

    const descargarImagen = async (url, nombreArchivo) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const urlBlob = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = urlBlob;
            a.download = nombreArchivo || 'comprobante_vnet.png';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(urlBlob);
        } catch (error) {
            console.error("No se pudo descargar:", error);
            window.open(url, '_blank');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('vnet_user');
        localStorage.removeItem('vnet_role');
        navigate('/login');
    };

    return (
        <div className="container" style={{ paddingBottom: '4rem' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', margin: 0 }}>Panel de Asesor</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>VNET - Gestión de Pagos</p>
                </div>
                <button className="btn" style={{ background: 'var(--glass-bg)', color: 'var(--accent-danger)' }} onClick={handleLogout}>
                    <LogOut size={18} />
                    <span className="hide-mobile">Salir</span>
                </button>
            </header>

            {/* Tabs */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
                <button
                    className="btn"
                    style={{ flex: 1, minWidth: '120px', background: activeTab === 'nuevo' ? 'var(--accent-primary)' : 'var(--glass-bg)', color: '#fff' }}
                    onClick={() => setActiveTab('nuevo')}
                >
                    <FileText size={18} /> Reportar
                </button>
                <button
                    className="btn"
                    style={{ flex: 1, minWidth: '120px', position: 'relative', background: activeTab === 'devueltos' ? 'var(--accent-danger)' : 'var(--glass-bg)', color: '#fff' }}
                    onClick={() => setActiveTab('devueltos')}
                >
                    <AlertCircle size={18} /> Por Corregir
                    {reportesDevueltos.length > 0 && (
                        <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'white', color: 'var(--accent-danger)', borderRadius: '50%', width: '20px', height: '20px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                            {reportesDevueltos.length}
                        </span>
                    )}
                </button>
                <button
                    className="btn"
                    style={{ flex: 1, minWidth: '120px', background: activeTab === 'aprobados' ? 'var(--accent-success)' : 'var(--glass-bg)', color: '#fff' }}
                    onClick={() => setActiveTab('aprobados')}
                >
                    <CheckCircle size={18} /> Aprobados
                </button>
            </div>

            {activeTab === 'nuevo' && (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    <section className="glass-panel fade-in">
                        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ color: 'var(--accent-primary)' }}>1.</span> Identificación
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr)', gap: '1rem' }}>
                            <div className="input-group" style={{ margin: 0 }}>
                                <label>Cédula de Contrato del Titular</label>
                                <input
                                    type="text" required placeholder="Ej: V-12345678"
                                    value={clientData.cedula_contrato}
                                    onChange={e => setClientData({ ...clientData, cedula_contrato: e.target.value })}
                                />
                            </div>
                            <div className="input-group" style={{ margin: 0, opacity: clientData.nombre_cliente ? 1 : 0.5 }}>
                                <label>Nombre del Titular (Auto-completado)</label>
                                <input
                                    type="text" disabled
                                    placeholder={clientData.cedula_contrato.length > 3 ? "No encontrado en base de datos" : "Escribe la CI primero"}
                                    value={clientData.nombre_cliente}
                                    style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--accent-success)', fontWeight: 'bold' }}
                                />
                            </div>
                        </div>
                    </section>

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

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '1rem' }}>
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
                                            <label>Cédula de la Cuenta Origen</label>
                                            <input
                                                type="text" required placeholder="Cédula del titular que transfiere"
                                                value={pago.cedula_cuenta} onChange={e => handlePagoChange(pago.id, 'cedula_cuenta', e.target.value)}
                                            />
                                        </div>
                                        <div className="input-group" style={{ margin: 0 }}>
                                            <label>Teléfono (Solo Pago Móvil)</label>
                                            <input
                                                type="text" placeholder="0412-1234567"
                                                value={pago.telefono_bancario} onChange={e => handlePagoChange(pago.id, 'telefono_bancario', e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="input-group" style={{ margin: 0 }}>
                                        <label>Comprobante o Captura</label>
                                        <div style={{
                                            border: '2px dashed var(--glass-border)', borderRadius: '8px',
                                            padding: '1.5rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)',
                                            cursor: 'pointer', position: 'relative'
                                        }}>
                                            <input
                                                type="file" accept="image/*"
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

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                        <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', maxWidth: '300px', padding: '1rem', fontSize: '1.1rem' }}>
                            {loading ? <Loader className="spin" size={20} /> : <Send size={20} />}
                            {loading ? "Procesando..." : "Enviar Reporte"}
                        </button>
                    </div>

                </form>
            )}

            {activeTab === 'devueltos' && (
                <div className="glass-panel fade-in">
                    <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--accent-danger)' }}>Reportes con Errores</h3>
                    {reportesDevueltos.map(rep => (
                        <div key={rep.id} style={{
                            background: 'rgba(248, 81, 73, 0.1)', border: '1px solid rgba(248, 81, 73, 0.3)',
                            padding: '1.5rem', borderRadius: '8px', marginBottom: '1rem'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                                <div>
                                    <h4 style={{ margin: '0 0 0.5rem 0' }}>Contrato: {rep.cedula_contrato}</h4>
                                    <p style={{ margin: 0, color: 'var(--text-primary)', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '4px', borderLeft: '3px solid var(--accent-danger)' }}>
                                        <strong>Mensaje del Admin:</strong><br /> "{rep.mensaje_admin}"
                                    </p>
                                    {rep.imagen_admin_url && (
                                        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                                            <a href={rep.imagen_admin_url} target="_blank" rel="noreferrer" className="btn" style={{ background: 'var(--glass-bg)', color: 'var(--accent-primary)', textDecoration: 'none', padding: '0.4rem 0.8rem' }}>
                                                <Eye size={16} /> <span>Ver captura</span>
                                            </a>
                                            <button
                                                className="btn"
                                                onClick={() => descargarImagen(rep.imagen_admin_url, `devuelto_${rep.cedula_contrato}.png`)}
                                                style={{ background: 'var(--glass-bg)', color: 'var(--text-secondary)', padding: '0.4rem 0.8rem' }}>
                                                <Download size={16} /> Descargar
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <button onClick={() => corregirReporte(rep)} className="btn" style={{ background: 'var(--accent-primary)', color: '#fff' }}>
                                    <FileEdit size={18} /> Editar y Reenviar
                                </button>
                            </div>
                        </div>
                    ))}
                    {reportesDevueltos.length === 0 && (
                        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>No tienes reportes devueltos.</p>
                    )}
                </div>
            )}

            {activeTab === 'aprobados' && (
                <div className="glass-panel fade-in">
                    <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--accent-success)' }}>Últimos Pagos Aprobados</h3>
                    {reportesAprobados.map(rep => (
                        <div key={rep.id} style={{
                            background: 'rgba(46, 160, 67, 0.1)', border: '1px solid rgba(46, 160, 67, 0.3)',
                            padding: '1.5rem', borderRadius: '8px', marginBottom: '1rem'
                        }}>
                            <div>
                                <h4 style={{ margin: '0 0 0.5rem 0' }}>Contrato: {rep.cedula_contrato}</h4>
                                {rep.mensaje_admin && (
                                    <p style={{ margin: '0.5rem 0', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                                        <strong>Admin:</strong> {rep.mensaje_admin}
                                    </p>
                                )}
                                {rep.imagen_admin_url && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
                                        <a href={rep.imagen_admin_url} target="_blank" rel="noreferrer" className="btn" style={{ background: 'var(--accent-success)', color: '#fff', flex: 1, minWidth: '150px', justifyContent: 'center' }}>
                                            <Eye size={18} /> Ver para Cliente
                                        </a>
                                        <button
                                            className="btn"
                                            onClick={() => descargarImagen(rep.imagen_admin_url, `aprobado_${rep.cedula_contrato}.png`)}
                                            style={{ background: 'var(--glass-bg)', color: '#fff', flex: 1, minWidth: '150px', justifyContent: 'center' }}
                                        >
                                            <Download size={18} /> Descargar Archivo
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {reportesAprobados.length === 0 && (
                        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>No hay reportes aprobados recientemente.</p>
                    )}
                </div>
            )}
        </div>
    );
}
