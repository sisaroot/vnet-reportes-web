import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, CheckCircle, Clock, Search, Link } from 'lucide-react';

export default function AdminView() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('pendientes'); // pendientes | procesados

    // Mock Data
    const reportesPendientes = [
        { id: 101, asesor: 'cesar_vnet', cliente: 'Maria Lourdes', montoTotal: '35$', pagos: 2, fecha: '2026-03-04' },
        { id: 102, asesor: 'asesor_2', cliente: 'Pedro Perez', montoTotal: '20$', pagos: 1, fecha: '2026-03-04' },
    ];

    return (
        <div className="container" style={{ paddingBottom: '4rem' }}>

            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', margin: 0, color: 'var(--accent-warning)' }}>Dashboard Admin</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Gestión de Reportes de Pago</p>
                </div>
                <button className="btn" style={{ background: 'var(--glass-bg)', color: 'var(--accent-danger)' }} onClick={() => navigate('/login')}>
                    <LogOut size={18} />
                    <span className="hide-mobile">Salir</span>
                </button>
            </header>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <button
                    className="btn"
                    style={{ flex: 1, background: activeTab === 'pendientes' ? 'var(--accent-primary)' : 'var(--glass-bg)', color: '#fff' }}
                    onClick={() => setActiveTab('pendientes')}
                >
                    <Clock size={18} /> Pendientes
                </button>
                <button
                    className="btn"
                    style={{ flex: 1, background: activeTab === 'procesados' ? 'var(--accent-success)' : 'var(--glass-bg)', color: '#fff' }}
                    onClick={() => setActiveTab('procesados')}
                >
                    <CheckCircle size={18} /> Procesados
                </button>
            </div>

            <div className="glass-panel fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: 0 }}>
                        Reportes {activeTab === 'pendientes' ? 'Pendientes' : 'Procesados'}
                    </h3>
                    <div className="input-group" style={{ margin: 0, width: '250px' }}>
                        <div style={{ position: 'relative' }}>
                            <input type="text" placeholder="Buscar por cliente o asesor..." style={{ paddingLeft: '2.5rem', width: '100%' }} />
                            <Search size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px', top: '14px' }} />
                        </div>
                    </div>
                </div>

                {activeTab === 'pendientes' ? (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {reportesPendientes.map(rep => (
                            <div key={rep.id} style={{
                                background: 'rgba(0,0,0,0.3)', padding: '1rem 1.5rem', borderRadius: '8px',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem'
                            }}>
                                <div>
                                    <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--text-primary)' }}>{rep.cliente}</h4>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                        Asesor: @{rep.asesor} | Facturas: {rep.pagos} | Fecha: {rep.fecha}
                                    </p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <span style={{ fontWeight: 600, color: 'var(--accent-warning)', background: 'rgba(210, 153, 34, 0.1)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                                        {rep.montoTotal}
                                    </span>
                                    <button className="btn" style={{ background: 'var(--accent-success)', color: '#fff', padding: '0.5rem 1rem' }}>
                                        Revisar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                        <CheckCircle size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                        <p>No hay reportes procesados recientemente.</p>
                    </div>
                )}
            </div>

        </div>
    );
}
