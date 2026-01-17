import React, { useState, useEffect } from 'react'
import { ChevronLeft, BarChart3, TrendingUp, DollarSign, HelpCircle } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'
import HelpModal from '../components/HelpModal'

const Earnings = () => {
    const [stats, setStats] = useState({ total: 0, paid: 0, pending: 0, count: 0 })
    const [showHelp, setShowHelp] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        fetchStats()
    }, [])

    async function fetchStats() {
        const { data } = await supabase.from('trips').select('amount, status')
        if (data) {
            const s = data.reduce((acc, trip) => {
                const amt = Number(trip.amount)
                acc.total += amt
                if (trip.status === 'paid') acc.paid += amt
                else acc.paid += 0 // wait
                if (trip.status === 'pending') acc.pending += amt
                acc.count += 1
                return acc
            }, { total: 0, paid: 0, pending: 0, count: 0 })

            // Fixed paid calculation
            const paid = data.filter(t => t.status === 'paid').reduce((a, b) => a + Number(b.amount), 0)
            setStats({ ...s, paid })
        }
    }

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
                    "O gráfico de barras ajuda a comparar seu rendimento dia a dia na semana atual.",
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

            <h3 style={{ fontSize: '1.2rem', marginBottom: 15 }}>Desempenho</h3>
            <div className="card">
                <div style={{ height: '150px', display: 'flex', alignItems: 'flex-end', gap: '15px', justifyContent: 'space-between', padding: '0 10px' }}>
                    {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                        <div key={i} style={{ flex: 1, background: i === 3 ? 'var(--primary)' : '#eee', height: `${h}%`, borderRadius: '8px 8px 0 0' }}></div>
                    ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: '0.7rem', color: '#999' }}>
                    <span>SEG</span><span>TER</span><span>QUA</span><span>QUI</span><span>SEX</span><span>SÁB</span><span>DOM</span>
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
