'use server'

import { prisma } from '@/lib/prisma'
import { serialize } from '@/lib/utils/decimal'

export async function getProductsForLookup() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { id: true, name: true, sku: true, category: true },
    orderBy: { name: 'asc' },
  })
  return products
}

export async function getClientsByProducts(productIds: string[]) {
  if (productIds.length === 0) return []

  const orderItems = await prisma.orderItem.findMany({
    where: { productId: { in: productIds } },
    include: {
      product: { select: { id: true, name: true, sku: true } },
      order: {
        include: {
          client: {
            select: {
              id: true,
              companyName: true,
              contactPerson: true,
              city: true,
              phone: true,
            },
          },
        },
      },
    },
  })

  // Group by client, then collect products per client
  const clientMap = new Map<
    string,
    {
      client: {
        id: string
        companyName: string
        contactPerson: string | null
        city: string | null
        phone: string | null
      }
      products: Map<
        string,
        { id: string; name: string; sku: string; totalQty: number; totalValue: number }
      >
    }
  >()

  for (const item of orderItems) {
    const client = item.order.client
    if (!clientMap.has(client.id)) {
      clientMap.set(client.id, { client, products: new Map() })
    }

    const entry = clientMap.get(client.id)!
    const productId = item.product.id
    if (!entry.products.has(productId)) {
      entry.products.set(productId, {
        id: item.product.id,
        name: item.product.name,
        sku: item.product.sku,
        totalQty: 0,
        totalValue: 0,
      })
    }

    const prod = entry.products.get(productId)!
    prod.totalQty += item.quantity
    prod.totalValue += Number(item.totalPrice)
  }

  const results = Array.from(clientMap.values()).map((entry) => ({
    client: entry.client,
    products: Array.from(entry.products.values()),
    totalProducts: entry.products.size,
  }))

  // Sort by number of matching products desc, then by company name
  results.sort((a, b) => b.totalProducts - a.totalProducts || a.client.companyName.localeCompare(b.client.companyName))

  return serialize(results)
}

export async function getClientsBySkus(skus: string[]) {
  if (skus.length === 0) return []

  // Find products by SKU
  const products = await prisma.product.findMany({
    where: { sku: { in: skus } },
    select: { id: true, name: true, sku: true },
  })

  if (products.length === 0) return []

  const productIds = products.map((p) => p.id)
  const skuToProduct = new Map(products.map((p) => [p.sku, p]))

  const orderItems = await prisma.orderItem.findMany({
    where: { productId: { in: productIds } },
    select: {
      productId: true,
      quantity: true,
      order: {
        select: {
          client: {
            select: {
              id: true,
              companyName: true,
              contactPerson: true,
              email: true,
            },
          },
        },
      },
    },
  })

  // Group by client → products they ordered
  const clientMap = new Map<
    string,
    {
      id: string
      companyName: string
      contactPerson: string | null
      email: string | null
      productSkus: Set<string>
    }
  >()

  const productIdToSku = new Map(products.map((p) => [p.id, p.sku]))

  for (const item of orderItems) {
    const client = item.order.client
    if (!clientMap.has(client.id)) {
      clientMap.set(client.id, {
        ...client,
        productSkus: new Set(),
      })
    }
    const sku = productIdToSku.get(item.productId)
    if (sku) clientMap.get(client.id)!.productSkus.add(sku)
  }

  return Array.from(clientMap.values()).map((c) => ({
    id: c.id,
    companyName: c.companyName,
    contactPerson: c.contactPerson,
    email: c.email,
    productSkus: Array.from(c.productSkus),
  }))
}
