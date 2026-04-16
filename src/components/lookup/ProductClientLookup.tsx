'use client'

import { useState } from 'react'
import Link from 'next/link'
import { getClientsByProducts, getClientsBySkus } from '@/lib/actions/lookup'
import { formatCurrency } from '@/lib/utils/format'
import { parseCsvText } from '@/lib/import/parser'
import * as XLSX from 'xlsx'

interface Product {
  id: string
  name: string
  sku: string
  category: string | null
}

interface ClientResult {
  client: {
    id: string
    companyName: string
    contactPerson: string | null
    city: string | null
    phone: string | null
  }
  products: Array<{
    id: string
    name: string
    sku: string
    totalQty: number
    totalValue: number
  }>
  totalProducts: number
}

interface PriceChange {
  sku: string
  productName?: string
  oldPrice: number
  newPrice: number
  discount: number
}

interface ClientEmail {
  id: string
  companyName: string
  contactPerson: string | null
  email: string | null
  products: PriceChange[]
  emailBody: string
}

function generateEmail(
  contactPerson: string | null,
  companyName: string,
  products: PriceChange[],
  agentName: string
): string {
  const greeting = contactPerson
    ? `Bună ziua, ${contactPerson},`
    : `Bună ziua,`

  const productLines = products
    .map((p) => {
      const pct = Math.round(p.discount)
      return `  - ${p.productName || p.sku}: ${formatCurrency(p.oldPrice)} → ${formatCurrency(p.newPrice)} (-${pct}%)`
    })
    .join('\n')

  return `${greeting}

Vă mulțumim pentru colaborarea de până acum! Avem vești bune — produsele pe care le utilizați frecvent beneficiază acum de prețuri promoționale speciale:

${productLines}

Este momentul ideal să vă reîmprospătați stocul la prețuri avantajoase. Oferta este valabilă în limita stocului disponibil.

Pentru a plasa o comandă sau pentru orice detalii suplimentare, mă puteți contacta oricând — sunt la dispoziția dumneavoastră.

Cu drag,
${agentName}
Consultant vânzări — DenteX`
}

export function ProductClientLookup({ products, agentName }: { products: Product[]; agentName: string }) {
  const [activeTab, setActiveTab] = useState<'manual' | 'promo'>('manual')

  return (
    <div className="space-y-6">
      {/* Tab switcher */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('manual')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'manual'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Căutare Manuală
        </button>
        <button
          onClick={() => setActiveTab('promo')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'promo'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Promoție CSV + Email
        </button>
      </div>

      {activeTab === 'manual' ? (
        <ManualLookup products={products} />
      ) : (
        <PromoEmailGenerator agentName={agentName} />
      )}
    </div>
  )
}

// ── Manual Lookup Tab ──────────────────────────────────────────────

function ManualLookup({ products }: { products: Product[] }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<ClientResult[] | null>(null)
  const [loading, setLoading] = useState(false)

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
  )

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSearch = async () => {
    if (selectedIds.size === 0) return
    setLoading(true)
    try {
      const data = await getClientsByProducts(Array.from(selectedIds))
      setResults(data)
    } finally {
      setLoading(false)
    }
  }

  const clearAll = () => {
    setSelectedIds(new Set())
    setResults(null)
  }

  const selectedProducts = products.filter((p) => selectedIds.has(p.id))

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Selectează Produse</h2>

        <input
          type="text"
          placeholder="Caută după nume sau SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {selectedProducts.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {selectedProducts.map((p) => (
              <span
                key={p.id}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"
              >
                {p.name}
                <button
                  onClick={() => toggle(p.id)}
                  className="ml-1 text-blue-400 hover:text-blue-600"
                >
                  ×
                </button>
              </span>
            ))}
            <button
              onClick={clearAll}
              className="text-xs text-gray-500 hover:text-red-500 underline"
            >
              Șterge tot
            </button>
          </div>
        )}

        <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-md">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="w-10 px-3 py-2"></th>
                <th className="text-left px-3 py-2 font-medium text-gray-600">Produs</th>
                <th className="text-left px-3 py-2 font-medium text-gray-600">SKU</th>
                <th className="text-left px-3 py-2 font-medium text-gray-600">Categorie</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => (
                <tr
                  key={p.id}
                  className={`border-t border-gray-100 cursor-pointer hover:bg-gray-50 ${
                    selectedIds.has(p.id) ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => toggle(p.id)}
                >
                  <td className="px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(p.id)}
                      onChange={() => toggle(p.id)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-3 py-2 font-medium">{p.name}</td>
                  <td className="px-3 py-2 text-gray-500">{p.sku}</td>
                  <td className="px-3 py-2 text-gray-500">{p.category || '—'}</td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center text-gray-400">
                    Niciun produs găsit
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {selectedIds.size} produse selectate
          </span>
          <button
            onClick={handleSearch}
            disabled={selectedIds.size === 0 || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Se caută...' : 'Caută Clienți'}
          </button>
        </div>
      </div>

      {results !== null && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">
            Rezultate — {results.length} {results.length === 1 ? 'client' : 'clienți'}
          </h2>

          {results.length === 0 ? (
            <p className="text-gray-500 text-sm">
              Niciun client nu a comandat produsele selectate.
            </p>
          ) : (
            <div className="space-y-4">
              {results.map((r) => (
                <div
                  key={r.client.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <Link
                        href={`/clients/${r.client.id}`}
                        className="text-blue-600 hover:underline font-semibold"
                      >
                        {r.client.companyName}
                      </Link>
                      <div className="text-sm text-gray-500 mt-0.5">
                        {[r.client.contactPerson, r.client.city, r.client.phone]
                          .filter(Boolean)
                          .join(' · ')}
                      </div>
                    </div>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                      {r.totalProducts} / {selectedIds.size} produse
                    </span>
                  </div>

                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-1 font-medium text-gray-500">Produs</th>
                        <th className="text-right py-1 font-medium text-gray-500">Cantitate totală</th>
                        <th className="text-right py-1 font-medium text-gray-500">Valoare totală</th>
                      </tr>
                    </thead>
                    <tbody>
                      {r.products.map((prod) => (
                        <tr key={prod.id} className="border-b border-gray-50">
                          <td className="py-1.5">
                            {prod.name}
                            <span className="text-gray-400 ml-2 text-xs">{prod.sku}</span>
                          </td>
                          <td className="py-1.5 text-right">{prod.totalQty}</td>
                          <td className="py-1.5 text-right">{formatCurrency(prod.totalValue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}

// ── Promo CSV + Email Tab ──────────────────────────────────────────

function PromoEmailGenerator({ agentName }: { agentName: string }) {
  const [priceChanges, setPriceChanges] = useState<PriceChange[]>([])
  const [clientEmails, setClientEmails] = useState<ClientEmail[]>([])
  const [parseError, setParseError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const parseFile = async (file: File): Promise<Record<string, string>[]> => {
    const isExcel = /\.xlsx?$/i.test(file.name)

    if (isExcel) {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]

      // Get all rows as arrays to find the real header row
      // raw: true gives actual numbers from Excel, avoiding locale formatting issues
      const allRows = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, { header: 1, raw: true })

      // Find the row that contains "COD PRODUS" or "SKU" — that's the header
      const headerIdx = allRows.findIndex((row) =>
        row.some((cell) => /cod\s*produs|sku/i.test(String(cell ?? '')))
      )

      if (headerIdx === -1) {
        throw new Error('Nu am găsit rândul cu antetul (COD PRODUS). Verifică fișierul.')
      }

      // Re-parse using that row as header
      const headerRow = allRows[headerIdx].map((h) => String(h ?? '').trim())
      const dataRows: Record<string, string>[] = []

      for (let i = headerIdx + 1; i < allRows.length; i++) {
        const row = allRows[i]
        if (!row || row.every((c) => !c)) continue // skip empty rows
        const obj: Record<string, string> = {}
        for (let j = 0; j < headerRow.length; j++) {
          if (headerRow[j]) obj[headerRow[j]] = String(row[j] ?? '').trim()
        }
        dataRows.push(obj)
      }

      return dataRows
    }

    const text = await file.text()
    const result = parseCsvText(text)
    if (result.errors.length > 0) {
      throw new Error(result.errors[0].message)
    }
    return result.rows as Record<string, string>[]
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setParseError(null)
    setPriceChanges([])
    setClientEmails([])

    let rows: Record<string, string>[]
    try {
      rows = await parseFile(file)
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Eroare la citirea fișierului.')
      return
    }

    if (rows.length === 0) {
      setParseError('Fișierul nu conține date.')
      return
    }

    // Detect column names (flexible matching)
    const firstRow = rows[0]
    const fields = Object.keys(firstRow)

    // Normalize field names for matching (collapse whitespace/newlines)
    const norm = (s: string) => s.replace(/[\s\n\r]+/g, ' ').trim().toLowerCase()
    const skuCol = fields.find((f) => /sku|cod.?produs/i.test(norm(f)))
    const oldPriceCol = fields.find((f) => /old|vechi|anterior|pret.?list|preț.?list/i.test(norm(f)))
    const newPriceCol = fields.find((f) => /new|nou|actual|pret.?promo|preț.?promo/i.test(norm(f)))
    const nameCol = fields.find((f) => /name|nume.?produs/i.test(norm(f)))

    if (!skuCol || !oldPriceCol || !newPriceCol) {
      setParseError(
        `Coloane lipsă. Am găsit: ${fields.join(', ')}. Am nevoie de coloane pentru COD PRODUS, PRET LISTA și PRET PROMO.`
      )
      return
    }

    const changes: PriceChange[] = []
    for (const row of rows) {
      const sku = row[skuCol]?.trim()
      if (!sku) continue

      const parsePrice = (v: string) => {
        // If already a plain number (from raw Excel), just parse it
        const asNum = Number(v)
        if (!isNaN(asNum) && v.trim() !== '') return asNum
        const s = v.trim()
        // Romanian format with thousands dots and decimal comma: "1.025,24"
        if (s.includes('.') && s.includes(',')) {
          return parseFloat(s.replace(/\./g, '').replace(',', '.'))
        }
        // Comma as decimal separator only: "301,82"
        if (s.includes(',')) {
          return parseFloat(s.replace(',', '.'))
        }
        return parseFloat(s)
      }
      const oldPrice = parsePrice(row[oldPriceCol] || '0')
      const newPrice = parsePrice(row[newPriceCol] || '0')
      if (isNaN(oldPrice) || isNaN(newPrice) || oldPrice <= 0) continue

      changes.push({
        sku,
        productName: nameCol ? row[nameCol]?.trim() : undefined,
        oldPrice,
        newPrice,
        discount: ((oldPrice - newPrice) / oldPrice) * 100,
      })
    }

    if (changes.length === 0) {
      setParseError('Nu am putut extrage date valide din fișier.')
      return
    }

    setPriceChanges(changes)
  }

  const handleGenerate = async () => {
    if (priceChanges.length === 0) return
    setLoading(true)

    try {
      const skus = priceChanges.map((p) => p.sku)
      const clients = await getClientsBySkus(skus)

      const priceMap = new Map(priceChanges.map((p) => [p.sku, p]))

      const emails: ClientEmail[] = clients
        .map((client) => {
          const matchedProducts = client.productSkus
            .map((sku) => priceMap.get(sku)!)
            .filter(Boolean)

          if (matchedProducts.length === 0) return null

          return {
            id: client.id,
            companyName: client.companyName,
            contactPerson: client.contactPerson,
            email: client.email,
            products: matchedProducts,
            emailBody: generateEmail(
              client.contactPerson,
              client.companyName,
              matchedProducts,
              agentName
            ),
          }
        })
        .filter((e): e is ClientEmail => e !== null)
        .sort((a, b) => b.products.length - a.products.length)

      setClientEmails(emails)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string, clientId: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(clientId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const copyAllEmails = async () => {
    const allText = clientEmails
      .map((c) => {
        const header = `═══ ${c.companyName} ${c.email ? `<${c.email}>` : '(fără email)'} ═══`
        return `${header}\n\n${c.emailBody}`
      })
      .join('\n\n\n')
    await navigator.clipboard.writeText(allText)
    setCopiedId('all')
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <>
      {/* Upload */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-2">Încarcă Fișier CSV cu Prețuri</h2>
        <p className="text-sm text-gray-500 mb-4">
          Fișierul trebuie să conțină coloane pentru COD PRODUS, PRET LISTA și PRET PROMO.
          Acceptă fișiere CSV și Excel (.xlsx).
        </p>

        <div className="flex items-center gap-4">
          <input
            type="file"
            accept=".csv,.txt,.xlsx,.xls"
            onChange={handleFileUpload}
            className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {parseError && (
          <div className="mt-3 p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {parseError}
          </div>
        )}
      </div>

      {/* Parsed price changes */}
      {priceChanges.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              {priceChanges.length} produse cu modificări de preț
            </h2>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Se generează...' : 'Generează Emailuri'}
            </button>
          </div>

          <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-md">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="text-left px-3 py-2 font-medium text-gray-600">SKU</th>
                  {priceChanges[0]?.productName && (
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Produs</th>
                  )}
                  <th className="text-right px-3 py-2 font-medium text-gray-600">Preț Vechi</th>
                  <th className="text-right px-3 py-2 font-medium text-gray-600">Preț Nou</th>
                  <th className="text-right px-3 py-2 font-medium text-gray-600">Reducere</th>
                </tr>
              </thead>
              <tbody>
                {priceChanges.map((p) => (
                  <tr key={p.sku} className="border-t border-gray-100">
                    <td className="px-3 py-2 font-mono text-xs">{p.sku}</td>
                    {p.productName && <td className="px-3 py-2">{p.productName}</td>}
                    <td className="px-3 py-2 text-right line-through text-gray-400">
                      {formatCurrency(p.oldPrice)}
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-green-600">
                      {formatCurrency(p.newPrice)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">
                        -{Math.round(p.discount)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Generated emails */}
      {clientEmails.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              Emailuri generate — {clientEmails.length} clienți
            </h2>
            <button
              onClick={copyAllEmails}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              {copiedId === 'all' ? 'Copiat!' : 'Copiază tot'}
            </button>
          </div>

          <div className="space-y-4">
            {clientEmails.map((c) => (
              <div
                key={c.id}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <div>
                    <Link
                      href={`/clients/${c.id}`}
                      className="text-blue-600 hover:underline font-semibold"
                    >
                      {c.companyName}
                    </Link>
                    {c.email && (
                      <span className="ml-2 text-sm text-gray-500">{c.email}</span>
                    )}
                    {!c.email && (
                      <span className="ml-2 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                        Fără email
                      </span>
                    )}
                    <span className="ml-2 text-xs text-gray-400">
                      {c.products.length} {c.products.length === 1 ? 'produs' : 'produse'}
                    </span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(c.emailBody, c.id)}
                    className="px-3 py-1 text-xs border border-gray-300 rounded-md hover:bg-white transition-colors"
                  >
                    {copiedId === c.id ? 'Copiat!' : 'Copiază'}
                  </button>
                </div>
                <pre className="px-4 py-3 text-sm whitespace-pre-wrap font-sans text-gray-700 bg-white">
                  {c.emailBody}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}

      {clientEmails.length === 0 && priceChanges.length > 0 && !loading && clientEmails !== null && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center text-gray-500 text-sm">
          Apasă &quot;Generează Emailuri&quot; pentru a găsi clienții care au comandat aceste produse.
        </div>
      )}
    </>
  )
}
