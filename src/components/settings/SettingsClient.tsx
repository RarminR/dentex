'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { RO } from '@/lib/constants/ro'
import { updateEngineConfig, changePassword } from '@/lib/actions/settings'
import type { EngineConfig } from '@/lib/engine/types'
import { Lock, Settings2, CheckCircle2, AlertCircle } from 'lucide-react'

interface SettingsClientProps {
  initialConfig: EngineConfig
}

type FeedbackState = { type: 'success' | 'error'; message: string } | null

function FeedbackBanner({ feedback }: { feedback: FeedbackState }) {
  if (!feedback) return null
  const isSuccess = feedback.type === 'success'
  return (
    <div className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
      isSuccess ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
    }`}>
      {isSuccess ? <CheckCircle2 className="size-4" /> : <AlertCircle className="size-4" />}
      {feedback.message}
    </div>
  )
}

export function SettingsClient({ initialConfig }: SettingsClientProps) {
  const [passwordFeedback, setPasswordFeedback] = useState<FeedbackState>(null)
  const [configFeedback, setConfigFeedback] = useState<FeedbackState>(null)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [configLoading, setConfigLoading] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [weights, setWeights] = useState({
    clientFrequency: initialConfig.weights.clientFrequency,
    globalPopularity: initialConfig.weights.globalPopularity,
    margin: initialConfig.weights.margin,
    recency: initialConfig.weights.recency,
    slowMoverPush: initialConfig.weights.slowMoverPush,
  })
  const [anchorRatio, setAnchorRatio] = useState(initialConfig.anchorRatio)
  const [minBundleSize, setMinBundleSize] = useState(initialConfig.minBundleSize)
  const [maxBundleSize, setMaxBundleSize] = useState(initialConfig.maxBundleSize)
  const [maxCategoryPercent, setMaxCategoryPercent] = useState(initialConfig.maxCategoryPercent)
  const [scoringTimeframeDays, setScoringTimeframeDays] = useState(initialConfig.scoringTimeframeDays)

  const totalWeights = useMemo(() => {
    return Object.values(weights).reduce((a, b) => a + b, 0)
  }, [weights])

  const weightsValid = Math.abs(totalWeights - 1.0) < 0.001

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPasswordFeedback(null)

    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ type: 'error', message: 'Parolele nu se potrivesc' })
      return
    }

    setPasswordLoading(true)
    try {
      const result = await changePassword(currentPassword, newPassword)
      if (result.success) {
        setPasswordFeedback({ type: 'success', message: 'Parola a fost schimbat\u0103 cu succes' })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setPasswordFeedback({ type: 'error', message: result.error })
      }
    } catch {
      setPasswordFeedback({ type: 'error', message: 'A ap\u0103rut o eroare' })
    } finally {
      setPasswordLoading(false)
    }
  }

  async function handleConfigSubmit(e: React.FormEvent) {
    e.preventDefault()
    setConfigFeedback(null)

    if (!weightsValid) {
      setConfigFeedback({ type: 'error', message: 'Ponderile trebuie s\u0103 totalizeze 1,00' })
      return
    }

    const config: EngineConfig = {
      weights,
      anchorRatio,
      minBundleSize,
      maxBundleSize,
      maxCategoryPercent,
      scoringTimeframeDays,
    }

    setConfigLoading(true)
    try {
      const result = await updateEngineConfig(config)
      if (result.success) {
        setConfigFeedback({ type: 'success', message: 'Configura\u021bia a fost salvat\u0103' })
      } else {
        setConfigFeedback({ type: 'error', message: result.error })
      }
    } catch {
      setConfigFeedback({ type: 'error', message: 'A ap\u0103rut o eroare' })
    } finally {
      setConfigLoading(false)
    }
  }

  function updateWeight(key: keyof typeof weights, value: string) {
    const num = parseFloat(value)
    if (!isNaN(num)) {
      setWeights(prev => ({ ...prev, [key]: num }))
    } else if (value === '' || value === '0.') {
      setWeights(prev => ({ ...prev, [key]: 0 }))
    }
  }

  const weightFields: Array<{ key: keyof typeof weights; label: string }> = [
    { key: 'clientFrequency', label: RO.settings.clientFrequency },
    { key: 'globalPopularity', label: RO.settings.globalPopularity },
    { key: 'margin', label: RO.settings.margin },
    { key: 'recency', label: RO.settings.recency },
    { key: 'slowMoverPush', label: RO.settings.slowMoverPush },
  ]

  return (
    <div className="max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="size-5 text-gray-500" />
            <CardTitle>{RO.settings.account}</CardTitle>
          </div>
          <CardDescription>{RO.settings.changePassword}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <FeedbackBanner feedback={passwordFeedback} />
            <div className="space-y-1">
              <Label htmlFor="currentPassword">{RO.settings.currentPassword}</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="newPassword">{RO.settings.newPassword}</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="confirmPassword">{RO.settings.confirmPassword}</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button type="submit" disabled={passwordLoading}>
              {passwordLoading ? RO.common.loading : RO.settings.changePassword}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings2 className="size-5 text-gray-500" />
            <CardTitle>{RO.settings.engineConfig}</CardTitle>
          </div>
          <CardDescription>Ponderi de scorizare \u0219i parametri de generare oferte</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleConfigSubmit} className="space-y-6">
            <FeedbackBanner feedback={configFeedback} />

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">Ponderi scorizare</h3>
              <div className="grid gap-3">
                {weightFields.map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-3">
                    <Label className="w-44 text-sm text-gray-600 shrink-0">{label}</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={weights[key]}
                      onChange={e => updateWeight(key, e.target.value)}
                      className="w-24"
                    />
                  </div>
                ))}
              </div>

              <div className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                weightsValid
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {weightsValid ? <CheckCircle2 className="size-4" /> : <AlertCircle className="size-4" />}
                {RO.settings.totalWeights}: {totalWeights.toFixed(2).replace('.', ',')}
                {!weightsValid && ' \u2014 Ponderile trebuie s\u0103 totalizeze 1,00'}
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">Parametri ofert\u0103</h3>
              <div className="grid gap-3">
                <div className="flex items-center gap-3">
                  <Label className="w-44 text-sm text-gray-600 shrink-0">{RO.settings.anchorRatio}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={anchorRatio}
                      onChange={e => setAnchorRatio(parseFloat(e.target.value) || 0)}
                      className="w-24"
                    />
                    <span className="text-sm text-gray-500">{Math.round(anchorRatio * 100)}%</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Label className="w-44 text-sm text-gray-600 shrink-0">{RO.settings.minBundle}</Label>
                  <Input
                    type="number"
                    min="1"
                    max="50"
                    value={minBundleSize}
                    onChange={e => setMinBundleSize(parseInt(e.target.value) || 1)}
                    className="w-24"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Label className="w-44 text-sm text-gray-600 shrink-0">{RO.settings.maxBundle}</Label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={maxBundleSize}
                    onChange={e => setMaxBundleSize(parseInt(e.target.value) || 1)}
                    className="w-24"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Label className="w-44 text-sm text-gray-600 shrink-0">{RO.settings.categoryLimit}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={maxCategoryPercent}
                      onChange={e => setMaxCategoryPercent(parseFloat(e.target.value) || 0)}
                      className="w-24"
                    />
                    <span className="text-sm text-gray-500">{Math.round(maxCategoryPercent * 100)}%</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Label className="w-44 text-sm text-gray-600 shrink-0">{RO.settings.scoringPeriod}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="30"
                      max="3650"
                      value={scoringTimeframeDays}
                      onChange={e => setScoringTimeframeDays(parseInt(e.target.value) || 365)}
                      className="w-24"
                    />
                    <span className="text-sm text-gray-500">zile</span>
                  </div>
                </div>
              </div>
            </div>

            <Button type="submit" disabled={configLoading || !weightsValid}>
              {configLoading ? RO.common.loading : RO.common.save}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
