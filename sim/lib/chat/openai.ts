import OpenAI from 'openai'
import type { WorkflowResponse } from '@/components/ChatWorkflow/types'
import { createLogger } from '../logs/console-logger'

const logger = createLogger('OpenAI Integration')

// Using named export with type annotation
export const generateWorkflowFromPrompt = async (prompt: string): Promise<string> => {
  try {
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OpenAI API key not found')
    }

    const openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true,
    })

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are a workflow builder assistant. Generate JSON responses in this format:
        {
          "blocks": [
            { 
              "name": "Descriptive Block Name",
              "type": "google_docs"
            }
          ],
          "edges": [
            { 
              "source": "First Block Name",
              "target": "Second Block Name"
            }
          ]
        }
        
        Block types can be: google_docs, google_sheets, google_drive, gmail, calendar.
        Ensure block names are unique and edges connect blocks by their exact names.
        Create a logical flow between blocks based on the user's request.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    return completion.choices[0]?.message?.content || ''
  } catch (error) {
    logger.error('OpenAI API error:', error)
    throw error
  }
}
