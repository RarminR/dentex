'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FormField } from '@/components/ui/FormField'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RO } from '@/lib/constants/ro'
import { createProduct, updateProduct } from '@/lib/actions/products'
import type { ProductCreateInput } from '@/lib/validations/product'

interface ProductFormProps {
  product?: {
    id: string
    name: string
    sku: string
    category: string
    description: string | null
    unitPrice: string
    costPrice: string
    stockQty: number
  }
}

export function ProductForm({ product }: ProductFormProps) {
  const router = useRouter()
  const isEditing = !!product

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    const formData = new FormData(e.currentTarget)
    const input: ProductCreateInput = {
      name: formData.get('name') as string,
      sku: formData.get('sku') as string,
      category: formData.get('category') as ProductCreateInput['category'],
      description: (formData.get('description') as string) || null,
      unitPrice: formData.get('unitPrice') as string,
      costPrice: formData.get('costPrice') as string,
      stockQty: Number(formData.get('stockQty')),
    }

    const result = isEditing
      ? await updateProduct(product.id, input)
      : await createProduct(input)

    if (result.success) {
      router.push(isEditing ? `/products/${product.id}` : '/products')
      router.refresh()
    } else {
      setErrors(result.errors ?? {})
    }

    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? RO.common.edit : RO.products.add}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label={RO.products.name} error={errors.name} required>
              <Input name="name" defaultValue={product?.name ?? ''} />
            </FormField>

            <FormField label={RO.products.sku} error={errors.sku} required>
              <Input name="sku" defaultValue={product?.sku ?? ''} />
            </FormField>

            <FormField label={RO.products.category} error={errors.category} required>
              <Select name="category" defaultValue={product?.category ?? ''}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={RO.products.category} />
                </SelectTrigger>
                <SelectContent>
                  {RO.products.categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label={RO.products.stock} error={errors.stockQty} required>
              <Input name="stockQty" type="number" min={0} step={1} defaultValue={product?.stockQty ?? 0} />
            </FormField>

            <FormField label={RO.products.sellPrice} error={errors.unitPrice} required>
              <Input name="unitPrice" type="number" min={0} step="0.01" defaultValue={product?.unitPrice ?? ''} />
            </FormField>

            <FormField label={RO.products.costPrice} error={errors.costPrice} required>
              <Input name="costPrice" type="number" min={0} step="0.01" defaultValue={product?.costPrice ?? ''} />
            </FormField>
          </div>

          <FormField label={RO.products.description} error={errors.description}>
            <Textarea name="description" rows={3} defaultValue={product?.description ?? ''} />
          </FormField>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? RO.common.loading : RO.common.save}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              {RO.common.cancel}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
