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
        const { data, error: fetchError } = await supabase
            .from('driver_profile')
            .select('*')
            .or(`phone_number.eq."${identifier}",email.eq."${identifier}"`)
            .eq('password', password)
            .single()

        if (fetchError || !data) {
            setError('Credenciais incorretas')
        } else if (!data.is_active) {
            setError('Seu acesso está desativado. Contate o administrador.')
        } else {
            onLogin(data)
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
