'use client'

import { useState } from 'react'
import { MessageSquarePlus, X } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { generateWorkflowFromPrompt } from '@/lib/chat/openai'
import { createLogger } from '@/lib/logs/console-logger'
import { useWorkflowStore } from '@/stores/workflows/workflow/store'
import { WorkflowBlock, WorkflowEdge } from './types'

const logger = createLogger('ChatWorkflow')

export function ChatWorkflow() {
  const [prompt, setPrompt] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const workflow = useWorkflowStore()

  const calculateBlockPosition = (index: number) => {
    const startX = 800 // Keep existing start position
    const startY = 300 // Keep existing Y position
    const xSpacing = 500 // Keep existing spacing

    return {
      x: startX + xSpacing * index,
      y: startY,
    }
  }

  const createEdge = (source: string, target: string) => ({
    id: uuidv4(),
    source,
    target,
    sourceHandle: 'output',
    targetHandle: 'input',
    type: 'workflow',
    animated: true,
    style: { strokeWidth: 2 }, // Consistent line width
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) return

    try {
      setIsProcessing(true)
      const result = await generateWorkflowFromPrompt(prompt)

      if (result) {
        const parsedResult = JSON.parse(result)
        const blockIds: string[] = []

        // Step 1: Create all blocks first
        parsedResult.blocks?.forEach((block: WorkflowBlock, index: number) => {
          const blockId = crypto.randomUUID()
          const position = calculateBlockPosition(index)

          // Add block and store its ID
          workflow.addBlock(blockId, block.type, block.name, position)
          blockIds.push(blockId)
        })

        // Step 2: Create connections after all blocks exist
        if (blockIds.length > 0) {
          // Get Start block
          const startBlock = Object.values(workflow.blocks).find((block) => block.name === 'Start')

          // Connect Start to first block
          if (startBlock) {
            workflow.addEdge({
              id: crypto.randomUUID(),
              source: startBlock.id,
              target: blockIds[0],
              sourceHandle: 'output',
              targetHandle: 'input',
              type: 'workflow',
              animated: true,
            })
          }

          // Connect subsequent blocks
          for (let i = 0; i < blockIds.length - 1; i++) {
            workflow.addEdge({
              id: crypto.randomUUID(),
              source: blockIds[i],
              target: blockIds[i + 1],
              sourceHandle: 'output',
              targetHandle: 'input',
              type: 'workflow',
              animated: true,
            })
          }
        }

        setPrompt('')
        setIsOpen(false)
        logger.info('Workflow created successfully')
      }
    } catch (err) {
      logger.error('Failed to create workflow:', err)
    } finally {
      setIsProcessing(false)
    }
  }

  if (!isOpen) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => setIsOpen(true)}
            className="fixed right-28 bottom-[18px] z-10 flex h-9 w-9 items-center justify-center rounded-lg bg-background text-muted-foreground transition-colors hover:text-foreground hover:bg-accent border"
          >
            <MessageSquarePlus className="h-5 w-5" />
            <span className="sr-only">Open Workflow Chat</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="left">Create Workflow from Text</TooltipContent>
      </Tooltip>
    )
  }

  return (
    <div className="fixed bottom-16 right-16 z-50 w-[300px] bg-background rounded-2xl border shadow-lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 p-2">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent/50"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close Workflow Chat</span>
          </Button>
          <Input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={isProcessing ? 'Creating workflow...' : 'Describe your workflow...'}
            disabled={isProcessing}
            className="flex-1 rounded-xl border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm text-foreground placeholder:text-muted-foreground/50"
          />
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            disabled={isProcessing}
            className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent/50"
          >
            <MessageSquarePlus className="h-4 w-4" />
            <span className="sr-only">Create Workflow</span>
          </Button>
        </div>
      </form>
    </div>
  )
}
