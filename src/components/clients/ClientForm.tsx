'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { FormField } from '@/components/ui/FormField'
import { RO } from '@/lib/constants/ro'
import { createClient, updateClient } from '@/lib/actions/clients'
import type { ClientCreateInput } from '@/lib/validations/client'

interface ClientFormProps {
  initialData?: ClientCreateInput & { id: string }
}

export function ClientForm({ initialData }: ClientFormProps) {
  const router = useRouter()
  const isEditing = !!initialData

  const [formData, setFormData] = useState<ClientCreateInput>({
    companyName: initialData?.companyName ?? '',
    contactPerson: initialData?.contactPerson ?? '',
    email: initialData?.email ?? '',
    phone: initialData?.phone ?? '',
    address: initialData?.address ?? '',
    city: initialData?.city ?? '',
    creditLimit: initialData?.creditLimit ?? 0,
    paymentTermsDays: initialData?.paymentTermsDays ?? 30,
    discountPercent: initialData?.discountPercent ?? 0,
    notes: initialData?.notes ?? '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  function handleChange(field: keyof ClientCreateInput, value: string | number) {
    setFormData(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setErrors({})

    const result = isEditing
      ? await updateClient({ ...formData, id: initialData!.id })
      : await createClient(formData)

    if (result.success) {
      router.push(result.id ? `/clients/${result.id}` : '/clients')
      router.refresh()
    } else {
      setErrors({ _form: result.error ?? 'Eroare necunoscută' })
    }
    setSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {errors._form && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-md text-sm">
          {errors._form}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label={RO.clients.company} required error={errors.companyName}>
          <Input
            value={formData.companyName}
            onChange={e => handleChange('companyName', e.target.value)}
            placeholder={RO.clients.company}
          />
        </FormField>

        <FormField label={RO.clients.contact} required error={errors.contactPerson}>
          <Input
            value={formData.contactPerson}
            onChange={e => handleChange('contactPerson', e.target.value)}
            placeholder={RO.clients.contact}
          />
        </FormField>

        <FormField label={RO.clients.email} error={errors.email}>
          <Input
            type="email"
            value={formData.email}
            onChange={e => handleChange('email', e.target.value)}
            placeholder={RO.clients.email}
          />
        </FormField>

        <FormField label={RO.clients.phone} error={errors.phone}>
          <Input
            value={formData.phone}
            onChange={e => handleChange('phone', e.target.value)}
            placeholder={RO.clients.phone}
          />
        </FormField>

        <FormField label={RO.clients.city} error={errors.city}>
          <Input
            value={formData.city}
            onChange={e => handleChange('city', e.target.value)}
            placeholder={RO.clients.city}
          />
        </FormField>

        <FormField label={RO.clients.address} error={errors.address}>
          <Input
            value={formData.address}
            onChange={e => handleChange('address', e.target.value)}
            placeholder={RO.clients.address}
          />
        </FormField>

        <FormField label={RO.clients.creditLimit} error={errors.creditLimit}>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={formData.creditLimit}
            onChange={e => handleChange('creditLimit', Number(e.target.value))}
          />
        </FormField>

        <FormField label={RO.clients.paymentTerms} error={errors.paymentTermsDays}>
          <Input
            type="number"
            min="0"
            max="365"
            value={formData.paymentTermsDays}
            onChange={e => handleChange('paymentTermsDays', Number(e.target.value))}
          />
        </FormField>

        <FormField label={RO.clients.discount} error={errors.discountPercent}>
          <Input
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={formData.discountPercent}
            onChange={e => handleChange('discountPercent', Number(e.target.value))}
          />
        </FormField>
      </div>

      <FormField label={RO.clients.notes} error={errors.notes}>
        <Textarea
          value={formData.notes}
          onChange={e => handleChange('notes', e.target.value)}
          placeholder={RO.clients.notes}
          rows={3}
        />
      </FormField>

      <div className="flex gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? RO.common.loading : RO.common.save}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          {RO.common.cancel}
        </Button>
      </div>
    </form>
  )
}
