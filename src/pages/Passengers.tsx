import React, { useState, useEffect } from 'react'
import { ChevronLeft, User, Search, Plus, Phone, History, HelpCircle } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { Passenger, Trip, DriverProfile } from '../types'
import { useNavigate, Link } from 'react-router-dom'
import HelpModal from '../components/HelpModal'

const Passengers = () => {
    const [passengers, setPassengers] = useState<Passenger[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [loading, setLoading] = useState(true)
    const [passengerBalances, setPassengerBalances] = useState<{ [key: string]: { paid: number, pending: number } }>({})
    const [driverProfile, setDriverProfile] = useState<DriverProfile | null>(null)
    const [showHelp, setShowHelp] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        fetchPassengersAndBalances()
        fetchDriverProfile()
    }, [])

    async function fetchDriverProfile() {
        const savedProfile = localStorage.getItem('driver_profile')
        if (!savedProfile) return

        const currentUser = JSON.parse(savedProfile)
        if (!currentUser.id) return

        const { data } = await supabase
            .from('driver_profile')
            .select('*')
            .eq('id', currentUser.id)
            .single()

        if (data) setDriverProfile(data)
    }

    async function fetchPassengersAndBalances() {
        setLoading(true)

        // Obter ID do motorista logado
        const savedProfile = localStorage.getItem('driver_profile')
        if (!savedProfile) {
            setLoading(false)
            return
        }
        const currentDriverId = JSON.parse(savedProfile).id

        // Buscar apenas passageiros deste motorista
        const { data: passengersData } = await supabase
            .from('passengers')
            .select('*')
            .eq('driver_id', currentDriverId)
            .order('full_name')

        if (passengersData) {
            setPassengers(passengersData)

            // Fetch all trips to calculate balances
            const { data: tripsData } = await supabase.from('trips').select('passenger_id, amount, status')

            const balances: { [key: string]: { paid: number, pending: number } } = {}
            tripsData?.forEach(trip => {
                if (!balances[trip.passenger_id]) {
                    balances[trip.passenger_id] = { paid: 0, pending: 0 }
                }
                if (trip.status === 'paid') {
                    balances[trip.passenger_id].paid += Number(trip.amount)
                } else {
                    balances[trip.passenger_id].pending += Number(trip.amount)
                }
            })
            setPassengerBalances(balances)
        }
        setLoading(false)
    }

    const filteredPassengers = passengers.filter(p =>
        p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.phone_number.includes(searchTerm)
    )

    return (
        <div className="content">
            <header style={{ margin: '-20px -20px 20px -20px' }}>
                <button onClick={() => navigate(-1)} className="btn-back"><ChevronLeft /></button>
                <h1>Passageiros</h1>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => setShowHelp(true)}><HelpCircle /></button>
                    <Link to="/register-passenger" style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center' }}>
                        <Plus size={24} />
                    </Link>
                </div>
            </header>

            <HelpModal
                isOpen={showHelp}
                onClose={() => setShowHelp(false)}
                title="Lista de Passageiros"
                steps={[
                    "Aqui ficam todos os seus passageiros cadastrados.",
                    "Use a barra de busca para encontrar alguém rapidamente pelo nome ou telefone.",
                    "Cada cartão mostra o saldo 'Pago' (verde) e 'Pendente' (vermelho) daquele passageiro.",
                    "Se houver pendências, um botão 'COBRAR' aparecerá. Clicando nele, você envia uma mensagem pronta no WhatsApp com o valor devido e sua chave PIX.",
                    "Toque no nome do passageiro para abrir os detalhes completos."
                ]}
            />

            <div className="search-bar" style={{ marginBottom: 20 }}>
                <Search className="search-icon" size={20} />
                <input
                    type="text"
                    placeholder="Buscar nome ou telefone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ background: 'transparent', border: 'none', width: '100%', outline: 'none', fontSize: '1rem' }}
                />
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>Carregando...</div>
            ) : filteredPassengers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>Nenhum passageiro encontrado</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {filteredPassengers.map(p => {
                        const bal = passengerBalances[p.id] || { paid: 0, pending: 0 }
                        return (
                            <div
                                key={p.id}
                                className="card"
                                style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 15, padding: '15px' }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 15, cursor: 'pointer' }} onClick={() => navigate(`/passenger/${p.id}`)}>
                                    <div className="avatar" style={{ margin: 0, width: 45, height: 45 }}>
                                        {p.avatar_url ? <img src={p.avatar_url} style={{ width: '100%', height: '100%', borderRadius: 'inherit' }} alt="" /> : <User />}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, fontSize: '1rem' }}>{p.full_name}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#666', display: 'flex', alignItems: 'center', gap: 5 }}>
                                            <Phone size={12} /> {p.phone_number}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--success)' }}>R$ {bal.paid.toFixed(2)}</div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 800, color: bal.pending > 0 ? 'var(--error)' : '#999' }}>
                                            R$ {bal.pending.toFixed(2)}
                                        </div>
                                        <div style={{ fontSize: '0.6rem', color: '#999', marginTop: 2 }}>Pendente</div>
                                    </div>
                                    <ChevronLeft size={20} style={{ transform: 'rotate(180deg)', color: '#ccc' }} />
                                </div>

                                {bal.pending > 0 && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const pixKey = driverProfile?.pix_key || 'não cadastrada';
                                            const message = encodeURIComponent(`Olá ${p.full_name}, aqui é o seu motorista. Passando para lembrar das nossas viagens que somam R$ ${bal.pending.toFixed(2)}. Segue o PIX para pagamento: ${pixKey}`);
                                            window.open(`https://wa.me/${p.phone_number?.replace(/\D/g, '')}?text=${message}`, '_blank');
                                        }}
                                        style={{
                                            fontSize: '0.8rem',
                                            padding: '10px 15px',
                                            backgroundColor: '#E8F5E9',
                                            color: '#2E7D32',
                                            borderRadius: 8,
                                            fontWeight: 700,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 6,
                                            border: 'none',
                                            cursor: 'pointer',
                                            width: '100%'
                                        }}
                                    >
                                        <Phone size={14} /> COBRAR R$ {bal.pending.toFixed(2)}
                                    </button>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
            <div style={{ height: 100 }}></div>
        </div>
    )
}

export default Passengers
