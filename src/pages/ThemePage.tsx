import { useState } from 'react'
import { toast } from 'sonner'
import { Copy, Sparkles } from 'lucide-react'
import { themeVariants } from '@/ai/engine'
import { themeToCss, type ThemeMode, type ThemeTokens } from '@/lib/theme'
import { t } from '@/i18n/t'
import { useStore } from '@/store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

function Swatch({ color }: { color: string }) {
  return <span className="inline-block size-5 rounded border" style={{ background: color }} />
}

export function ThemePage() {
  const theme = useStore((s) => s.theme)
  const setTheme = useStore((s) => s.setTheme)
  const mode = useStore((s) => s.mode)
  const setMode = useStore((s) => s.setMode)
  const [prompt, setPrompt] = useState('')
  const [variants, setVariants] = useState<ThemeTokens[]>([])

  const tokens = mode === 'dark' ? theme.dark : theme.light
  const patchTokens = (key: string, value: string) =>
    setTheme({ ...theme, [mode]: { ...tokens, [key]: value } })

  const generate = () => {
    if (!prompt.trim()) return
    setVariants(themeVariants(prompt))
  }

  const copyCss = async () => {
    await navigator.clipboard.writeText(themeToCss(theme))
    toast.success(t('theme.cssCopied'))
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t('theme.title')}</h1>

      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); generate() }}>
        <div className="relative flex-1">
          <Sparkles className="absolute left-3 top-2.5 size-4 text-brass" aria-hidden />
          <Input className="pl-9" value={prompt} placeholder={t('theme.promptPlaceholder')}
            onChange={(e) => setPrompt(e.target.value)} />
        </div>
        <Button type="submit">{t('theme.generate')}</Button>
      </form>

      {variants.length > 0 && (
        <section aria-label={t('theme.variants')} className="glass grid grid-cols-3 gap-3 p-4">
          {variants.map((v) => (
            <div key={v.name} className="enter-rise space-y-2 rounded-lg border border-brass/40 bg-foreground/5 p-3">
              <div className="flex items-center gap-1.5">
                <Swatch color={v.dark['--primary']} />
                <Swatch color={v.light['--primary']} />
                <Swatch color={v.dark['--brass']} />
              </div>
              <p className="text-sm font-medium">{v.name}</p>
              <Button size="sm" variant="outline" className="w-full"
                onClick={() => { setTheme(v, 'ai-assistant'); toast.success(t('theme.applied')) }}>
                {t('theme.applyVariant')}
              </Button>
            </div>
          ))}
        </section>
      )}

      <div className="glass grid grid-cols-2 gap-6 p-6">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">{t('theme.tokens')}</h2>
            <Tabs value={mode} onValueChange={(v) => setMode(v as ThemeMode)}>
              <TabsList>
                <TabsTrigger value="light">{t('theme.light')}</TabsTrigger>
                <TabsTrigger value="dark">{t('theme.dark')}</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          {[
            ['--primary', t('theme.primary')],
            ['--brass', t('theme.brass')],
          ].map(([key, label]) => (
            <div key={key} className="flex items-center gap-3">
              <Swatch color={tokens[key]} />
              <Label className="w-24">{label}</Label>
              <Input className="font-mono text-xs" value={tokens[key]}
                onChange={(e) => patchTokens(key, e.target.value)} />
            </div>
          ))}
          <div className="flex items-center gap-3">
            <Label className="w-32">{t('theme.radius')}</Label>
            <Slider min={0} max={16} step={1}
              value={[Number.parseFloat(theme.radius) * 16]}
              onValueChange={([v]) => setTheme({ ...theme, radius: `${v / 16}rem` })} />
            <span className="w-16 font-mono text-xs">{theme.radius}</span>
          </div>
          <Button variant="outline" onClick={copyCss}>
            <Copy className="size-4" aria-hidden /> {t('theme.copyCss')}
          </Button>
        </section>

        <section aria-label={t('theme.preview')} className="space-y-3 rounded-lg border border-border bg-foreground/5 p-5">
          <p className="text-xs text-muted-foreground">{t('theme.preview')}</p>
          <h3 className="text-base font-semibold">{t('theme.sample.title')}</h3>
          <p className="text-sm text-muted-foreground">{t('theme.sample.body')}</p>
          <Input placeholder={t('theme.sample.input')} />
          <div className="flex flex-wrap items-center gap-2">
            <Button>{t('theme.sample.action')}</Button>
            <Button variant="outline">{t('theme.sample.secondary')}</Button>
            <Badge>{t('theme.sample.badge')}</Badge>
            <Badge variant="outline" className="border-brass/50 text-brass">ai-assistant</Badge>
          </div>
        </section>
      </div>
    </div>
  )
}
