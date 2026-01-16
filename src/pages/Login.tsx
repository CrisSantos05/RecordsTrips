import React, { useState } from 'react'
import { LogIn, Phone, Lock, Eye, EyeOff, Car } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { DriverProfile } from '../types'

interface LoginProps {
    onLogin: (profile: DriverProfile) => void;
}

const Login = ({ onLogin }: LoginProps) => {
    const [identifier, setIdentifier] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!identifier || !password) {
            setError('Preencha todos os campos')
            return
        }

        setLoading(true)
        setError('')

        let profileData: DriverProfile | null = null;
        let authUser = null;

        // ESTRATÉGIA MISTA:
        // 1. Tentar Login via Auth (Se for Email) -> Garante acesso via RLS
        const isEmail = identifier.includes('@');

        if (isEmail) {
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: identifier,
                password: password
            });

            if (!authError && authData.session) {
                authUser = authData.user;
                // Busca perfil via ID Seguro (Auth ID)
                const { data: profileByAuth } = await supabase
                    .from('driver_profile')
                    .select('*')
                    .eq('auth_id', authUser.id)
                    .single();

                if (profileByAuth) {
                    profileData = profileByAuth;
                }
            }
        }

        // 2. Se não logou via Auth (ou não é email), tenta método LEGADO (Banco de Dados direto)
        if (!profileData) {
            const { data: legacyData, error: legacyError } = await supabase
                .from('driver_profile')
                .select('*')
                .or(`phone_number.eq."${identifier}",email.eq."${identifier}"`)
                .eq('password', password)
                .single();

            if (!legacyError && legacyData) {
                profileData = legacyData;

                // Tentar migração silenciosa para Auth (se possível)
                try {
                    let { data: { session } } = await supabase.auth.getSession();
                    let currentAuth = session?.user;

                    // Se não tem sessão, tenta criar/logar no Auth para o futuro
                    if (!currentAuth && profileData && profileData.email) {
                        const { data: loginAttempt, error: loginErr } = await supabase.auth.signInWithPassword({
                            email: profileData.email,
                            password: password
                        });

                        if (loginErr) {
                            // Se falhar login, tenta cadastrar (apenas se senha for forte)
                            if (password.length >= 6) {
                                const { data: signUpData } = await supabase.auth.signUp({
                                    email: profileData.email,
                                    password: password,
                                    options: { data: { full_name: profileData.full_name } }
                                });
                                if (signUpData.user) currentAuth = signUpData.user;
                            }
                        } else {
                            currentAuth = loginAttempt.user;
                        }
                    } else if (authUser) {
                        currentAuth = authUser;
                    }

                    // Vincular ID se necessário
                    if (currentAuth && profileData && (profileData as any).auth_id !== currentAuth.id) {
                        await supabase.from('driver_profile')
                            .update({ auth_id: currentAuth.id })
                            .eq('id', profileData.id);
                        (profileData as any).auth_id = currentAuth.id;
                    }
                } catch {
                    // Falha silenciosa na migração não impede o login
                }
            }
        }

        // 3. Resultado Final
        if (profileData) {
            if (!profileData.is_active) {
                setError('Seu acesso está desativado. Contate o administrador.')
            } else {
                onLogin(profileData)
            }
        } else {
            setError('Credenciais incorretas')
        }

        setLoading(false)
    }

    return (
        <div className="container" style={{
            justifyContent: 'center',
            background: 'linear-gradient(180deg, var(--primary) 0%, #1a5e55 100%)',
            padding: '20px'
        }}>
            <div style={{ textAlign: 'center', marginBottom: 40, color: 'white' }}>
                <div style={{
                    width: 80,
                    height: 80,
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.3)'
                }}>
                    <Car size={40} color="white" />
                </div>
                <h1 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-1px' }}>RecordsTrip</h1>
                <p style={{ opacity: 0.8, fontSize: '0.9rem' }}>Sua jornada, seus ganhos, sob controle.</p>
            </div>

            <div className="card" style={{ padding: '30px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 5 }}>Bem-vindo</h2>
                <p style={{ color: '#757575', fontSize: '0.85rem', marginBottom: 25 }}>Entre com seus dados para continuar</p>

                {error && (
                    <div style={{
                        background: '#FFEBEE',
                        color: 'var(--error)',
                        padding: '12px',
                        borderRadius: '10px',
                        fontSize: '0.8rem',
                        marginBottom: 20,
                        fontWeight: 600,
                        textAlign: 'center',
                        border: '1px solid #FFCDD2'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin}>
                    <div className="input-group">
                        <label>E-MAIL OU TELEFONE</label>
                        <div className="input-wrapper">
                            <input
                                type="text"
                                placeholder="E-mail ou Telefone"
                                value={identifier}
                                onChange={e => setIdentifier(e.target.value)}
                            />
                            <Phone className="icon" size={18} />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>SENHA</label>
                        <div className="input-wrapper">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                className="icon"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{ padding: 0, height: 'auto' }}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={loading}
                        style={{ marginTop: 10, height: '55px' }}
                    >
                        {loading ? 'Entrando...' : (
                            <>
                                <LogIn size={20} /> ENTRAR NO SISTEMA
                            </>
                        )}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: 25 }}>
                    <p style={{ fontSize: '0.8rem', color: '#999' }}>
                        Não tem acesso? <br />
                        <span style={{ color: 'var(--primary)', fontWeight: 700 }}>Contate o administrador</span>
                    </p>
                </div>
            </div>

            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', marginTop: 'auto', paddingBottom: 20 }}>
                &copy; 2026 RecordsTrip System. V 1.0.0
            </div>
        </div>
    )
}

export default Login
