import { useCallback, useEffect, useMemo, useState } from 'react'

const STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
const STATUS_FILTERS = ['All orders', 'Pending', 'Processing', 'Shipped']

const iconPaths = {
  bag: <><path d="M5 8h14l1 13H4L5 8Z" /><path d="M9 8a3 3 0 0 1 6 0" /></>,
  box: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 8 9 5 9-5" /><path d="M3 8v9l9 5 9-5V8M12 13v9" /></>,
  chart: <><path d="M4 19V5M4 19h17" /><path d="m7 15 4-4 3 2 6-7" /></>,
  customers: <><circle cx="9" cy="8" r="3" /><path d="M3 20v-1a6 6 0 0 1 12 0v1M16 5.2a3 3 0 0 1 0 5.6M18 14a5 5 0 0 1 3 4.6v1" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  arrow: <><path d="M7 17 17 7M7 7h10v10" /></>,
  refresh: <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M5.5 9a7 7 0 0 1 12-2L20 12M4 12l2.5 5a7 7 0 0 0 12-2" /></>,
  dots: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
  close: <><path d="m18 6-12 12M6 6l12 12" /></>,
  trash: <><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6" /></>,
  alert: <><path d="M12 3 2.8 19h18.4L12 3Z" /><path d="M12 9v4m0 3h.01" /></>,
  check: <><path d="m5 12 4 4L19 6" /></>,
}

function Icon({ name, size = 18, className = '' }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {iconPaths[name]}
    </svg>
  )
}

function getErrorMessage(response, body) {
  if (body && typeof body === 'object') {
    return body.message || body.detail || body.error || `Request failed (${response.status})`
  }
  return body || `Request failed (${response.status})`
}

async function request(path, options) {
  const response = await fetch(path, options)
  if (!response.ok) {
    const text = await response.text()
    let body
    if (text) {
      try {
        body = JSON.parse(text)
      } catch {
        body = text
      }
    }
    throw new Error(getErrorMessage(response, body))
  }
  if (response.status === 204) return null
  return response.json()
}

async function fetchOrders() {
  const data = await request('/api/orders')
  if (!Array.isArray(data)) throw new Error('The orders API returned an unexpected response.')
  return data
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value || 0))
}

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? '—'
    : new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

function StatusBadge({ status }) {
  const normalized = (status || 'pending').toLowerCase()
  const styles = {
    pending: 'bg-amber-50 text-amber-700 ring-amber-200',
    processing: 'bg-blue-50 text-blue-700 ring-blue-200',
    shipped: 'bg-violet-50 text-violet-700 ring-violet-200',
    delivered: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    cancelled: 'bg-rose-50 text-rose-700 ring-rose-200',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${styles[normalized] || 'bg-slate-50 text-slate-600 ring-slate-200'}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {normalized}
    </span>
  )
}

function OrderModal({ onClose, onCreate, saving }) {
  const [form, setForm] = useState({
    orderNumber: '',
    customerEmail: '',
    totalAmount: '',
    status: 'pending',
  })
  const [formError, setFormError] = useState('')

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
    setFormError('')
  }

  async function submit(event) {
    event.preventDefault()
    try {
      await onCreate({ ...form, totalAmount: Number(form.totalAmount) })
    } catch (error) {
      setFormError(error.message)
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section aria-labelledby="modal-title" aria-modal="true" className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl" role="dialog">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">Order management</p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900" id="modal-title">Create a new order</h2>
            <p className="mt-1 text-sm text-slate-500">Enter the order details below to add it to your records.</p>
          </div>
          <button aria-label="Close dialog" className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" onClick={onClose} type="button">
            <Icon name="close" />
          </button>
        </div>
        <form className="space-y-4 p-6" onSubmit={submit}>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="orderNumber">Order number</label>
            <input autoFocus className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100" id="orderNumber" maxLength="100" name="orderNumber" onChange={updateField} placeholder="e.g. ORD-1042" required value={form.orderNumber} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="customerEmail">Customer email</label>
            <input className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100" id="customerEmail" name="customerEmail" onChange={updateField} placeholder="name@example.com" required type="email" value={form.customerEmail} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="totalAmount">Total amount</label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-sm text-slate-400">$</span>
                <input className="w-full rounded-lg border border-slate-200 py-2.5 pl-7 pr-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100" id="totalAmount" min="0.01" name="totalAmount" onChange={updateField} placeholder="0.00" required step="0.01" type="number" value={form.totalAmount} />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="status">Status</label>
              <select className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm capitalize outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100" id="status" name="status" onChange={updateField} value={form.status}>
                {STATUSES.map((status) => <option className="capitalize" key={status} value={status}>{status}</option>)}
              </select>
            </div>
          </div>
          {formError && <p className="rounded-lg bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700" role="alert">{formError}</p>}
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100" onClick={onClose} type="button">Cancel</button>
            <button className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60" disabled={saving} type="submit">
              <Icon name="plus" size={16} />{saving ? 'Creating…' : 'Create order'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

function App() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('All orders')

  const loadOrders = useCallback(async () => {
    try {
      const data = await fetchOrders()
      setOrders(data)
      setError('')
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    fetchOrders()
      .then((data) => {
        if (active) {
          setOrders(data)
          setError('')
        }
      })
      .catch((loadError) => {
        if (active) setError(loadError.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  async function createOrder(order) {
    setSaving(true)
    try {
      const created = await request('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      })
      setOrders((current) => [created, ...current])
      setIsModalOpen(false)
      setError('')
    } finally {
      setSaving(false)
    }
  }

  async function deleteOrder(order) {
    if (!window.confirm(`Delete order ${order.orderNumber}? This action cannot be undone.`)) return
    setDeletingId(order.id)
    setError('')
    try {
      await request(`/api/orders/${order.id}`, { method: 'DELETE' })
      setOrders((current) => current.filter((item) => item.id !== order.id))
    } catch (deleteError) {
      setError(deleteError.message)
    } finally {
      setDeletingId(null)
    }
  }

  const visibleOrders = useMemo(() => {
    const query = search.trim().toLowerCase()
    return orders.filter((order) => {
      const matchesSearch = !query || [order.orderNumber, order.customerEmail, order.status]
        .some((value) => String(value || '').toLowerCase().includes(query))
      const matchesFilter = activeFilter === 'All orders' || order.status?.toLowerCase() === activeFilter.toLowerCase()
      return matchesSearch && matchesFilter
    })
  }, [orders, search, activeFilter])

  const pendingCount = orders.filter((order) => order.status?.toLowerCase() === 'pending').length
  const processingCount = orders.filter((order) => order.status?.toLowerCase() === 'processing').length
  const revenue = orders.reduce((total, order) => total + Number(order.totalAmount || 0), 0)

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-800">
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-[248px] flex-col border-r border-slate-200/80 bg-white lg:flex">
        <div className="flex h-[76px] items-center gap-3 border-b border-slate-100 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-200"><Icon name="box" size={20} /></div>
          <span className="text-[17px] font-bold tracking-tight text-slate-900">OrderStar<span className="text-indigo-600">.</span></span>
        </div>
        <div className="px-4 pt-7">
          <p className="px-3 text-[10px] font-bold uppercase tracking-[0.17em] text-slate-400">Workspace</p>
          <nav aria-label="Main navigation" className="mt-3 space-y-1">
            <a className="flex items-center gap-3 rounded-lg bg-indigo-50 px-3 py-2.5 text-sm font-semibold text-indigo-700" href="#orders"><Icon name="bag" size={18} />Orders<span className="ml-auto rounded-md bg-indigo-100 px-2 py-0.5 text-[11px] font-bold">{orders.length}</span></a>
            <a className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-800" href="#overview"><Icon name="chart" size={18} />Overview</a>
            <a className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-800" href="#customers"><Icon name="customers" size={18} />Customers</a>
          </nav>
        </div>
        <div className="mt-auto border-t border-slate-100 p-5">
          <div className="rounded-xl bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700"><span className="h-2 w-2 rounded-full bg-emerald-500" />Your store is live</div>
            <p className="mt-2 text-xs leading-5 text-slate-500">Orders are synced directly with your database.</p>
          </div>
          <div className="mt-4 flex items-center gap-3 px-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">NS</div>
            <div><p className="text-sm font-semibold text-slate-800">Store admin</p><p className="text-xs text-slate-500">Administrator</p></div>
          </div>
        </div>
      </aside>

      <main className="min-h-screen lg:ml-[248px]">
        <header className="flex h-[76px] items-center justify-between border-b border-slate-200/80 bg-white/80 px-5 backdrop-blur sm:px-8 lg:px-10">
          <div className="flex items-center gap-2 text-sm"><span className="text-slate-400">Workspace</span><span className="text-slate-300">/</span><span className="font-semibold text-slate-700">Orders</span></div>
          <div className="flex items-center gap-3"><span className="hidden text-xs font-medium text-slate-500 sm:inline">Order management</span><div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-xs font-bold text-slate-600">NS</div></div>
        </header>

        <div className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 sm:py-10 lg:px-10">
          <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-medium text-indigo-600">Your store, at a glance</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 sm:text-[34px]">Orders</h1>
              <p className="mt-2 text-sm text-slate-500">Manage and keep track of your customer orders.</p>
            </div>
            <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100" onClick={() => setIsModalOpen(true)} type="button"><Icon name="plus" size={17} />Create order</button>
          </section>

          {error && (
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3.5 text-sm text-rose-800" role="alert">
              <Icon className="mt-0.5 shrink-0" name="alert" />
              <div className="min-w-0 flex-1"><p className="font-semibold">Something went wrong</p><p className="mt-0.5 break-words text-rose-700">{error}</p></div>
              {!orders.length && <button className="shrink-0 font-semibold underline underline-offset-2" onClick={() => { setRefreshing(true); void loadOrders() }} type="button">Retry</button>}
            </div>
          )}

          <section aria-label="Order summary" className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Total orders', value: orders.length, icon: 'bag', foot: 'All orders in your store', tint: 'bg-indigo-50 text-indigo-600' },
              { label: 'Pending', value: pendingCount, icon: 'chart', foot: 'Awaiting fulfillment', tint: 'bg-amber-50 text-amber-600' },
              { label: 'Processing', value: processingCount, icon: 'box', foot: 'Currently in progress', tint: 'bg-blue-50 text-blue-600' },
              { label: 'Total revenue', value: formatCurrency(revenue), icon: 'arrow', foot: 'Across all orders', tint: 'bg-emerald-50 text-emerald-600' },
            ].map((stat) => (
              <article className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.025)]" key={stat.label}>
                <div className="flex items-center justify-between"><p className="text-sm font-medium text-slate-500">{stat.label}</p><span className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.tint}`}><Icon name={stat.icon} size={18} /></span></div>
                <p className="mt-3 text-[26px] font-bold tracking-tight text-slate-900">{loading ? <span className="inline-block h-8 w-20 animate-pulse rounded bg-slate-100 align-middle" /> : stat.value}</p>
                <p className="mt-1 text-xs text-slate-400">{stat.foot}</p>
              </article>
            ))}
          </section>

          <section className="mt-8 overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.025)]" id="orders">
            <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div><h2 className="text-base font-bold text-slate-900">All orders</h2><p className="mt-1 text-xs text-slate-500">A list of every order placed in your store.</p></div>
                <div className="flex items-center gap-2">
                  <label className="relative block flex-1 sm:w-[260px] sm:flex-none">
                    <span className="sr-only">Search orders</span><Icon className="pointer-events-none absolute left-3 top-2.5 text-slate-400" name="search" size={17} />
                    <input className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50" onChange={(event) => setSearch(event.target.value)} placeholder="Search orders…" value={search} />
                  </label>
                  <button aria-label="Refresh orders" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800 disabled:opacity-50" disabled={loading || refreshing} onClick={() => { setRefreshing(true); setError(''); void loadOrders() }} type="button"><Icon className={refreshing ? 'animate-spin' : ''} name="refresh" size={17} /></button>
                </div>
              </div>
              <div aria-label="Filter by status" className="flex gap-1 overflow-x-auto" role="tablist">
                {STATUS_FILTERS.map((filter) => (
                  <button aria-selected={activeFilter === filter} className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition ${activeFilter === filter ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`} key={filter} onClick={() => setActiveFilter(filter)} role="tab" type="button">{filter}</button>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[740px] border-collapse text-left">
                <thead><tr className="bg-slate-50/70 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                  <th className="px-6 py-3.5">Order</th><th className="px-5 py-3.5">Customer</th><th className="px-5 py-3.5">Date</th><th className="px-5 py-3.5">Status</th><th className="px-5 py-3.5 text-right">Amount</th><th className="w-16 px-5 py-3.5"><span className="sr-only">Actions</span></th>
                </tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? Array.from({ length: 4 }, (_, index) => (
                    <tr key={index}><td className="px-6 py-5"><span className="block h-4 w-24 animate-pulse rounded bg-slate-100" /><span className="mt-2 block h-3 w-16 animate-pulse rounded bg-slate-50" /></td><td className="px-5 py-5"><span className="block h-4 w-36 animate-pulse rounded bg-slate-100" /></td><td className="px-5 py-5"><span className="block h-4 w-24 animate-pulse rounded bg-slate-100" /></td><td className="px-5 py-5"><span className="block h-6 w-20 animate-pulse rounded-full bg-slate-100" /></td><td className="px-5 py-5"><span className="ml-auto block h-4 w-16 animate-pulse rounded bg-slate-100" /></td><td /></tr>
                  )) : visibleOrders.map((order) => (
                    <tr className="transition hover:bg-slate-50/70" key={order.id}>
                      <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500"><Icon name="box" size={17} /></div><div><p className="text-sm font-semibold text-slate-800">{order.orderNumber || `Order #${order.id}`}</p><p className="mt-0.5 text-xs text-slate-400">ID: {order.id}</p></div></div></td>
                      <td className="px-5 py-4 text-sm text-slate-600">{order.customerEmail}</td>
                      <td className="px-5 py-4 text-sm text-slate-500">{formatDate(order.createdAt)}</td>
                      <td className="px-5 py-4"><StatusBadge status={order.status} /></td>
                      <td className="px-5 py-4 text-right text-sm font-semibold text-slate-800">{formatCurrency(order.totalAmount)}</td>
                      <td className="px-5 py-4 text-right"><button aria-label={`Delete ${order.orderNumber || `order ${order.id}`}`} className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40" disabled={deletingId === order.id} onClick={() => deleteOrder(order)} title="Delete order" type="button"><Icon name="trash" size={16} /></button></td>
                    </tr>
                  ))}
                  {!loading && !visibleOrders.length && (
                    <tr><td className="px-6 py-16 text-center" colSpan="6"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400"><Icon name={search || activeFilter !== 'All orders' ? 'search' : 'bag'} size={21} /></div><h3 className="mt-4 text-sm font-semibold text-slate-800">{orders.length ? 'No matching orders' : 'No orders yet'}</h3><p className="mt-1 text-sm text-slate-500">{orders.length ? 'Try adjusting your search or status filter.' : 'Create your first order to get started.'}</p>{!orders.length && <button className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700" onClick={() => setIsModalOpen(true)} type="button"><Icon name="plus" size={16} />Create your first order</button>}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <footer className="flex items-center justify-between border-t border-slate-100 px-5 py-3.5 text-xs text-slate-500 sm:px-6">
              <span>Showing <strong className="font-semibold text-slate-700">{visibleOrders.length}</strong> of <strong className="font-semibold text-slate-700">{orders.length}</strong> orders</span>
              <span className="inline-flex items-center gap-1.5"><Icon className="text-emerald-500" name="check" size={14} />Synced with database</span>
            </footer>
          </section>
          <p className="mt-6 text-center text-xs text-slate-400">OrderStar Orders · Store operations made simple</p>
        </div>
      </main>
      {isModalOpen && <OrderModal onClose={() => setIsModalOpen(false)} onCreate={createOrder} saving={saving} />}
    </div>
  )
}

export default App
