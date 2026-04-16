'use client'

import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { formatCurrency, formatPercent } from '@/lib/utils/format'
import { RO } from '@/lib/constants/ro'

export interface OrderItemDraft {
  productId: string
  productName: string
  unitPrice: string
  quantity: number
  effectivePrice: string
  totalPrice: string
}

interface Product {
  id: string
  name: string
  sku: string
  category: string | null
  unitPrice: { toString(): string }
}

interface OrderProductSelectorProps {
  products: Product[]
  discountPercent: string
  items: OrderItemDraft[]
  onItemsChange: (items: OrderItemDraft[]) => void
}

function calculateEffectivePrice(unitPrice: string, discountPercent: string): string {
  const price = parseFloat(unitPrice)
  const discount = parseFloat(discountPercent)
  return (price * (1 - discount / 100)).toFixed(2)
}

function calculateTotalPrice(effectivePrice: string, quantity: number): string {
  return (parseFloat(effectivePrice) * quantity).toFixed(2)
}

export function OrderProductSelector({
  products,
  discountPercent,
  items,
  onItemsChange,
}: OrderProductSelectorProps) {
  const [search, setSearch] = useState('')
  const [quantities, setQuantities] = useState<Record<string, number>>({})

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products
    const q = search.toLowerCase()
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    )
  }, [products, search])

  const addedIds = useMemo(() => new Set(items.map((i) => i.productId)), [items])

  const handleAdd = (product: Product) => {
    const qty = quantities[product.id] || 1
    const unitPrice = product.unitPrice.toString()
    const effectivePrice = calculateEffectivePrice(unitPrice, discountPercent)
    const totalPrice = calculateTotalPrice(effectivePrice, qty)

    onItemsChange([
      ...items,
      {
        productId: product.id,
        productName: product.name,
        unitPrice,
        quantity: qty,
        effectivePrice,
        totalPrice,
      },
    ])
    setQuantities((prev) => {
      const next = { ...prev }
      delete next[product.id]
      return next
    })
  }

  const handleRemove = (productId: string) => {
    onItemsChange(items.filter((i) => i.productId !== productId))
  }

  const handleQuantityChange = (productId: string, qty: number) => {
    const updated = items.map((item) => {
      if (item.productId !== productId) return item
      const effectivePrice = calculateEffectivePrice(item.unitPrice, discountPercent)
      const totalPrice = calculateTotalPrice(effectivePrice, qty)
      return { ...item, quantity: qty, effectivePrice, totalPrice }
    })
    onItemsChange(updated)
  }

  return (
    <div className="space-y-6">
      {items.length > 0 && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{RO.orders.product}</TableHead>
                <TableHead className="text-right">{RO.orders.unitPrice}</TableHead>
                <TableHead className="text-right">Pre\u021B client</TableHead>
                <TableHead className="w-28 text-center">{RO.orders.quantity}</TableHead>
                <TableHead className="text-right">{RO.orders.rowTotal}</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.productId}>
                  <TableCell className="font-medium">{item.productName}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatCurrency(item.unitPrice)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-emerald-700 font-medium">
                      {formatCurrency(item.effectivePrice)}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">
                      (-{formatPercent(discountPercent)})
                    </span>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) =>
                        handleQuantityChange(item.productId, Math.max(1, parseInt(e.target.value) || 1))
                      }
                      className="w-20 text-center mx-auto"
                    />
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(item.totalPrice)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleRemove(item.productId)}
                      className="text-red-500 hover:text-red-700"
                    >
                      &times;
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="space-y-3">
        <Input
          placeholder={`${RO.common.search} produse...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="max-h-64 overflow-y-auto rounded-md border divide-y">
          {filteredProducts.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground text-center">
              {RO.common.noData}
            </p>
          )}
          {filteredProducts.map((product) => {
            const isAdded = addedIds.has(product.id)
            const unitPrice = product.unitPrice.toString()
            const effectivePrice = calculateEffectivePrice(unitPrice, discountPercent)

            return (
              <div
                key={product.id}
                className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {product.sku} &middot; {product.category}
                  </p>
                  <p className="text-xs mt-0.5">
                    <span className="text-muted-foreground line-through mr-2">
                      {formatCurrency(unitPrice)}
                    </span>
                    <span className="text-emerald-700 font-medium">
                      {formatCurrency(effectivePrice)}
                    </span>
                    <span className="text-muted-foreground ml-1">
                      (dup\u0103 {formatPercent(discountPercent)} discount)
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {!isAdded && (
                    <>
                      <Input
                        type="number"
                        min={1}
                        value={quantities[product.id] || 1}
                        onChange={(e) =>
                          setQuantities((prev) => ({
                            ...prev,
                            [product.id]: Math.max(1, parseInt(e.target.value) || 1),
                          }))
                        }
                        className="w-16 text-center"
                      />
                      <Button size="sm" onClick={() => handleAdd(product)}>
                        {RO.common.add}
                      </Button>
                    </>
                  )}
                  {isAdded && (
                    <span className="text-xs text-emerald-600 font-medium">Ad\u0103ugat</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
