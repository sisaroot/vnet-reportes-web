import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus, ShieldCheck, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Login() {
    const [mode, setMode] = useState('login'); // login | register
    const [role, setRole] = useState('asesor'); // asesor | admin

    // Si estamos en register, forzamos a 'asesor'
    const currentRole = mode === 'register' ? 'asesor' : role;

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            if (mode === 'login') {
                const { data, error } = await supabase
                    .from('usuarios')
                    .select('*')
                    .eq('username', username)
                    .eq('password', password)
                    .eq('role', currentRole)
                    .single();

                if (error || !data) {
                    setErrorMsg('usuario o contraseña incorrectos');
                    setLoading(false);
                    return;
                }

                localStorage.setItem('vnet_user', data.username);
                localStorage.setItem('vnet_role', data.role);

                if (data.role === 'admin') {
                    navigate('/admin');
                } else {
                    navigate('/asesor');
                }
            } else {
                // Modo Registro (Solo para Asesores)
                const { error } = await supabase
                    .from('usuarios')
                    .insert([{
                        username: username,
                        password: password,
                        role: 'asesor'
                    }]);

                if (error) {
                    if (error.code === '23505') { // Postgres Unique Violation
                        setErrorMsg('Este nombre de usuario ya existe.');
                    } else {
                        setErrorMsg('Error al registrar usuario en la base de datos.');
                    }
                    setLoading(false);
                    return;
                }

                setSuccessMsg('¡Asesor registrado con éxito! Ahora puedes Iniciar Sesión.');
                setMode('login'); // Volvemos al login automáticamente
                setPassword(''); // Limpiamos la clave por seguridad
            }

        } catch (err) {
            console.error("Error Auth:", err);
            setErrorMsg('Error de conexión con la base de datos.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container flex-center" style={{ minHeight: '100vh' }}>
            <div className="glass-panel fade-in" style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(88, 166, 255, 0.1)', borderRadius: '50%', marginBottom: '1rem' }}>
                        <ShieldCheck size={32} color="var(--accent-primary)" />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Bienvenido a VNET</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Reporte de Pagos</p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {errorMsg && (
                        <div style={{ background: 'rgba(248, 81, 73, 0.1)', color: 'var(--accent-danger)', padding: '0.75rem', borderRadius: '4px', textAlign: 'center', fontSize: '0.9rem' }}>
                            {errorMsg}
                        </div>
                    )}
                    {successMsg && (
                        <div style={{ background: 'rgba(46, 160, 67, 0.1)', color: 'var(--accent-success)', padding: '0.75rem', borderRadius: '4px', textAlign: 'center', fontSize: '0.9rem' }}>
                            {successMsg}
                        </div>
                    )}

                    {/* Selector de Modos (Pestañas Superiores) */}
                    <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '8px' }}>
                        <button
                            type="button"
                            className="btn"
                            style={{ flex: 1, background: mode === 'login' ? 'var(--glass-bg)' : 'transparent', fontSize: '0.9rem', padding: '0.5rem' }}
                            onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
                        >Iniciar Sesión</button>
                        <button
                            type="button"
                            className="btn"
                            style={{ flex: 1, background: mode === 'register' ? 'var(--glass-bg)' : 'transparent', fontSize: '0.9rem', padding: '0.5rem' }}
                            onClick={() => { setMode('register'); setErrorMsg(''); setSuccessMsg(''); }}
                        >Registrar Asesor</button>
                    </div>

                    {/* Selector de Roles (Solo en Login) */}
                    {mode === 'login' && (
                        <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(0,0,0,0.1)', padding: '0.5rem', borderRadius: '8px', marginTop: '0.5rem' }}>
                            <button
                                type="button"
                                className="btn"
                                style={{ flex: 1, background: role === 'asesor' ? 'var(--glass-bg)' : 'transparent', border: '1px solid rgba(255,255,255,0.05)' }}
                                onClick={() => setRole('asesor')}
                            >Soy Asesor</button>
                            <button
                                type="button"
                                className="btn"
                                style={{ flex: 1, background: role === 'admin' ? 'var(--glass-bg)' : 'transparent', border: '1px solid rgba(255,255,255,0.05)' }}
                                onClick={() => setRole('admin')}
                            >Soy Admin</button>
                        </div>
                    )}

                    {mode === 'register' && (
                        <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.5rem 0' }}>
                            Solo los Asesores pueden registrarse.
                        </p>
                    )}

                    <div className="input-group">
                        <label>Usuario</label>
                        <input
                            type="text"
                            required
                            placeholder="Ej: cesar_asesor"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>

                    <div className="input-group">
                        <label>Contraseña</label>
                        <input
                            type="password"
                            required
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button type="submit" disabled={loading} className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                        {loading ? <Loader className="spin" size={18} /> : (mode === 'login' ? <LogIn size={18} /> : <UserPlus size={18} />)}
                        {loading ? 'Procesando...' : (mode === 'login' ? 'Ingresar' : 'Crear Cuenta')}
                    </button>
                </form>
            </div>
        </div>
    );
}
