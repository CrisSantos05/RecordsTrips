import React, { useState, useEffect } from 'react'
import { ChevronLeft, User, Search, Phone } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { Trip } from '../types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { useNavigate } from 'react-router-dom'

const HistoryPage = () => {
    const [trips, setTrips] = useState<Trip[]>([])
    const [filter, setFilter] = useState<'all' | 'paid' | 'pending'>('all')
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        fetchTrips()
    }, [filter])

    async function fetchTrips() {
        setLoading(true)
        let query = supabase
            .from('trips')
            .select('*, passenger:passengers(*)')
            .order('trip_date', { ascending: false })

        if (filter !== 'all') {
            query = query.eq('status', filter)
        }

        const { data } = await query
        if (data) setTrips(data)
        setLoading(false)
    }

    async function handleToggleStatus(tripId: string, currentStatus: string) {
        const newStatus = currentStatus === 'paid' ? 'pending' : 'paid'
        const { error } = await supabase
            .from('trips')
            .update({ status: newStatus })
            .eq('id', tripId)

        if (!error) {
            setTrips(trips.map(t => t.id === tripId ? { ...t, status: newStatus } : t))
        }
    }

    const totals = trips.reduce((acc, trip) => {
        if (trip.status === 'paid') acc.paid += Number(trip.amount)
        if (trip.status === 'pending') acc.pending += Number(trip.amount)
        return acc
    }, { paid: 0, pending: 0 })

    const paidCount = trips.filter(t => t.status === 'paid').length
    const pendingCount = trips.filter(t => t.status === 'pending').length

    return (
        <div className="content">
            <header style={{ margin: '-20px -20px 20px -20px' }}>
                <button onClick={() => navigate(-1)} className="btn-back"><ChevronLeft /></button>
                <h1>Histórico de Viagens</h1>
                <button><div className="avatar" style={{ width: 32, height: 32, margin: 0 }}><User size={16} /></div></button>
            </header>

            <div className="summary-grid">
                <div className="summary-card paid">
                    <div className="label"><CheckCircle size={14} /> TOTAL PAGO</div>
                    <div className="value">R${totals.paid.toFixed(2)}</div>
                    <div style={{ fontSize: '0.7rem', color: '#666' }}>{paidCount} viagens este mês</div>
                </div>
                <div className="summary-card pending">
                    <div className="label"><Clock size={14} /> TOTAL PENDENTE</div>
                    <div className="value">R${totals.pending.toFixed(2)}</div>
                    <div style={{ fontSize: '0.7rem', color: '#666' }}>{pendingCount} viagem aguardando</div>
                </div>
            </div>

            <div className="tabs">
                <button className={`tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>Todas</button>
                <button className={`tab ${filter === 'paid' ? 'active' : ''}`} onClick={() => setFilter('paid')}>Pagas</button>
                <button className={`tab ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')}>Pendentes</button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15, alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.2rem' }}>Atividade Recente</h2>
                <span style={{ fontSize: '0.8rem', color: '#1E88E5', fontWeight: 600 }}>{format(new Date(), 'MMMM yyyy', { locale: ptBR })}</span>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>Carregando viagens...</div>
            ) : trips.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>Nenhuma viagem encontrada</div>
            ) : (
                trips.map(trip => (
                    <div key={trip.id} className="history-item" style={{ cursor: 'pointer' }}>
                        {trip.passenger?.avatar_url ? (
                            <img src={trip.passenger.avatar_url} className="avatar" alt="" />
                        ) : (
                            <div className="avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User /></div>
                        )}
                        <div className="history-info">
                            <div className="name">{trip.passenger?.full_name || 'Desconhecido'}</div>
                            <div className="meta">
                                <span>{format(new Date(trip.trip_date), 'MMM d', { locale: ptBR })}</span>
                                <span>•</span>
                                <span>{format(new Date(trip.created_at), 'HH:mm', { locale: ptBR })}</span>
                            </div>
                        </div>
                        <div className="history-amount">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end' }}>
                                <div
                                    onClick={() => handleToggleStatus(trip.id, trip.status)}
                                    className={`badge ${trip.status}`}
                                    style={{ cursor: 'pointer', userSelect: 'none' }}
                                >
                                    {trip.status === 'paid' ? 'PAGO' : 'PENDENTE'}
                                </div>
                                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: trip.status === 'pending' ? 'var(--error)' : 'inherit' }}>
                                    R$ {Number(trip.amount).toFixed(2)}
                                </div>
                                {trip.status === 'pending' && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const message = encodeURIComponent(`Olá ${trip.passenger?.full_name}, aqui é o seu motorista. Passando para lembrar da nossa viagem no valor de R$ ${Number(trip.amount).toFixed(2)}. Segue o PIX para acerto: [SUA CHAVE AQUI]`);
                                            window.open(`https://wa.me/${trip.passenger?.phone_number?.replace(/\D/g, '')}?text=${message}`, '_blank');
                                        }}
                                        style={{
                                            fontSize: '0.7rem',
                                            padding: '5px 10px',
                                            backgroundColor: '#E8F5E9',
                                            color: '#2E7D32',
                                            borderRadius: 8,
                                            fontWeight: 700,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 4,
                                            border: 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <Phone size={12} /> COBRAR
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))
            )}

            <div style={{ textAlign: 'center', padding: '20px', color: '#999', fontSize: '0.8rem' }}>
                Fim do histórico
            </div>
        </div>
    )
}

const CheckCircle = ({ size }: { size: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
const Clock = ({ size }: { size: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>

export default HistoryPage
