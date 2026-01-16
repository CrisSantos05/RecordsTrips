import React, { useState, useEffect } from 'react'
import { ChevronLeft, User, Search } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { Trip } from '../types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { Link, useNavigate } from 'react-router-dom'

const HistoryPage = () => {
    const [trips, setTrips] = useState<Trip[]>([])
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        fetchTrips()
    }, [])

    async function fetchTrips() {
        setLoading(true)
        const { data } = await supabase
            .from('trips')
            .select('*, passenger:passengers(*)')
            .order('trip_date', { ascending: false })

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


            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15, alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.2rem' }}>Atividade Recente</h2>
                <span style={{ fontSize: '0.8rem', color: '#1E88E5', fontWeight: 600 }}>{format(new Date(), 'MMMM yyyy', { locale: ptBR })}</span>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>Carregando viagens...</div>
            ) : trips.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>Nenhuma viagem encontrada</div>
            ) : (
                (() => {
                    // Group trips by passenger_id
                    const groups: {
                        [key: string]: {
                            passenger: any,
                            totalAmount: number,
                            latestDate: string,
                            latestCreatedAt: string,
                            hasPending: boolean,
                            tripIds: string[]
                        }
                    } = {}

                    trips.forEach(trip => {
                        if (!groups[trip.passenger_id]) {
                            groups[trip.passenger_id] = {
                                passenger: trip.passenger,
                                totalAmount: 0,
                                latestDate: trip.trip_date,
                                latestCreatedAt: trip.created_at,
                                hasPending: false,
                                tripIds: []
                            }
                        }
                        const group = groups[trip.passenger_id]
                        group.totalAmount += Number(trip.amount)
                        group.tripIds.push(trip.id)
                        if (trip.status === 'pending') group.hasPending = true

                        // Keep the most recent dates
                        if (new Date(trip.trip_date) > new Date(group.latestDate)) group.latestDate = trip.trip_date
                        if (new Date(trip.created_at) > new Date(group.latestCreatedAt)) group.latestCreatedAt = trip.created_at
                    })

                    return Object.values(groups)
                        .sort((a, b) => new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime())
                        .map(group => (
                            <div key={group.passenger?.id || Math.random()} className="history-item" style={{ cursor: 'pointer' }} onClick={() => navigate(`/passenger/${group.passenger?.id}`)}>
                                {group.passenger?.avatar_url ? (
                                    <img src={group.passenger.avatar_url} className="avatar" alt="" />
                                ) : (
                                    <div className="avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User /></div>
                                )}
                                <div className="history-info">
                                    <div className="name" style={{ fontWeight: 700 }}>
                                        {group.passenger?.full_name || 'Desconhecido'}
                                    </div>
                                    <div className="meta">
                                        <span>{format(new Date(group.latestDate), 'MMM d', { locale: ptBR })}</span>
                                        <span>•</span>
                                        <span>{format(new Date(group.latestCreatedAt), 'HH:mm', { locale: ptBR })}</span>
                                    </div>
                                </div>
                                <div className="history-amount">
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end' }}>
                                        <div
                                            className={`badge ${group.hasPending ? 'pending' : 'paid'}`}
                                            style={{ userSelect: 'none' }}
                                        >
                                            {group.hasPending ? 'PENDENTE' : 'PAGO'}
                                        </div>
                                        <div style={{ fontWeight: 700, fontSize: '1.1rem', color: group.hasPending ? 'var(--error)' : 'inherit' }}>
                                            R$ {group.totalAmount.toFixed(2)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                })()
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
