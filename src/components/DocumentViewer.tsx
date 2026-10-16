import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import pb from '@/lib/pocketbase/client'

interface Props {
  document: any | null
  onClose: () => void
}

export function DocumentViewer({ document, onClose }: Props) {
  if (!document) return null

  const fileUrl = pb.files.getURL(document, document.arquivo)
  const isImage = document.arquivo.match(/\.(jpeg|jpg|png|webp)$/i)
  const isPdf = document.arquivo.match(/\.pdf$/i)

  return (
    <Dialog open={!!document} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[90vw] w-[1000px] h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b shrink-0 flex flex-row items-center justify-between space-y-0">
          <div>
            <DialogTitle className="capitalize">{document.tipo.replace('_', ' ')}</DialogTitle>
            {document.descricao && (
              <p className="text-sm text-gray-500 mt-1">{document.descricao}</p>
            )}
          </div>
          <Button variant="outline" size="sm" asChild className="mr-8">
            <a href={fileUrl} download target="_blank" rel="noreferrer">
              <Download className="w-4 h-4 mr-2" />
              Baixar Original
            </a>
          </Button>
        </DialogHeader>
        <div className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center p-4">
          {isImage && (
            <img
              src={fileUrl}
              alt={document.descricao || document.tipo}
              className="max-w-full max-h-full object-contain shadow-sm rounded bg-white"
            />
          )}
          {isPdf && (
            <iframe
              src={`${fileUrl}#view=FitH`}
              className="w-full h-full rounded shadow-sm bg-white"
              title="Visualizador PDF"
            />
          )}
          {!isImage && !isPdf && (
            <div className="text-center text-gray-500">
              <p>Visualização não disponível para este formato.</p>
              <a
                href={fileUrl}
                download
                className="text-lavender hover:underline mt-2 inline-block"
              >
                Fazer download do arquivo
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
