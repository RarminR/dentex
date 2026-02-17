import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const PRODUCTS = [
  { name: 'Compozit Nanohybrid Premium', sku: 'MCP-001', category: 'Materiale Compozite', unitPrice: '285.00', costPrice: '168.00', stockQty: 150 },
  { name: 'Compozit Flowable Universal', sku: 'MCP-002', category: 'Materiale Compozite', unitPrice: '195.00', costPrice: '115.00', stockQty: 200 },
  { name: 'Adeziv Universal Bond', sku: 'MCP-003', category: 'Materiale Compozite', unitPrice: '245.00', costPrice: '145.00', stockQty: 80 },
  { name: 'Compozit Bulkfill', sku: 'MCP-004', category: 'Materiale Compozite', unitPrice: '320.00', costPrice: '190.00', stockQty: 60 },
  { name: 'Set Instrumente Endodontice ProTaper', sku: 'INS-001', category: 'Instrumente', unitPrice: '485.00', costPrice: '290.00', stockQty: 45 },
  { name: 'Freze Diamantate Set Standard', sku: 'INS-002', category: 'Instrumente', unitPrice: '165.00', costPrice: '95.00', stockQty: 120 },
  { name: 'Spatulă Plastică Set', sku: 'INS-003', category: 'Instrumente', unitPrice: '85.00', costPrice: '48.00', stockQty: 200 },
  { name: 'Oglindă Dentară Set 5buc', sku: 'INS-004', category: 'Instrumente', unitPrice: '95.00', costPrice: '55.00', stockQty: 180 },
  { name: 'Sondă Parodontală', sku: 'INS-005', category: 'Instrumente', unitPrice: '125.00', costPrice: '72.00', stockQty: 90 },
  { name: 'Mănuși Nitril M (100 buc)', sku: 'CON-001', category: 'Consumabile', unitPrice: '45.00', costPrice: '28.00', stockQty: 500 },
  { name: 'Mănuși Nitril L (100 buc)', sku: 'CON-002', category: 'Consumabile', unitPrice: '45.00', costPrice: '28.00', stockQty: 400 },
  { name: 'Ace Endodontice K-File Set', sku: 'CON-003', category: 'Consumabile', unitPrice: '75.00', costPrice: '43.00', stockQty: 300 },
  { name: 'Turbine Dentare Burete', sku: 'CON-004', category: 'Consumabile', unitPrice: '35.00', costPrice: '20.00', stockQty: 250 },
  { name: 'Soluție Dezinfectant Suprafețe', sku: 'CON-005', category: 'Consumabile', unitPrice: '65.00', costPrice: '38.00', stockQty: 200 },
  { name: 'Folie Protecție', sku: 'CON-006', category: 'Consumabile', unitPrice: '25.00', costPrice: '14.00', stockQty: 800 },
  { name: 'Implant Titan Standard 3.75x10', sku: 'IMP-001', category: 'Implanturi', unitPrice: '850.00', costPrice: '510.00', stockQty: 30 },
  { name: 'Implant Titan Wide 4.75x10', sku: 'IMP-002', category: 'Implanturi', unitPrice: '920.00', costPrice: '552.00', stockQty: 20 },
  { name: 'Bont Implant Universal', sku: 'IMP-003', category: 'Implanturi', unitPrice: '350.00', costPrice: '210.00', stockQty: 40 },
  { name: 'Kit Amprentă Silicon', sku: 'IMP-004', category: 'Implanturi', unitPrice: '185.00', costPrice: '110.00', stockQty: 25 },
  { name: 'Membrană Resorbabilă', sku: 'IMP-005', category: 'Implanturi', unitPrice: '425.00', costPrice: '255.00', stockQty: 15 },
]

const CLIENTS = [
  { companyName: 'Clinica Dr. Popescu', contactPerson: 'Dr. Ion Popescu', email: 'popescu@clinica.ro', city: 'București', discountPercent: '15', creditLimit: '50000', paymentTermsDays: 30 },
  { companyName: 'Cabinet Stomatologic Ionescu', contactPerson: 'Dr. Maria Ionescu', email: 'ionescu@cabinet.ro', city: 'Cluj-Napoca', discountPercent: '10', creditLimit: '30000', paymentTermsDays: 60 },
  { companyName: 'Dent Pro SRL', contactPerson: 'Dr. Alexandru Dumitrescu', email: 'alex@dentpro.ro', city: 'Timișoara', discountPercent: '20', creditLimit: '80000', paymentTermsDays: 30 },
  { companyName: 'Zâmbet Sănătos Clinic', contactPerson: 'Dr. Elena Gheorghe', email: 'elena@zambet.ro', city: 'Iași', discountPercent: '5', creditLimit: '20000', paymentTermsDays: 90 },
  { companyName: 'Stomatologie Modernă', contactPerson: 'Dr. Cristian Marin', email: 'cristian@stomoderna.ro', city: 'Constanța', discountPercent: '12', creditLimit: '45000', paymentTermsDays: 45 },
  { companyName: 'Cabinet Dr. Radu', contactPerson: 'Dr. Bogdan Radu', email: 'bogdan@cabinetdr.ro', city: 'București', discountPercent: '8', creditLimit: '25000', paymentTermsDays: 30 },
]

async function main() {
  console.log('🌱 Seeding database...')

  const hashedPassword = await bcrypt.hash('admin123', 10)
  try {
    await prisma.user.createMany({
      data: [
        { email: 'admin@dentex.ro', passwordHash: hashedPassword, name: 'Administrator' },
        { email: 'agent@dentex.ro', passwordHash: hashedPassword, name: 'Agent Vânzári' },
      ],
    })
    console.log('✅ Users created')
  } catch (e) {
    console.log('ℹ️ Users already exist')
  }

  try {
    await prisma.product.createMany({
      data: PRODUCTS.map((p: any) => ({
        ...p,
        unitPrice: p.unitPrice,
        costPrice: p.costPrice,
      })),
    })
    console.log('✅ Products created')
  } catch (e) {
    console.log('ℹ️ Products already exist')
  }

  try {
    await prisma.client.createMany({
      data: CLIENTS.map((c: any) => ({
        ...c,
        discountPercent: c.discountPercent,
        creditLimit: c.creditLimit,
      })),
    })
    console.log('✅ Clients created')
  } catch (e) {
    console.log('ℹ️ Clients already exist')
  }

  const clients = await prisma.client.findMany()
  const products = await prisma.product.findMany()

  const orderDates = [
    new Date('2025-01-15'), new Date('2025-02-10'), new Date('2025-03-20'),
    new Date('2025-04-05'), new Date('2025-05-12'), new Date('2025-06-18'),
    new Date('2025-07-22'), new Date('2025-08-08'), new Date('2025-09-14'),
    new Date('2025-10-30'), new Date('2025-11-17'), new Date('2025-12-03'),
    new Date('2026-01-08'), new Date('2026-01-25'), new Date('2026-02-10'),
  ]

  for (let i = 0; i < 25; i++) {
    const client = clients[i % clients.length]
    const discount = Number(client.discountPercent)
    const orderDate = orderDates[i % orderDates.length]
    
    const numItems = 2 + (i % 3)
    const orderProducts = products.slice((i * 2) % products.length, (i * 2) % products.length + numItems)
    
    let totalAmount = 0
    const items = orderProducts.map((p: any) => {
      const qty = 1 + (i % 5)
      const unitPrice = Number(p.unitPrice)
      const effectivePrice = unitPrice * (1 - discount / 100)
      const total = effectivePrice * qty
      totalAmount += total
      return {
        productId: p.id,
        quantity: qty,
        unitPrice: unitPrice.toFixed(2),
        discount: discount.toFixed(2),
        totalPrice: total.toFixed(2),
      }
    })

    const isPaid = i % 3 !== 0
    const paidAmount = isPaid ? totalAmount : totalAmount * 0.5

    const order = await prisma.order.create({
      data: {
        clientId: client.id,
        orderDate,
        totalAmount: totalAmount.toFixed(2),
        status: i % 4 === 0 ? 'PENDING' : i % 4 === 1 ? 'DELIVERED' : i % 4 === 2 ? 'DELIVERED' : 'CANCELLED',
        paidAmount: paidAmount.toFixed(2),
        isPaid,
      },
    })

    await prisma.orderItem.createMany({
      data: items.map((item: any) => ({ ...item, orderId: order.id })),
    })
  }
  console.log('✅ Orders created')
  console.log('🎉 Seeding complete!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
