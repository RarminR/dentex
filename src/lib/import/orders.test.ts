import { describe, it, expect } from 'vitest'

import { parseOrderRows, groupOrderRows, matchClients, matchProducts, ORDER_CSV_COLUMNS } from './orders'

describe('ORDER_CSV_COLUMNS', () => {
  it('defines expected CSV column names', () => {
    expect(ORDER_CSV_COLUMNS).toEqual([
      'Client',
      'Dată Comandă',
      'Produs SKU',
      'Cantitate',
      'Preț Unitar',
      'Status',
      'Plătit',
    ])
  })
})

describe('parseOrderRows', () => {
  it('parses valid CSV row data', () => {
    const rows = [
      {
        Client: 'Clinica Test',
        'Dată Comandă': '2026-01-15',
        'Produs SKU': 'SKU-001',
        Cantitate: '5',
        'Preț Unitar': '150.50',
        Status: 'PENDING',
        Plătit: '0',
      },
    ]

    const result = parseOrderRows(rows)

    expect(result.errors).toHaveLength(0)
    expect(result.valid).toHaveLength(1)
    expect(result.valid[0]).toEqual({
      client: 'Clinica Test',
      orderDate: '2026-01-15',
      productSku: 'SKU-001',
      quantity: 5,
      unitPrice: '150.50',
      status: 'PENDING',
      paidAmount: '0',
    })
  })

  it('maps Romanian status strings', () => {
    const rows = [
      {
        Client: 'Clinica A',
        'Dată Comandă': '2026-01-15',
        'Produs SKU': 'SKU-001',
        Cantitate: '3',
        'Preț Unitar': '100',
        Status: 'În așteptare',
        Plătit: '0',
      },
      {
        Client: 'Clinica B',
        'Dată Comandă': '2026-01-15',
        'Produs SKU': 'SKU-002',
        Cantitate: '2',
        'Preț Unitar': '200',
        Status: 'Livrată',
        Plătit: '400',
      },
      {
        Client: 'Clinica C',
        'Dată Comandă': '2026-01-15',
        'Produs SKU': 'SKU-003',
        Cantitate: '1',
        'Preț Unitar': '50',
        Status: 'Anulată',
        Plătit: '0',
      },
    ]

    const result = parseOrderRows(rows)

    expect(result.valid[0].status).toBe('PENDING')
    expect(result.valid[1].status).toBe('DELIVERED')
    expect(result.valid[2].status).toBe('CANCELLED')
  })

  it('rejects rows with missing required fields', () => {
    const rows = [
      {
        Client: '',
        'Dată Comandă': '2026-01-15',
        'Produs SKU': 'SKU-001',
        Cantitate: '5',
        'Preț Unitar': '100',
        Status: 'PENDING',
        Plătit: '0',
      },
    ]

    const result = parseOrderRows(rows)

    expect(result.valid).toHaveLength(0)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors[0].field).toBe('Client')
  })

  it('rejects rows with invalid quantity', () => {
    const rows = [
      {
        Client: 'Clinica Test',
        'Dată Comandă': '2026-01-15',
        'Produs SKU': 'SKU-001',
        Cantitate: '-1',
        'Preț Unitar': '100',
        Status: 'PENDING',
        Plătit: '0',
      },
    ]

    const result = parseOrderRows(rows)

    expect(result.valid).toHaveLength(0)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('rejects rows with invalid status', () => {
    const rows = [
      {
        Client: 'Clinica Test',
        'Dată Comandă': '2026-01-15',
        'Produs SKU': 'SKU-001',
        Cantitate: '5',
        'Preț Unitar': '100',
        Status: 'INVALID_STATUS',
        Plătit: '0',
      },
    ]

    const result = parseOrderRows(rows)

    expect(result.valid).toHaveLength(0)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors[0].field).toBe('Status')
  })
})

describe('matchClients', () => {
  const clients = [
    { id: 'c1', companyName: 'Clinica Dentară SRL' },
    { id: 'c2', companyName: 'Dental Pro' },
    { id: 'c3', companyName: 'Cabinet Dr. Ionescu' },
  ]

  it('matches client by exact name', () => {
    const result = matchClients(['Clinica Dentară SRL'], clients)

    expect(result.matched.get('Clinica Dentară SRL')).toBe('c1')
    expect(result.errors).toHaveLength(0)
  })

  it('matches client case-insensitively', () => {
    const result = matchClients(['clinica dentară srl'], clients)

    expect(result.matched.get('clinica dentară srl')).toBe('c1')
    expect(result.errors).toHaveLength(0)
  })

  it('matches client with extra whitespace', () => {
    const result = matchClients(['  Dental Pro  '], clients)

    expect(result.matched.get('  Dental Pro  ')).toBe('c2')
    expect(result.errors).toHaveLength(0)
  })

  it('returns error for unmatched client', () => {
    const result = matchClients(['Clinica Inexistentă'], clients)

    expect(result.matched.size).toBe(0)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].message).toContain('Clinica Inexistentă')
  })

  it('handles multiple clients with mixed matches', () => {
    const result = matchClients(['Dental Pro', 'Unknown Clinic', 'Cabinet Dr. Ionescu'], clients)

    expect(result.matched.size).toBe(2)
    expect(result.matched.get('Dental Pro')).toBe('c2')
    expect(result.matched.get('Cabinet Dr. Ionescu')).toBe('c3')
    expect(result.errors).toHaveLength(1)
  })

  it('deduplicates client names', () => {
    const result = matchClients(['Dental Pro', 'Dental Pro'], clients)

    expect(result.matched.size).toBe(1)
    expect(result.errors).toHaveLength(0)
  })
})

describe('matchProducts', () => {
  const products = [
    { id: 'p1', sku: 'SKU-001' },
    { id: 'p2', sku: 'SKU-002' },
    { id: 'p3', sku: 'IMPL-100' },
  ]

  it('matches product by exact SKU', () => {
    const result = matchProducts(['SKU-001'], products)

    expect(result.matched.get('SKU-001')).toBe('p1')
    expect(result.errors).toHaveLength(0)
  })

  it('returns error for unmatched SKU', () => {
    const result = matchProducts(['UNKNOWN-SKU'], products)

    expect(result.matched.size).toBe(0)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].message).toContain('UNKNOWN-SKU')
  })

  it('handles multiple SKUs with mixed matches', () => {
    const result = matchProducts(['SKU-001', 'BAD-SKU', 'IMPL-100'], products)

    expect(result.matched.size).toBe(2)
    expect(result.errors).toHaveLength(1)
  })

  it('deduplicates SKUs', () => {
    const result = matchProducts(['SKU-001', 'SKU-001'], products)

    expect(result.matched.size).toBe(1)
    expect(result.errors).toHaveLength(0)
  })
})

describe('groupOrderRows', () => {
  it('groups rows with same client + date into one order', () => {
    const rows = [
      {
        client: 'Clinica Test',
        orderDate: '2026-01-15',
        productSku: 'SKU-001',
        quantity: 5,
        unitPrice: '150.50',
        status: 'PENDING',
        paidAmount: '0',
      },
      {
        client: 'Clinica Test',
        orderDate: '2026-01-15',
        productSku: 'SKU-002',
        quantity: 3,
        unitPrice: '200.00',
        status: 'PENDING',
        paidAmount: '0',
      },
    ]

    const clientMap = new Map([['Clinica Test', 'c1']])
    const productMap = new Map([
      ['SKU-001', 'p1'],
      ['SKU-002', 'p2'],
    ])

    const result = groupOrderRows(rows, clientMap, productMap)

    expect(result.orders).toHaveLength(1)
    expect(result.orders[0].clientId).toBe('c1')
    expect(result.orders[0].items).toHaveLength(2)
    expect(result.orders[0].items[0].productId).toBe('p1')
    expect(result.orders[0].items[0].quantity).toBe(5)
    expect(result.orders[0].items[0].unitPrice).toBe('150.50')
    expect(result.orders[0].items[1].productId).toBe('p2')
    expect(result.errors).toHaveLength(0)
  })

  it('separates orders with different dates', () => {
    const rows = [
      {
        client: 'Clinica Test',
        orderDate: '2026-01-15',
        productSku: 'SKU-001',
        quantity: 5,
        unitPrice: '100',
        status: 'PENDING',
        paidAmount: '0',
      },
      {
        client: 'Clinica Test',
        orderDate: '2026-01-16',
        productSku: 'SKU-001',
        quantity: 3,
        unitPrice: '100',
        status: 'DELIVERED',
        paidAmount: '300',
      },
    ]

    const clientMap = new Map([['Clinica Test', 'c1']])
    const productMap = new Map([['SKU-001', 'p1']])

    const result = groupOrderRows(rows, clientMap, productMap)

    expect(result.orders).toHaveLength(2)
    expect(result.orders[0].status).toBe('PENDING')
    expect(result.orders[1].status).toBe('DELIVERED')
  })

  it('separates orders with different clients', () => {
    const rows = [
      {
        client: 'Clinica A',
        orderDate: '2026-01-15',
        productSku: 'SKU-001',
        quantity: 5,
        unitPrice: '100',
        status: 'PENDING',
        paidAmount: '0',
      },
      {
        client: 'Clinica B',
        orderDate: '2026-01-15',
        productSku: 'SKU-001',
        quantity: 3,
        unitPrice: '100',
        status: 'PENDING',
        paidAmount: '0',
      },
    ]

    const clientMap = new Map([
      ['Clinica A', 'c1'],
      ['Clinica B', 'c2'],
    ])
    const productMap = new Map([['SKU-001', 'p1']])

    const result = groupOrderRows(rows, clientMap, productMap)

    expect(result.orders).toHaveLength(2)
    expect(result.orders[0].clientId).toBe('c1')
    expect(result.orders[1].clientId).toBe('c2')
  })

  it('computes totalAmount from items', () => {
    const rows = [
      {
        client: 'Clinica Test',
        orderDate: '2026-01-15',
        productSku: 'SKU-001',
        quantity: 2,
        unitPrice: '100.00',
        status: 'PENDING',
        paidAmount: '0',
      },
      {
        client: 'Clinica Test',
        orderDate: '2026-01-15',
        productSku: 'SKU-002',
        quantity: 3,
        unitPrice: '50.00',
        status: 'PENDING',
        paidAmount: '0',
      },
    ]

    const clientMap = new Map([['Clinica Test', 'c1']])
    const productMap = new Map([
      ['SKU-001', 'p1'],
      ['SKU-002', 'p2'],
    ])

    const result = groupOrderRows(rows, clientMap, productMap)

    // 2 * 100 + 3 * 50 = 350
    expect(result.orders[0].totalAmount).toBe('350')
  })

  it('skips rows with unmatched client and logs error', () => {
    const rows = [
      {
        client: 'Unknown Clinic',
        orderDate: '2026-01-15',
        productSku: 'SKU-001',
        quantity: 5,
        unitPrice: '100',
        status: 'PENDING',
        paidAmount: '0',
      },
    ]

    const clientMap = new Map<string, string>()
    const productMap = new Map([['SKU-001', 'p1']])

    const result = groupOrderRows(rows, clientMap, productMap)

    expect(result.orders).toHaveLength(0)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].message).toContain('Unknown Clinic')
  })

  it('skips rows with unmatched product and logs error', () => {
    const rows = [
      {
        client: 'Clinica Test',
        orderDate: '2026-01-15',
        productSku: 'BAD-SKU',
        quantity: 5,
        unitPrice: '100',
        status: 'PENDING',
        paidAmount: '0',
      },
    ]

    const clientMap = new Map([['Clinica Test', 'c1']])
    const productMap = new Map<string, string>()

    const result = groupOrderRows(rows, clientMap, productMap)

    expect(result.orders).toHaveLength(0)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].message).toContain('BAD-SKU')
  })

  it('uses paidAmount and isPaid from CSV data', () => {
    const rows = [
      {
        client: 'Clinica Test',
        orderDate: '2026-01-15',
        productSku: 'SKU-001',
        quantity: 2,
        unitPrice: '100',
        status: 'DELIVERED',
        paidAmount: '200',
      },
    ]

    const clientMap = new Map([['Clinica Test', 'c1']])
    const productMap = new Map([['SKU-001', 'p1']])

    const result = groupOrderRows(rows, clientMap, productMap)

    expect(result.orders[0].paidAmount).toBe('200')
    expect(result.orders[0].isPaid).toBe(true)
  })

  it('sums paidAmount across rows in same order group', () => {
    const rows = [
      {
        client: 'Clinica Test',
        orderDate: '2026-01-15',
        productSku: 'SKU-001',
        quantity: 1,
        unitPrice: '100',
        status: 'DELIVERED',
        paidAmount: '100',
      },
      {
        client: 'Clinica Test',
        orderDate: '2026-01-15',
        productSku: 'SKU-002',
        quantity: 1,
        unitPrice: '200',
        status: 'DELIVERED',
        paidAmount: '200',
      },
    ]

    const clientMap = new Map([['Clinica Test', 'c1']])
    const productMap = new Map([
      ['SKU-001', 'p1'],
      ['SKU-002', 'p2'],
    ])

    const result = groupOrderRows(rows, clientMap, productMap)

    expect(result.orders[0].paidAmount).toBe('300')
    expect(result.orders[0].isPaid).toBe(true)
  })
})
