import React, { useState, useEffect } from 'react'
import { ChevronLeft, ShieldCheck, UserX, UserCheck, Search } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { DriverProfile } from '../types'
import { useNavigate } from 'react-router-dom'

const Admin = () => {
    const [drivers, setDrivers] = useState<DriverProfile[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const navigate = useNavigate()

    useEffect(() => {
        fetchDrivers()
    }, [])

    async function fetchDrivers() {
        setLoading(true)
        const { data } = await supabase.from('driver_profile').select('*').order('full_name')
        if (data) setDrivers(data)
        setLoading(false)
    }

    async function toggleStatus(id: string, currentStatus: boolean) {
        const { error } = await supabase
            .from('driver_profile')
            .update({ is_active: !currentStatus })
            .eq('id', id)

        if (error) {
            alert('Erro ao atualizar status: ' + error.message)
        } else {
            setDrivers(drivers.map(d => d.id === id ? { ...d, is_active: !currentStatus } : d))
        }
    }

    const filteredDrivers = drivers.filter(d =>
        d.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.vehicle_model.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="content">
            <header style={{ margin: '-20px -20px 20px -20px' }}>
                <button onClick={() => navigate(-1)} className="btn-back"><ChevronLeft /></button>
                <h1>Painel Admin</h1>
                <button><ShieldCheck color="var(--primary)" /></button>
            </header>

            <div style={{ marginTop: 20, marginBottom: 20 }}>
                <h2>Gestão de Usuários</h2>
                <p style={{ color: '#757575', fontSize: '0.9rem' }}>Ative ou desative o acesso dos motoristas ao sistema.</p>
            </div>

            <div className="input-wrapper" style={{ marginBottom: 20 }}>
                <input
                    placeholder="Buscar motorista ou veículo..."
                    style={{ width: '100%', padding: '12px 15px', borderRadius: 12, border: '1px solid #eee' }}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="icon" size={20} />
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: 40 }}>Carregando...</div>
            ) : (
                filteredDrivers.map(driver => (
                    <div key={driver.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 15, padding: 15 }}>
                        <div className="avatar" style={{ margin: 0, width: 50, height: 50 }}>
                            {driver.avatar_url ? <img src={driver.avatar_url} style={{ width: '100%', height: '100%', borderRadius: 12 }} /> : <UserCheck />}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700 }}>{driver.full_name}</div>
                            <div style={{ fontSize: '0.8rem', color: '#666' }}>{driver.vehicle_model} • {driver.license_plate}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5 }}>
                                <div style={{
                                    width: 8, height: 8, borderRadius: '50%',
                                    backgroundColor: driver.is_active ? 'var(--success)' : 'var(--error)'
                                }}></div>
                                <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: driver.is_active ? 'var(--success)' : 'var(--error)' }}>
                                    {driver.is_active ? 'Ativo' : 'Inativo'}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() => toggleStatus(driver.id, driver.is_active)}
                            style={{
                                padding: '8px 12px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600,
                                backgroundColor: driver.is_active ? '#FFEBEE' : '#E8F5E9',
                                color: driver.is_active ? '#F44336' : '#4CAF50'
                            }}
                        >
                            {driver.is_active ? 'Desativar' : 'Ativar'}
                        </button>
                    </div>
                ))
            )}
        </div>
    )
}

export default Admin
