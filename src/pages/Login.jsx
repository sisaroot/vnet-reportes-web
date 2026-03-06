import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Key, ShieldCheck, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Login() {
    const [role, setRole] = useState('asesor'); // asesor | admin
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');

        try {
            const { data, error } = await supabase
                .from('usuarios')
                .select('*')
                .eq('username', username)
                .eq('password', password)
                .eq('role', role)
                .single();

            if (error || !data) {
                setErrorMsg('Credenciales incorrectas o rol equivocado.');
                setLoading(false);
                return;
            }

            // Guardar sesión básica en localStorage
            localStorage.setItem('vnet_user', data.username);
            localStorage.setItem('vnet_role', data.role);

            // Redirigir basado en el rol real de la DB
            if (data.role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/asesor');
            }

        } catch (err) {
            console.error("Error login:", err);
            setErrorMsg('Error de conexión con la base de datos.');
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

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {errorMsg && (
                        <div style={{ background: 'rgba(248, 81, 73, 0.1)', color: 'var(--accent-danger)', padding: '0.75rem', borderRadius: '4px', textAlign: 'center', fontSize: '0.9rem' }}>
                            {errorMsg}
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '8px' }}>
                        <button
                            type="button"
                            className="btn"
                            style={{ flex: 1, background: role === 'asesor' ? 'var(--glass-bg)' : 'transparent' }}
                            onClick={() => setRole('asesor')}
                        >Asesor</button>
                        <button
                            type="button"
                            className="btn"
                            style={{ flex: 1, background: role === 'admin' ? 'var(--glass-bg)' : 'transparent' }}
                            onClick={() => setRole('admin')}
                        >Admin</button>
                    </div>

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
                        {loading ? <Loader className="spin" size={18} /> : <LogIn size={18} />}
                        {loading ? 'Verificando...' : 'Ingresar'}
                    </button>
                </form>
            </div>
        </div>
    );
}
