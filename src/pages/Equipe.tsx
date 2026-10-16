import { useEffect, useState } from 'react'
import { Plus, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Sheet } from '@/components/ui/sheet'
import { getColaboradores, type Colaborador } from '@/services/colaboradores'
import { useRealtime } from '@/hooks/use-realtime'
import { ColaboradorCard } from '@/components/equipe/ColaboradorCard'
import { ColaboradorForm } from '@/components/equipe/ColaboradorForm'

export default function Equipe() {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [filtroPerfil, setFiltroPerfil] = useState<string[]>([])
  const [filtroContrato, setFiltroContrato] = useState<string[]>([])
  const [hideInactive, setHideInactive] = useState(false)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [editingColaborador, setEditingColaborador] = useState<Colaborador | undefined>()

  const loadData = async () => {
    try {
      setColaboradores(await getColaboradores())
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('colaboradores', () => {
    loadData()
  })

  const handleOpenNew = () => {
    setEditingColaborador(undefined)
    setIsSheetOpen(true)
  }

  const handleEdit = (colaborador: Colaborador) => {
    setEditingColaborador(colaborador)
    setIsSheetOpen(true)
  }

  const filtered = colaboradores.filter((c) => {
    if (hideInactive && !c.ativo) return false
    if (filtroPerfil.length > 0 && !filtroPerfil.includes(c.perfilAcesso)) return false
    if (filtroContrato.length > 0 && !filtroContrato.includes(c.tipoContrato)) return false
    return true
  })

  const stats = {
    ativos: colaboradores.filter((c) => c.ativo).length,
    inativos: colaboradores.filter((c) => !c.ativo).length,
    admins: colaboradores.filter((c) => c.perfilAcesso === 'admin').length,
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-xs font-mono text-lavender font-semibold tracking-wider uppercase mb-1">
            Capítulo III · Equipe
          </h2>
          <h1 className="text-3xl font-display font-bold text-gray-900 tracking-tight">
            Quem faz a clínica girar.
          </h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
            <span>{stats.ativos} Ativos</span>
            <span>·</span>
            <span>{stats.inativos} Inativos</span>
            <span>·</span>
            <span>{stats.admins} Admins</span>
          </div>
        </div>
        <Button onClick={handleOpenNew} className="bg-lavender hover:bg-lavender/90 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Novo Colaborador
        </Button>
      </div>

      <div className="sticky top-16 z-30 bg-gray-50/90 backdrop-blur-md py-4 -mx-4 px-4 md:-mx-6 md:px-6 flex flex-wrap items-center gap-6 border-b border-gray-200/50">
        <div className="flex items-center gap-2">
          <Label className="text-xs text-gray-500 font-medium mr-2">Perfil:</Label>
          <ToggleGroup type="multiple" value={filtroPerfil} onValueChange={setFiltroPerfil}>
            <ToggleGroupItem value="admin" className="h-8 text-xs">
              Admin
            </ToggleGroupItem>
            <ToggleGroupItem value="medico" className="h-8 text-xs">
              Médico
            </ToggleGroupItem>
            <ToggleGroupItem value="secretaria" className="h-8 text-xs">
              Secretária
            </ToggleGroupItem>
            <ToggleGroupItem value="financeiro" className="h-8 text-xs">
              Financeiro
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs text-gray-500 font-medium mr-2">Contrato:</Label>
          <ToggleGroup type="multiple" value={filtroContrato} onValueChange={setFiltroContrato}>
            <ToggleGroupItem value="clt" className="h-8 text-xs">
              CLT
            </ToggleGroupItem>
            <ToggleGroupItem value="pj" className="h-8 text-xs">
              PJ
            </ToggleGroupItem>
            <ToggleGroupItem value="estagio" className="h-8 text-xs">
              Estágio
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <Switch id="hide-inactive" checked={hideInactive} onCheckedChange={setHideInactive} />
          <Label htmlFor="hide-inactive" className="text-sm cursor-pointer text-gray-600">
            Ocultar Inativos
          </Label>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-100 shadow-sm">
          <img
            src="https://img.usecurling.com/p/200/200?q=team&color=lavender"
            alt="Equipe"
            className="w-48 h-48 mb-6 opacity-80 mix-blend-multiply"
          />
          <h3 className="text-lg font-display font-medium text-gray-900 mb-2">
            Cadastre o primeiro colaborador
          </h3>
          <p className="text-gray-500 text-sm mb-6 max-w-sm text-center">
            Organize sua equipe, gerencie acessos e mantenha os dados contratuais em um só lugar.
          </p>
          <Button
            onClick={handleOpenNew}
            variant="outline"
            className="border-lavender text-lavender hover:bg-lavender-soft"
          >
            Adicionar Colaborador
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((c) => (
            <ColaboradorCard key={c.id} colaborador={c} onEdit={() => handleEdit(c)} />
          ))}
        </div>
      )}

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <ColaboradorForm colaborador={editingColaborador} onSuccess={() => setIsSheetOpen(false)} />
      </Sheet>
    </div>
  )
}
