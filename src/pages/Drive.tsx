import React, { useState, useEffect } from 'react'
import { ChevronLeft, HelpCircle, User, Calendar as CalendarIcon, DollarSign, CheckCircle2, Clock, Save, Plus } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { Passenger } from '../types'
import { Link, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const Drive = () => {
  const [passengers, setPassengers] = useState<Passenger[]>([])
  const [selectedPassenger, setSelectedPassenger] = useState<Passenger | null>(null)
  const [amount, setAmount] = useState('')
  const [status, setStatus] = useState<'paid' | 'pending'>('paid')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [pendingBalance, setPendingBalance] = useState(0)
  const [showHelp, setShowHelp] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchPassengers()
  }, [])

  useEffect(() => {
    if (selectedPassenger) {
      fetchPendingBalance(selectedPassenger.id)
    } else {
      setPendingBalance(0)
    }
  }, [selectedPassenger])

  async function fetchPendingBalance(passengerId: string) {
    const { data } = await supabase
      .from('trips')
      .select('amount')
      .eq('passenger_id', passengerId)
      .eq('status', 'pending')

    if (data) {
      const total = data.reduce((acc, trip) => acc + Number(trip.amount), 0)
      setPendingBalance(total)
    }
  }

  async function handleSettleBalance() {
    if (!selectedPassenger) return

    setLoading(true)
    const { error } = await supabase
      .from('trips')
      .update({ status: 'paid' })
      .eq('passenger_id', selectedPassenger.id)
      .eq('status', 'pending')

    if (!error) {
      alert('Todas as pendências de ' + selectedPassenger.full_name + ' foram pagas!')
      setPendingBalance(0)
    }
    setLoading(false)
  }

  async function fetchPassengers() {
    const { data } = await supabase.from('passengers').select('*').order('full_name')
    if (data) setPassengers(data)
  }

  const handleSaveTrip = async () => {
    if (!selectedPassenger || !amount) {
      alert('Por favor, selecione um passageiro e insira um valor')
      return
    }

    setLoading(true)
    const { error } = await supabase.from('trips').insert({
      passenger_id: selectedPassenger.id,
      amount: parseFloat(amount),
      status,
      notes,
      trip_date: format(new Date(), 'yyyy-MM-dd')
    })

    if (error) {
      alert('Erro ao salvar viagem: ' + error.message)
    } else {
      alert('Viagem salva com sucesso!')
      setAmount('')
      setSelectedPassenger(null)
      setNotes('')
      navigate('/history')
    }
    setLoading(false)
  }

  return (
    <div className="content">
      <header style={{ margin: '-20px -20px 20px -20px' }}>
        <button onClick={() => navigate(-1)} className="btn-back"><ChevronLeft /></button>
        <h1>Nova Viagem</h1>
        <button onClick={() => setShowHelp(true)}><HelpCircle /></button>
      </header>

      {showHelp && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div className="card" style={{ maxWidth: 400, width: '100%', position: 'relative', padding: '30px 20px' }}>
            <h2 style={{ fontSize: '1.4rem', marginBottom: 15, color: 'var(--primary)', textAlign: 'center' }}>Como usar esta página</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: '0.9rem', lineHeight: '1.4' }}>
              <div style={{ display: 'flex', gap: 10 }}><span style={{ color: 'var(--primary)', fontWeight: 700 }}>1.</span> Selecione o passageiro na lista ou use a "Seleção Rápida" no topo.</div>
              <div style={{ display: 'flex', gap: 10 }}><span style={{ color: 'var(--primary)', fontWeight: 700 }}>2.</span> Se o passageiro tiver dívidas pendentes, um card laranja aparecerá para você "Quitar Tudo" se desejar.</div>
              <div style={{ display: 'flex', gap: 10 }}><span style={{ color: 'var(--primary)', fontWeight: 700 }}>3.</span> Digite o valor dos ganhos desta viagem.</div>
              <div style={{ display: 'flex', gap: 10 }}><span style={{ color: 'var(--primary)', fontWeight: 700 }}>4.</span> Escolha se a viagem foi Paga agora ou se ficará Pendente.</div>
              <div style={{ display: 'flex', gap: 10 }}><span style={{ color: 'var(--primary)', fontWeight: 700 }}>5.</span> Clique em "Salvar Viagem" para registrar permanentemente.</div>
            </div>
            <button
              className="btn-primary"
              style={{ marginTop: 25 }}
              onClick={() => setShowHelp(false)}
            >
              Entendi!
            </button>
          </div>
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10, display: 'block' }}>SELEÇÃO RÁPIDA (RECENTES)</label>
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 10, scrollbarWidth: 'none' }}>
          {passengers.slice(0, 5).map(p => (
            <div
              key={p.id}
              onClick={() => setSelectedPassenger(p)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 70, cursor: 'pointer',
                opacity: selectedPassenger?.id === p.id ? 1 : 0.6
              }}
            >
              <div style={{
                width: 50, height: 50, borderRadius: '50%', background: '#eee',
                border: selectedPassenger?.id === p.id ? '2px solid var(--primary)' : '2px solid transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
              }}>
                {p.avatar_url ? <img src={p.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={20} color="#999" />}
              </div>
              <span style={{ fontSize: '0.65rem', fontWeight: 600, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', whiteSpace: 'nowrap' }}>
                {p.full_name.split(' ')[0]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Passenger Selection */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: 20 }}>
        <div className="avatar" style={{ marginRight: 0 }}>
          {selectedPassenger?.avatar_url ? (
            <img src={selectedPassenger.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: 'inherit' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e0e0e0' }}>
              <User color="#999" />
            </div>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <select
            style={{ width: '100%', border: 'none', background: 'transparent', fontSize: '1.2rem', fontWeight: 600, outline: 'none' }}
            value={selectedPassenger?.id || ''}
            onChange={(e) => {
              const p = passengers.find(p => p.id === e.target.value)
              setSelectedPassenger(p || null)
            }}
          >
            <option value="">Selecionar Passageiro</option>
            {passengers.map(p => (
              <option key={p.id} value={p.id}>{p.full_name}</option>
            ))}
          </select>
          <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>
            {selectedPassenger ? `${selectedPassenger.passenger_class}` : 'Selecione para registrar'}
          </div>
        </div>
        <Link to="/register-passenger" style={{ color: 'var(--primary)' }}>
          <Plus />
        </Link>
      </div>

      {pendingBalance > 0 && (
        <div className="card" style={{
          background: 'linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%)',
          border: '1px solid #FFCC80',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '15px',
          marginBottom: '20px',
          animation: 'slideDown 0.3s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Clock size={24} color="#BF360C" />
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#E65100', textTransform: 'uppercase' }}>Dívida Pendente</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#BF360C' }}>R$ {pendingBalance.toFixed(2)}</div>
            </div>
          </div>
          <button
            onClick={handleSettleBalance}
            disabled={loading}
            style={{
              backgroundColor: '#BF360C',
              color: 'white',
              border: 'none',
              padding: '10px 15px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 10px rgba(191, 54, 12, 0.2)'
            }}
          >
            QUITAR TUDO
          </button>
        </div>
      )}

      <div className="input-group">
        <label>DATA DA VIAGEM</label>
        <div className="card" style={{ padding: '15px', marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 600 }}>
            <ChevronLeft size={20} color="var(--primary)" />
            <span>{format(new Date(), 'MMMM yyyy', { locale: ptBR })}</span>
            <ChevronLeft size={20} color="var(--primary)" style={{ transform: 'rotate(180deg)' }} />
          </div>
          <div style={{ marginTop: '15px', textAlign: 'center' }}>
            <div style={{ display: 'inline-block', background: 'var(--primary)', color: 'white', width: '40px', height: '40px', lineHeight: '40px', borderRadius: '50%', fontWeight: 700 }}>
              {format(new Date(), 'd', { locale: ptBR })}
            </div>
          </div>
        </div>
      </div>

      <div className="input-group">
        <label>GANHOS</label>
        <div className="card" style={{ padding: '15px', marginBottom: 0 }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 5 }}>TOTAL DA VIAGEM</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>R$</span>
            <input
              type="number"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={{ border: 'none', fontSize: '2.5rem', fontWeight: 700, width: '100%', outline: 'none', color: '#333' }}
            />
          </div>
        </div>
      </div >

      <div className="input-group">
        <label>STATUS DO PAGAMENTO</label>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className={`tab ${status === 'paid' ? 'active' : ''}`}
            onClick={() => setStatus('paid')}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: status === 'paid' ? 'var(--primary)' : 'white', color: status === 'paid' ? 'white' : 'inherit' }}
          >
            <CheckCircle2 size={18} /> Pago
          </button>
          <button
            className={`tab ${status === 'pending' ? 'active' : ''}`}
            onClick={() => setStatus('pending')}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: status === 'pending' ? 'var(--pending)' : 'white', color: status === 'pending' ? 'white' : 'inherit' }}
          >
            <Clock size={18} /> Pendente
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ color: '#E0E0E0' }}>=</div>
          <input
            placeholder="Adicionar observações..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{ border: 'none', width: '100%', outline: 'none' }}
          />
          <ChevronLeft size={18} style={{ transform: 'rotate(180deg)', color: '#E0E0E0' }} />
        </div>
      </div>

      <button className="btn-primary" onClick={handleSaveTrip} disabled={loading}>
        <Save /> {loading ? 'Salvando...' : 'Salvar Viagem'}
      </button>

      <button style={{ width: '100%', padding: '15px', color: 'var(--text-muted)', fontWeight: 500 }}>Limpar Formulário</button>
    </div >
  )
}

export default Drive
