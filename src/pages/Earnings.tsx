import React, { useState, useEffect } from 'react'
import { ChevronLeft, BarChart3, TrendingUp, DollarSign, HelpCircle, Receipt, ArrowUpCircle, ArrowDownCircle, Wallet } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'
import HelpModal from '../components/HelpModal'
import {
    startOfWeek, endOfWeek, isWithinInterval, getDay,
    startOfDay, endOfDay, subDays, subMonths,
    format, eachDayOfInterval, isSameDay, startOfMonth,
    eachMonthOfInterval, isSameMonth, subYears
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import PullToRefresh from 'react-simple-pull-to-refresh'

type FilterType = 'day' | 'week' | '1month' | '3months' | '6months' | '1year';

const Earnings = () => {
    const [filter, setFilter] = useState<FilterType>('week')
    const [stats, setStats] = useState({
        totalEarnings: 0,
        totalExpenses: 0,
        paid: 0,
        pending: 0,
        count: 0,
        chartData: [] as { label: string, income: number, expense: number, isHighlighted: boolean }[]
    })
    const [showHelp, setShowHelp] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        fetchData()
    }, [filter])

    async function fetchData() {
        const savedProfile = localStorage.getItem('driver_profile')
        if (!savedProfile) return
        const currentDriverId = JSON.parse(savedProfile).id

        // Fetch trips
        const { data: tripsData } = await supabase
            .from('trips')
            .select('amount, status, trip_date, passenger:passengers(driver_id)')
            .eq('passenger.driver_id', currentDriverId)

        // Fetch expenses
        const { data: expensesData } = await supabase
            .from('expenses')
            .select('amount, expense_date')
            .eq('driver_id', currentDriverId)

        if (tripsData) {
            processData(tripsData, expensesData || [])
        }
    }

    function processData(trips: any[], expenses: any[]) {
        const now = new Date()
        let startDate: Date
        let endDate = endOfDay(now)
        let grouping: 'hour' | 'day' | 'month' = 'day'

        switch (filter) {
            case 'day':
                startDate = startOfDay(now)
                grouping = 'hour'
                break
            case 'week':
                startDate = subDays(startOfDay(now), 6)
                grouping = 'day'
                break
            case '1month':
                startDate = subMonths(startOfDay(now), 1)
                grouping = 'day'
                break
            case '3months':
                startDate = subMonths(startOfMonth(now), 2)
                grouping = 'month'
                break
            case '6months':
                startDate = subMonths(startOfMonth(now), 5)
                grouping = 'month'
                break
            case '1year':
                startDate = subMonths(startOfMonth(now), 11)
                grouping = 'month'
                break
            default:
                startDate = subDays(now, 6)
        }

        let totalEarnings = 0
        let totalExpenses = 0
        let paid = 0
        let pending = 0
        let count = 0

        // Calculate totals (all time or filtered?)
        // Usually dashboards show all-time totals in the main cards, or period totals.
        // Let's show Period Totals for better context when filtering.

        const filteredTrips = trips.filter(t => {
            const date = new Date(t.trip_date + 'T12:00:00')
            return isWithinInterval(date, { start: startDate, end: endDate })
        })

        const filteredExpenses = expenses.filter(e => {
            const date = new Date(e.expense_date + 'T12:00:00')
            return isWithinInterval(date, { start: startDate, end: endDate })
        })

        filteredTrips.forEach(t => {
            const amt = Number(t.amount)
            totalEarnings += amt
            if (t.status === 'paid') paid += amt
            else pending += amt
            count++
        })

        filteredExpenses.forEach(e => {
            totalExpenses += Number(e.amount)
        })

        // Generate Chart Data
        const chartData: { label: string, income: number, expense: number, isHighlighted: boolean }[] = []

        if (grouping === 'day') {
            const days = eachDayOfInterval({ start: startDate, end: endDate })
            days.forEach(day => {
                const dayIncome = filteredTrips
                    .filter(t => isSameDay(new Date(t.trip_date + 'T12:00:00'), day))
                    .reduce((acc, t) => acc + Number(t.amount), 0)

                const dayExpense = filteredExpenses
                    .filter(e => isSameDay(new Date(e.expense_date + 'T12:00:00'), day))
                    .reduce((acc, e) => acc + Number(e.amount), 0)

                chartData.push({
                    label: format(day, filter === '1month' ? 'dd/MM' : 'EEE', { locale: ptBR }).toUpperCase(),
                    income: dayIncome,
                    expense: dayExpense,
                    isHighlighted: isSameDay(day, now)
                })
            })
        } else if (grouping === 'month') {
            const months = eachMonthOfInterval({ start: startDate, end: endDate })
            months.forEach(month => {
                const monthIncome = filteredTrips
                    .filter(t => isSameMonth(new Date(t.trip_date + 'T12:00:00'), month))
                    .reduce((acc, t) => acc + Number(t.amount), 0)

                const monthExpense = filteredExpenses
                    .filter(e => isSameMonth(new Date(e.expense_date + 'T12:00:00'), month))
                    .reduce((acc, e) => acc + Number(e.amount), 0)

                chartData.push({
                    label: format(month, 'MMM', { locale: ptBR }).toUpperCase(),
                    income: monthIncome,
                    expense: monthExpense,
                    isHighlighted: isSameMonth(month, now)
                })
            })
        } else if (grouping === 'hour') {
            // For 'day' filter, just show a single bar or breakdown?
            // Let's show 4 periods: Morning, Afternoon, Evening, Night
            const periods = [
                { label: 'MANHÃ', start: 6, end: 12 },
                { label: 'TARDE', start: 12, end: 18 },
                { label: 'NOITE', start: 18, end: 24 },
                { label: 'MADRUGA', start: 0, end: 6 }
            ]
            // This is a bit complex without actual trip times (trips currently only have dates).
            // If we don't have times, 'day' filter just shows one big bar.
            // Re-evaluating: The user wants "Dia, semana...". 
            // If I don't have time, "Dia" will just be one big bar.
            chartData.push({
                label: format(now, 'dd/MM'),
                income: totalEarnings,
                expense: totalExpenses,
                isHighlighted: true
            })
        }

        setStats({
            totalEarnings,
            totalExpenses,
            paid,
            pending,
            count,
            chartData
        })
    }

    const maxIncome = Math.max(...stats.chartData.map(d => d.income), 1)
    const maxExpense = Math.max(...stats.chartData.map(d => d.expense), 50) || 50

    return (
        <PullToRefresh onRefresh={fetchData} pullingContent="" refreshingContent="">
            <div className="content">
                <header style={{ margin: '-20px -20px 20px -20px' }}>
                    <button onClick={() => navigate(-1)} className="btn-back"><ChevronLeft /></button>
                    <h1>Ganhos</h1>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => navigate('/expenses')} style={{ color: '#ef4444' }}><Receipt /></button>
                        <button onClick={() => setShowHelp(true)}><HelpCircle /></button>
                    </div>
                </header>

                <HelpModal
                    isOpen={showHelp}
                    onClose={() => setShowHelp(false)}
                    title="Relatório Financeiro"
                    steps={[
                        "Acompanhe seus ganhos e gastos em diferentes períodos usando os filtros.",
                        "O card de saldo mostra o lucro real (Ganhos - Gastos).",
                        "Veja o detalhamento de quanto já foi recebido e quanto ainda está pendente.",
                        "Os gráficos comparam seu desempenho financeiro ao longo do tempo.",
                        "A barra azul representa seus ganhos e a vermelha seus gastos."
                    ]}
                />

                {/* Filter Selector */}
                <div style={{
                    display: 'flex',
                    gap: '4px',
                    overflowX: 'auto',
                    marginBottom: '25px',
                    padding: '4px',
                    background: '#f0f0f0',
                    borderRadius: '14px',
                    scrollbarWidth: 'none'
                }}>
                    {[
                        { id: 'day', label: 'Hoje' },
                        { id: 'week', label: '7d' },
                        { id: '1month', label: '1m' },
                        { id: '3months', label: '3m' },
                        { id: '6months', label: '6m' },
                        { id: '1year', label: '1a' }
                    ].map(f => (
                        <button
                            key={f.id}
                            onClick={() => setFilter(f.id as FilterType)}
                            style={{
                                padding: '8px 0',
                                flex: 1,
                                minWidth: '50px',
                                borderRadius: '10px',
                                border: 'none',
                                background: filter === f.id ? 'white' : 'transparent',
                                color: filter === f.id ? 'var(--primary)' : '#666',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                whiteSpace: 'nowrap',
                                boxShadow: filter === f.id ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                                transition: 'all 0.2s'
                            }}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                <div className="card" style={{ background: 'var(--primary)', color: 'white', padding: '30px 20px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', right: '-20px', top: '-20px', opacity: 0.1 }}>
                        <Wallet size={120} />
                    </div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.8, marginBottom: 5, fontWeight: 600 }}>SALDO LÍQUIDO (LUCRO)</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 800 }}>R${(stats.totalEarnings - stats.totalExpenses).toFixed(2)}</div>

                    <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
                        <div>
                            <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>GANHOS</div>
                            <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
                                <ArrowUpCircle size={14} /> R${stats.totalEarnings.toFixed(2)}
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>GASTOS</div>
                            <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
                                <ArrowDownCircle size={14} /> R${stats.totalExpenses.toFixed(2)}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="summary-grid">
                    <div className="summary-card" style={{ background: 'white', border: '1px solid #eee' }}>
                        <div className="label" style={{ color: 'var(--success)' }}><DollarSign size={14} /> COLETADO</div>
                        <div className="value" style={{ color: 'var(--success)' }}>R${stats.paid.toFixed(2)}</div>
                    </div>
                    <div className="summary-card" style={{ background: 'white', border: '1px solid #eee' }}>
                        <div className="label" style={{ color: 'var(--pending)' }}><DollarSign size={14} /> PENDENTE</div>
                        <div className="value" style={{ color: 'var(--pending)' }}>R${stats.pending.toFixed(2)}</div>
                    </div>
                </div>

                <h3 style={{ fontSize: '1.1rem', marginBottom: 15, marginTop: 25 }}>Gráfico de Ganhos</h3>
                <div className="card" style={{ padding: '25px 15px' }}>
                    <div style={{ height: '160px', display: 'flex', gap: filter === '1month' ? '2px' : '8px', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        {stats.chartData.map((d, i) => {
                            const heightPct = (d.income / maxIncome) * 100
                            const showValue = d.income > 0 && (filter !== '1month' || i % 3 === 0);
                            return (
                                <div key={i} style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>
                                    {showValue && (
                                        <span style={{
                                            fontSize: '0.45rem',
                                            fontWeight: 800,
                                            color: d.isHighlighted ? 'var(--primary)' : '#777',
                                            marginBottom: '4px',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {d.income >= 1000 ? `${(d.income / 1000).toFixed(1)}k` : d.income.toFixed(0)}
                                        </span>
                                    )}
                                    <div
                                        style={{
                                            width: '100%',
                                            background: d.isHighlighted ? 'var(--primary)' : 'rgba(74, 108, 247, 0.2)',
                                            height: `${Math.max(heightPct, d.income > 0 ? 3 : 1)}%`,
                                            borderRadius: '4px 4px 0 0',
                                            transition: 'all 0.5s ease-out',
                                            maxHeight: '120px'
                                        }}
                                    ></div>
                                </div>
                            )
                        })}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: '0.6rem', color: '#999', overflowX: 'hidden' }}>
                        {stats.chartData.filter((_, i) => {
                            if (filter === '1month') return i % 5 === 0; // Skip labels if too many
                            return true;
                        }).map((d, i) => (
                            <span key={i} style={{ flex: 1, textAlign: 'center' }}>{d.label}</span>
                        ))}
                    </div>
                </div>

                <h3 style={{ fontSize: '1.1rem', marginBottom: 15, marginTop: 25, color: '#ef4444' }}>Gráfico de Gastos</h3>
                <div className="card" style={{ padding: '25px 15px' }}>
                    <div style={{ height: '160px', display: 'flex', gap: filter === '1month' ? '2px' : '8px', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        {stats.chartData.map((d, i) => {
                            const heightPct = (d.expense / maxExpense) * 100
                            const showValue = d.expense > 0 && (filter !== '1month' || i % 3 === 0);
                            return (
                                <div key={i} style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>
                                    {showValue && (
                                        <span style={{
                                            fontSize: '0.45rem',
                                            fontWeight: 800,
                                            color: d.isHighlighted ? '#ef4444' : '#777',
                                            marginBottom: '4px',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {d.expense >= 1000 ? `${(d.expense / 1000).toFixed(1)}k` : d.expense.toFixed(0)}
                                        </span>
                                    )}
                                    <div
                                        style={{
                                            width: '100%',
                                            background: d.isHighlighted ? '#ef4444' : 'rgba(239, 68, 68, 0.2)',
                                            height: `${Math.max(heightPct, d.expense > 0 ? 3 : 1)}%`,
                                            borderRadius: '4px 4px 0 0',
                                            transition: 'all 0.5s ease-out',
                                            maxHeight: '120px'
                                        }}
                                    ></div>
                                </div>
                            )
                        })}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: '0.6rem', color: '#999', overflowX: 'hidden' }}>
                        {stats.chartData.filter((_, i) => {
                            if (filter === '1month') return i % 5 === 0;
                            return true;
                        }).map((d, i) => (
                            <span key={i} style={{ flex: 1, textAlign: 'center' }}>{d.label}</span>
                        ))}
                    </div>
                </div>

                <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
                    <div>
                        <div style={{ fontWeight: 600 }}>Média por Viagem</div>
                        <div style={{ fontSize: '0.8rem', color: '#999' }}>Neste período ({stats.count} viagens)</div>
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>R${stats.count ? (stats.totalEarnings / stats.count).toFixed(2) : '0,00'}</div>
                </div>
                <div style={{ height: 100 }}></div>
            </div>
        </PullToRefresh>
    )
}

export default Earnings
