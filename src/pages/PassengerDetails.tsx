import React, { useState, useEffect } from 'react'
import { ChevronLeft, User, Phone, MapPin, Calendar, DollarSign, Clock, CheckCircle2, History as HistoryIcon } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { Passenger, Trip } from '../types'
import { useNavigate, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const PassengerDetails = () => {
    const { id } = useParams()
    const [passenger, setPassenger] = useState<Passenger | null>(null)
    const [trips, setTrips] = useState<Trip[]>([])
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        fetchData()
    }, [id])

    async function fetchData() {
        if (!id) return
        setLoading(true)

        // Fetch passenger
        const { data: pData } = await supabase.from('passengers').select('*').eq('id', id).single()
        if (pData) setPassenger(pData)

        // Fetch trips
        const { data: tData } = await supabase
            .from('trips')
            .select('*')
            .eq('passenger_id', id)
            .order('trip_date', { ascending: false })

        if (tData) setTrips(tData)

        setLoading(false)
    }

    const toggleStatus = async (tripId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'paid' ? 'pending' : 'paid'
        const { error } = await supabase
            .from('trips')
            .update({ status: newStatus })
            .eq('id', tripId)

        if (!error) {
            setTrips(trips.map(t => t.id === tripId ? { ...t, status: newStatus as 'paid' | 'pending' } : t))
        }
    }

    const totals = trips.reduce((acc, trip) => {
        if (trip.status === 'paid') acc.paid += Number(trip.amount)
        else acc.pending += Number(trip.amount)
        return acc
    }, { paid: 0, pending: 0 })

    if (loading) return <div className="content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Carregando...</div>

    if (!passenger) return <div className="content" style={{ textAlign: 'center', padding: '50px' }}>Passageiro não encontrado</div>

    return (
        <div className="content">
            <header style={{ margin: '-20px -20px 20px -20px' }}>
                <button onClick={() => navigate(-1)} className="btn-back"><ChevronLeft /></button>
                <h1>Detalhes do Cliente</h1>
                <div style={{ width: 40 }}></div>
            </header>

            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 25, background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', color: 'white', border: 'none' }}>
                <div className="avatar" style={{ width: 70, height: 70, border: '3px solid rgba(255,255,255,0.3)', margin: 0 }}>
                    {passenger.avatar_url ? <img src={passenger.avatar_url} style={{ width: '100%', height: '100%', borderRadius: 'inherit' }} /> : <User size={30} />}
                </div>
                <div>
                    <h2 style={{ fontSize: '1.4rem', marginBottom: 5 }}>{passenger.full_name}</h2>
                    <div style={{ fontSize: '0.9rem', opacity: 0.9, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Phone size={14} /> {passenger.phone_number}
                    </div>
                    <div style={{ fontSize: '0.75rem', marginTop: 5, padding: '2px 8px', background: 'rgba(255,255,255,0.2)', borderRadius: 20, display: 'inline-block' }}>
                        {passenger.passenger_class}
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 25 }}>
                <div className="card" style={{ textAlign: 'center', padding: '15px 10px' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Pago</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--success)' }}>R$ {totals.paid.toFixed(2)}</div>
                </div>
                <div className="card" style={{ textAlign: 'center', padding: '15px 10px', background: totals.pending > 0 ? 'rgba(231, 76, 60, 0.05)' : 'none' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pendente</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: totals.pending > 0 ? 'var(--error)' : 'var(--text-muted)' }}>R$ {totals.pending.toFixed(2)}</div>
                </div>
            </div>

            <h3 style={{ fontSize: '1.1rem', marginBottom: 15, display: 'flex', alignItems: 'center', gap: 10 }}>
                <HistoryIcon size={18} /> Histórico de Viagens
            </h3>

            <div className="trip-list">
                {trips.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '30px', color: '#999' }}>Nenhuma viagem registrada</div>
                ) : (
                    trips.map(trip => (
                        <div key={trip.id} className="card" style={{ marginBottom: 12, padding: '15px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#666', fontSize: '0.8rem', fontWeight: 600, marginBottom: 5 }}>
                                        <Calendar size={14} /> {format(new Date(trip.trip_date), "dd 'de' MMMM", { locale: ptBR })}
                                    </div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>R$ {Number(trip.amount).toFixed(2)}</div>
                                    {trip.notes && <div style={{ fontSize: '0.75rem', color: '#888', marginTop: 5 }}>"{trip.notes}"</div>}
                                </div>
                                <div
                                    onClick={() => toggleStatus(trip.id, trip.status)}
                                    className={`status-badge ${trip.status}`}
                                    style={{ padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
                                >
                                    {trip.status === 'paid' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                                    {trip.status === 'paid' ? 'PAGO' : 'PENDENTE'}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

export default PassengerDetails
