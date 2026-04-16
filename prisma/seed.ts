import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min)
}

async function main() {
  console.log('🌱 Seeding database with real data...')

  const dataDir = path.join(__dirname, '..', 'data')
  const clients: string[] = JSON.parse(fs.readFileSync(path.join(dataDir, 'clients.json'), 'utf-8'))
  const catalog: Array<{ product_sku: string; product_name: string; net_price: number; tva_price: number; brut_price: number }> = JSON.parse(fs.readFileSync(path.join(dataDir, 'price_catalog.json'), 'utf-8'))
  const invoices: Array<{
    invoice_sku: string
    date: string
    client_name: string
    items: Array<{ product_sku: string; product_name: string; quantity: number; net_price: number; tva_price: number; brut_price: number; date: string }>
    totals: { net: number; tva: number; brut: number }
  }> = JSON.parse(fs.readFileSync(path.join(dataDir, 'invoices.json'), 'utf-8'))

  console.log(`📦 Loaded: ${clients.length} clients, ${catalog.length} products, ${invoices.length} invoices`)

  // --- Users ---
  const hashedPassword = await bcrypt.hash('admin123', 10)
  try {
    await prisma.user.createMany({
      data: [
        { email: 'admin@dentex.ro', passwordHash: hashedPassword, name: 'Administrator' },
        { email: 'agent@dentex.ro', passwordHash: hashedPassword, name: 'Agent Vânzări' },
      ],
    })
    console.log('✅ Users created')
  } catch {
    console.log('ℹ️ Users already exist')
  }

  // --- Products ---
  console.log('📦 Seeding products...')
  const BATCH = 500
  for (let i = 0; i < catalog.length; i += BATCH) {
    const batch = catalog.slice(i, i + BATCH)
    await prisma.product.createMany({
      data: batch.map((p) => {
        const acquisitionPct = randomBetween(0.55, 0.65)
        return {
          name: p.product_name,
          sku: p.product_sku,
          unitPrice: p.net_price.toFixed(2),
          tvaPrice: p.tva_price.toFixed(2),
          brutPrice: p.brut_price.toFixed(2),
          acquisitionPrice: (p.net_price * acquisitionPct).toFixed(2),
        }
      }),
    })
  }
  console.log(`✅ ${catalog.length} products seeded`)

  // --- Clients ---
  console.log('👥 Seeding clients...')
  for (let i = 0; i < clients.length; i += BATCH) {
    const batch = clients.slice(i, i + BATCH)
    await prisma.client.createMany({
      data: batch.map((name) => ({
        companyName: name,
      })),
    })
  }
  console.log(`✅ ${clients.length} clients seeded`)

  // --- Build lookup maps ---
  console.log('🔗 Building lookup maps...')
  const allClients = await prisma.client.findMany({ select: { id: true, companyName: true } })
  const clientMap = new Map<string, string>()
  for (const c of allClients) {
    clientMap.set(c.companyName, c.id)
  }

  const allProducts = await prisma.product.findMany({ select: { id: true, sku: true } })
  const productMap = new Map<string, string>()
  for (const p of allProducts) {
    productMap.set(p.sku, p.id)
  }

  // --- Orders & OrderItems ---
  console.log('📋 Seeding invoices as orders...')
  const ORDER_BATCH = 200
  let orderCount = 0
  let itemCount = 0
  let skipped = 0

  for (let i = 0; i < invoices.length; i += ORDER_BATCH) {
    const batch = invoices.slice(i, i + ORDER_BATCH)

    for (const inv of batch) {
      const clientId = clientMap.get(inv.client_name)
      if (!clientId) {
        skipped++
        continue
      }

      const order = await prisma.order.create({
        data: {
          invoiceSku: inv.invoice_sku,
          clientId,
          orderDate: new Date(inv.date),
          totalAmount: inv.totals.brut.toFixed(2),
          status: 'DELIVERED',
          paidAmount: inv.totals.brut.toFixed(2),
          isPaid: true,
        },
      })

      const orderItems = inv.items
        .filter((item) => productMap.has(item.product_sku))
        .map((item) => ({
          orderId: order.id,
          productId: productMap.get(item.product_sku)!,
          quantity: item.quantity,
          unitPrice: item.net_price.toFixed(2),
          discount: '0',
          totalPrice: item.brut_price.toFixed(2),
        }))

      if (orderItems.length > 0) {
        await prisma.orderItem.createMany({ data: orderItems })
        itemCount += orderItems.length
      }

      orderCount++
    }

    if ((i + ORDER_BATCH) % 5000 === 0 || i + ORDER_BATCH >= invoices.length) {
      console.log(`  ... ${Math.min(i + ORDER_BATCH, invoices.length)}/${invoices.length} invoices processed`)
    }
  }

  console.log(`✅ ${orderCount} orders, ${itemCount} items seeded (${skipped} skipped)`)
  console.log('🎉 Seeding complete!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
