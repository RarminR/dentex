'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatCard } from '@/components/ui/StatCard'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { RO } from '@/lib/constants/ro'
import { formatCurrency, formatPercent } from '@/lib/utils/format'
import { deactivateProduct } from '@/lib/actions/products'
import type { Product } from '@prisma/client'

interface ProductDetailClientProps {
  product: Product
}

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const router = useRouter()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const unitPrice = Number(product.unitPrice.toString())
  const acquisitionPrice = Number(product.acquisitionPrice.toString())
  const margin = unitPrice > 0 ? ((unitPrice - acquisitionPrice) / unitPrice) * 100 : 0

  async function handleDeactivate() {
    setLoading(true)
    await deactivateProduct(product.id)
    setConfirmOpen(false)
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-gray-900">{product.name}</h2>
          <Badge variant={product.isActive ? 'default' : 'secondary'}>
            {product.isActive ? RO.common.active : RO.common.inactive}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Link href={`/products/${product.id}/edit`}>
            <Button variant="outline">{RO.common.edit}</Button>
          </Link>
          {product.isActive && (
            <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
              {RO.common.deactivate}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label={RO.products.sellPrice} value={formatCurrency(unitPrice)} />
        <StatCard label={RO.products.costPrice} value={formatCurrency(acquisitionPrice)} />
        <StatCard
          label={RO.products.margin}
          value={formatPercent(margin)}
          trend={{ value: margin >= 30 ? 1 : -1, label: margin >= 30 ? 'bună' : 'mică' }}
        />
        <StatCard label={RO.products.stock} value={String(product.stockQty)} icon={product.stockQty <= 10 ? '⚠️' : '📦'} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalii Produs</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-500 font-medium">{RO.products.sku}</dt>
              <dd className="font-mono mt-1">{product.sku}</dd>
            </div>
            <div>
              <dt className="text-gray-500 font-medium">{RO.products.category}</dt>
              <dd className="mt-1">{product.category ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-500 font-medium">Rol Ofertă</dt>
              <dd className="mt-1">
                <Badge
                  variant="outline"
                  className={
                    product.role === 'ANCHOR'
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                      : 'border-orange-300 bg-orange-50 text-orange-700'
                  }
                >
                  {product.role === 'ANCHOR' ? 'Ancoră' : 'Upsell'}
                </Badge>
              </dd>
            </div>
            {product.description && (
              <div className="md:col-span-2">
                <dt className="text-gray-500 font-medium">{RO.products.description}</dt>
                <dd className="mt-1">{product.description}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Link href="/products">
          <Button variant="outline">{RO.common.back}</Button>
        </Link>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`${RO.common.deactivate} ${product.name}?`}
        description="Produsul va fi marcat ca inactiv și nu va mai apărea în oferte."
        onConfirm={handleDeactivate}
        loading={loading}
      />
    </div>
  )
}
