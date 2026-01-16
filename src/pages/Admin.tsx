import React, { useState, useEffect } from 'react'
import { ChevronLeft, ShieldCheck, UserX, UserCheck, Search, Plus, X, Save, Phone, Car, Trash2, Lock, LogOut } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { DriverProfile } from '../types'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const Admin = ({ onLogout }: { onLogout: () => void }) => {
    const [drivers, setDrivers] = useState<DriverProfile[]>([])
    const [balances, setBalances] = useState<{ [key: string]: number }>({})
    const [loading, setLoading] = useState(true)
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [showAddModal, setShowAddModal] = useState(false)
    const [newDriver, setNewDriver] = useState({
        full_name: '',
        phone_number: '',
        vehicle_model: '',
        license_plate: '',
        password: '',
        email: ''
    })
    const navigate = useNavigate()

    useEffect(() => {
        checkAdminAccess()
    }, [])

    async function checkAdminAccess() {
        // Fetch current profile to check admin status
        const { data } = await supabase.from('driver_profile').select('is_admin').limit(1).single()
        if (data && data.is_admin) {
            setIsAdmin(true)
            fetchDrivers()
        } else {
            setIsAdmin(false)
            setTimeout(() => navigate('/'), 2000)
        }
    }

    async function fetchDrivers() {
        setLoading(true)
        const { data: driversData } = await supabase.from('driver_profile').select('*').order('full_name')
        if (driversData) {
            setDrivers(driversData)

            // Fetch pending balances for all drivers
            const { data: tripsData } = await supabase
                .from('trips')
                .select('driver_id, amount')
                .eq('status', 'pending')

            const pendingBalances: { [key: string]: number } = {}
            tripsData?.forEach(trip => {
                pendingBalances[trip.driver_id] = (pendingBalances[trip.driver_id] || 0) + Number(trip.amount)
            })
            setBalances(pendingBalances)
        }
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

    async function handleAddDriver() {
        if (!newDriver.full_name || !newDriver.email) {
            alert('Nome e E-mail são obrigatórios')
            return
        }

        const generatedPassword = newDriver.password || Math.random().toString(36).slice(-6);

        setLoading(true)
        const { data, error } = await supabase.from('driver_profile').insert({
            ...newDriver,
            password: generatedPassword,
            is_active: true,
            is_admin: false
        }).select().single()

        if (error) {
            alert('Erro ao adicionar motorista: ' + error.message)
        } else if (data) {
            // Send WhatsApp notification
            if (data.phone_number) {
                const message = encodeURIComponent(
                    `*RecordsTrip - Acesso Liberado!*\n\nOlá ${data.full_name}, seu acesso ao aplicativo foi criado.\n\n*Seus dados de login:*\n📧 E-mail: ${data.email}\n🔑 Senha: ${generatedPassword}\n\nAcesse agora: ${window.location.origin}`
                );
                window.open(`https://wa.me/${data.phone_number.replace(/\D/g, '')}?text=${message}`, '_blank');
            }

            setDrivers([...drivers, data])
            setShowAddModal(false)
            setNewDriver({
                full_name: '',
                phone_number: '',
                vehicle_model: '',
                license_plate: '',
                password: '',
                email: ''
            })
        }
        setLoading(false)
    }

    async function handleDeleteDriver(id: string) {
        if (!confirm('Tem certeza que deseja excluir este motorista?')) return

        const { error } = await supabase.from('driver_profile').delete().eq('id', id)
        if (error) {
            alert('Erro ao excluir: ' + error.message)
        } else {
            setDrivers(drivers.filter(d => d.id !== id))
        }
    }

    const filteredDrivers = drivers.filter(d =>
        d.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.vehicle_model && d.vehicle_model.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    if (isAdmin === false) {
        return (
            <div className="container" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: 40 }}>
                <div style={{ fontSize: '4rem', marginBottom: 20 }}>🔐</div>
                <h2>Acesso Restrito</h2>
                <p style={{ color: '#666' }}>Você não tem permissão para acessar esta área. Redirecionando...</p>
            </div>
        )
    }

    if (isAdmin === null) return <div style={{ textAlign: 'center', padding: 40 }}>Verificando credenciais...</div>

    return (
        <div className="content">
            <header style={{ margin: '-20px -20px 20px -20px' }}>
                <button onClick={() => navigate(-1)} className="btn-back"><ChevronLeft /></button>
                <h1>Painel Admin</h1>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => setShowAddModal(true)} style={{ color: 'var(--primary)' }}><Plus /></button>
                    <button onClick={onLogout} style={{ color: 'var(--error)' }} title="Sair"><LogOut size={20} /></button>
                </div>
            </header>

            <div style={{ marginTop: 20, marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ fontSize: '1.4rem' }}>Gestão de Motoristas</h2>
                        <p style={{ color: '#757575', fontSize: '0.9rem' }}>Controle de acesso e mensalidades.</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary)' }}>{drivers.length}</div>
                        <div style={{ fontSize: '0.7rem', color: '#999', textTransform: 'uppercase' }}>Total</div>
                    </div>
                </div>
            </div>

            <div className="input-wrapper" style={{ marginBottom: 20 }}>
                <input
                    placeholder="Buscar motorista ou veículo..."
                    style={{ width: '100%', padding: '14px 16px', borderRadius: 12, border: '1px solid #eee', fontSize: '1rem' }}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="icon" size={20} />
            </div>

            {loading && drivers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>Carregando motoristas...</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {filteredDrivers.map(driver => (
                        <div key={driver.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 15, padding: 15, margin: 0, border: driver.is_active ? '1px solid #eee' : '1px solid var(--error)', position: 'relative' }}>
                            <div className="avatar" style={{ margin: 0, width: 50, height: 50, background: driver.is_active ? 'var(--primary-light)' : '#fdecea', color: driver.is_active ? 'var(--primary)' : 'var(--error)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {driver.avatar_url ? <img src={driver.avatar_url} style={{ width: '100%', height: '100%', borderRadius: 12 }} /> : <UserCheck />}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{ fontWeight: 700 }}>{driver.full_name}</div>
                                    {driver.is_admin && <ShieldCheck size={14} color="var(--primary)" />}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#666' }}>
                                    {driver.vehicle_model || 'Sem veículo'} • {driver.license_plate || 'S/ Placa'}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5 }}>
                                    <div style={{
                                        width: 8, height: 8, borderRadius: '50%',
                                        backgroundColor: driver.is_active ? 'var(--success)' : 'var(--error)'
                                    }}></div>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: driver.is_active ? 'var(--success)' : 'var(--error)' }}>
                                        {driver.is_active ? 'Acesso Ativo' : 'Acesso Bloqueado'}
                                    </span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                {balances[driver.id] > 0 && (
                                    <button
                                        onClick={() => {
                                            const message = encodeURIComponent(`Olá ${driver.full_name}, aqui é a administração do RecordsTrip. Consta em nosso sistema um valor pendente de pagamento de R$ ${balances[driver.id].toFixed(2)}. Por favor, verifique seus registros.`);
                                            window.open(`https://wa.me/${driver.phone_number?.replace(/\D/g, '')}?text=${message}`, '_blank');
                                        }}
                                        style={{
                                            padding: '6px 10px', borderRadius: 8, fontSize: '0.7rem', fontWeight: 700,
                                            backgroundColor: '#FFF3E0', color: '#E65100',
                                            textTransform: 'uppercase', border: '1px solid #FFE0B2',
                                            display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center'
                                        }}
                                    >
                                        <Phone size={12} /> Cobrar R$ {balances[driver.id].toFixed(2)}
                                    </button>
                                )}
                                <button
                                    onClick={() => toggleStatus(driver.id, driver.is_active)}
                                    style={{
                                        padding: '6px 10px', borderRadius: 8, fontSize: '0.7rem', fontWeight: 700,
                                        backgroundColor: driver.is_active ? '#FFEBEE' : '#E8F5E9',
                                        color: driver.is_active ? '#F44336' : '#4CAF50',
                                        textTransform: 'uppercase', border: '1px solid currentColor'
                                    }}
                                >
                                    {driver.is_active ? 'Bloquear' : 'Ativar'}
                                </button>
                                {!driver.is_admin && (
                                    <button
                                        onClick={() => handleDeleteDriver(driver.id)}
                                        style={{ color: '#ccc', padding: 5, alignSelf: 'flex-end' }}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showAddModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                    <div className="card" style={{ width: '100%', maxWidth: 400, margin: 0, position: 'relative' }}>
                        <button onClick={() => setShowAddModal(false)} style={{ position: 'absolute', top: 15, right: 15, color: '#999' }}><X /></button>
                        <h3 style={{ marginBottom: 20 }}>Novo Motorista</h3>

                        <div className="input-group">
                            <label>Nome Completo</label>
                            <div className="input-wrapper">
                                <input value={newDriver.full_name} onChange={e => setNewDriver({ ...newDriver, full_name: e.target.value })} placeholder="Ex: João da Silva" />
                                <UserCheck className="icon" size={18} />
                            </div>
                        </div>

                        <div className="input-group">
                            <label>E-mail (Login)</label>
                            <div className="input-wrapper">
                                <input value={newDriver.email} onChange={e => setNewDriver({ ...newDriver, email: e.target.value })} placeholder="email@exemplo.com" />
                                <Save className="icon" size={18} />
                            </div>
                        </div>

                        <div className="input-group">
                            <label>Telefone</label>
                            <div className="input-wrapper">
                                <input value={newDriver.phone_number} onChange={e => setNewDriver({ ...newDriver, phone_number: e.target.value })} placeholder="Digite o telefone" />
                                <Phone className="icon" size={18} />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                            <div className="input-group">
                                <label>Veículo</label>
                                <div className="input-wrapper">
                                    <input value={newDriver.vehicle_model} onChange={e => setNewDriver({ ...newDriver, vehicle_model: e.target.value })} placeholder="Modelo" />
                                    <Car className="icon" size={18} />
                                </div>
                            </div>
                            <div className="input-group">
                                <label>Placa</label>
                                <div className="input-wrapper">
                                    <input value={newDriver.license_plate} onChange={e => setNewDriver({ ...newDriver, license_plate: e.target.value })} placeholder="ABC-1234" />
                                    <span className="icon" style={{ fontSize: '0.8rem', fontWeight: 700 }}>#</span>
                                </div>
                            </div>
                        </div>

                        <div className="input-group">
                            <label>Senha de Acesso</label>
                            <div className="input-wrapper">
                                <input
                                    type="text"
                                    value={newDriver.password}
                                    onChange={e => setNewDriver({ ...newDriver, password: e.target.value })}
                                    placeholder="Ex: 123456"
                                />
                                <Lock className="icon" size={18} />
                            </div>
                            <p style={{ fontSize: '0.7rem', color: '#999', marginTop: 5 }}>Essa será a senha inicial do motorista.</p>
                        </div>

                        <button className="btn-primary" onClick={handleAddDriver} disabled={loading} style={{ marginTop: 10 }}>
                            <Save size={18} /> Salvar Motorista
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Admin
