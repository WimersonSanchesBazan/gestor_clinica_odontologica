import { useState, useEffect, useCallback } from 'react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'

export function useLancamentos() {
  const [lancamentos, setLancamentos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLancamentos = useCallback(async () => {
    setLoading(true)
    try {
      const res = await pb.collection('lancamentos_financeiros').getFullList({
        sort: '-data',
        expand: 'paciente,convenio',
      })
      setLancamentos(res)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLancamentos()
  }, [fetchLancamentos])

  useRealtime('lancamentos_financeiros', fetchLancamentos)

  return {
    lancamentos,
    loading,
    refresh: fetchLancamentos,
  }
}
