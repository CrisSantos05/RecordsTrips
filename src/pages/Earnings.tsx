import React, { useState, useEffect } from 'react'
import { ChevronLeft, BarChart3, TrendingUp, DollarSign, HelpCircle } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'
import HelpModal from '../components/HelpModal'
import { startOfWeek, endOfWeek, isWithinInterval, parseISO, getDay, isSameDay } from 'date-fns'

const Earnings = () => {
    const [stats, setStats] = useState({ total: 0, paid: 0, pending: 0, count: 0, weeklyData: [0, 0, 0, 0, 0, 0, 0] })
    const [showHelp, setShowHelp] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        fetchStats()
    }, [])

    async function fetchStats() {
        const { data } = await supabase.from('trips').select('amount, status, trip_date')
        if (data) {
            const now = new Date();
            // Start week on Monday (1)
            const startStr = startOfWeek(now, { weekStartsOn: 1 });
            const endStr = endOfWeek(now, { weekStartsOn: 1 });

            const weeklySums = [0, 0, 0, 0, 0, 0, 0];

            let total = 0;
            let paid = 0;
            let pending = 0;
            let count = 0;

            data.forEach(trip => {
                const amt = Number(trip.amount);
                total += amt;
                if (trip.status === 'paid') paid += amt;
                if (trip.status === 'pending') pending += amt;
                count += 1;

                // Handle date string which might be YYYY-MM-DD
                // Append T00:00:00 to force local interpretation if it's just a date string
                const dateStr = trip.trip_date.includes('T') ? trip.trip_date : trip.trip_date + 'T00:00:00';
                const tripDate = new Date(dateStr);

                if (isWithinInterval(tripDate, { start: startStr, end: endStr })) {
                    // getDay returns 0 for Sunday, 1 for Monday...
                    // We want 0 for Monday, ..., 6 for Sunday
                    let dayIndex = getDay(tripDate); // 0 (Sun) - 6 (Sat)
                    // Convert to 0 (Mon) - 6 (Sun)
                    // If Sunday (0) -> 6
                    // If Monday (1) -> 0
                    // If Tuesday (2) -> 1
                    dayIndex = dayIndex === 0 ? 6 : dayIndex - 1;

                    if (dayIndex >= 0 && dayIndex <= 6) {
                        weeklySums[dayIndex] += amt;
                    }
                }
            });

            setStats({ total, paid, pending, count, weeklyData: weeklySums })
        }
    }

    const maxVal = Math.max(...stats.weeklyData, 1); // Avoid division by zero

    // Current day index for highlighting
    const currentDay = getDay(new Date());
    // Convert to 0 (Mon) - 6 (Sun)
    const currentDayIndex = currentDay === 0 ? 6 : currentDay - 1;

    return (
        <div className="content">
            <header style={{ margin: '-20px -20px 20px -20px' }}>
                <button onClick={() => navigate(-1)} className="btn-back"><ChevronLeft /></button>
                <h1>Ganhos</h1>
                <button onClick={() => setShowHelp(true)}><HelpCircle /></button>
            </header>

            <HelpModal
                isOpen={showHelp}
                onClose={() => setShowHelp(false)}
                title="Relatório de Ganhos"
                steps={[
                    "Visualize o desempenho financeiro do seu negócio.",
                    "O card principal (azul) mostra a receita total gerada até o momento.",
                    "Logo abaixo, veja separadamente o que já foi 'Coletado' (dinheiro no bolso) e o que está 'Pendente'.",
                    "O gráfico de barras ajuda a comparar seu rendimento dia a dia na semana ATUAL (Segunda a Domingo).",
                    "A barra destacada indica o dia de hoje.",
                    "No final da página, veja a média de valor por viagem para entender melhor sua rentabilidade."
                ]}
            />

            <div className="card" style={{ background: 'var(--primary)', color: 'white', textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: 10 }}>RECEITA TOTAL</div>
                <div style={{ fontSize: '3rem', fontWeight: 800 }}>R${stats.total.toFixed(2)}</div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 20 }}>
                    <div className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}><TrendingUp size={12} /> +12% esta semana</div>
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

            <h3 style={{ fontSize: '1.2rem', marginBottom: 15 }}>Desempenho Semanal</h3>
            <div className="card">
                <div style={{ height: '150px', display: 'flex', gap: '8px', justifyContent: 'space-between', padding: '0 5px' }}>
                    {stats.weeklyData.map((val, i) => {
                        // Calculate percentage height relative to max value
                        const heightPct = (val / maxVal) * 100;
                        const isToday = i === currentDayIndex;

                        return (
                            <div key={i} style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: 5 }}>
                                {val > 0 && <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: isToday ? 'var(--primary)' : '#aaa' }}>R${val.toFixed(0)}</span>}
                                <div
                                    style={{
                                        width: '100%',
                                        background: isToday ? 'var(--primary)' : '#e0e0e0',
                                        height: `${Math.max(heightPct, isToday ? 2 : 1)}%`,
                                        borderRadius: '6px 6px 0 0',
                                        transition: 'height 0.5s ease-out',
                                        minHeight: '4px'
                                    }}
                                ></div>
                            </div>
                        )
                    })}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: '0.7rem', color: '#999' }}>
                    <span style={{ flex: 1, textAlign: 'center' }}>SEG</span>
                    <span style={{ flex: 1, textAlign: 'center' }}>TER</span>
                    <span style={{ flex: 1, textAlign: 'center' }}>QUA</span>
                    <span style={{ flex: 1, textAlign: 'center' }}>QUI</span>
                    <span style={{ flex: 1, textAlign: 'center' }}>SEX</span>
                    <span style={{ flex: 1, textAlign: 'center' }}>SÁB</span>
                    <span style={{ flex: 1, textAlign: 'center' }}>DOM</span>
                </div>
            </div>

            <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div style={{ fontWeight: 600 }}>Média por Viagem</div>
                    <div style={{ fontSize: '0.8rem', color: '#999' }}>Baseado em {stats.count} viagens</div>
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>R${stats.count ? (stats.total / stats.count).toFixed(2) : '0,00'}</div>
            </div>      </div>
    )
}

export default Earnings
