export interface WorkflowBlock {
  id?: string
  name: string
  type: string
  position?: {
    x: number
    y: number
  }
}

export interface WorkflowEdge {
  id?: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
}

export interface WorkflowResponse {
  blocks?: WorkflowBlock[]
  edges?: WorkflowEdge[]
}

export interface ChatWorkflowProps {
  onClose?: () => void
  isOpen?: boolean
}
