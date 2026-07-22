/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import type { MarketplaceDefinition } from './types'

export const ALGORITHM_MARKETPLACE: MarketplaceDefinition = {
  kind: 'algorithm',
  titleKey: 'Algorithm Square',
  subtitleKey:
    'Explore reusable algorithm services for document, speech, and data processing.',
  searchPlaceholderKey: 'Search algorithms by name, category, or tag...',
  items: [
    {
      id: 'mineru-document-parser',
      nameKey: 'MinerU Document Parsing',
      descriptionKey:
        'Parse PDF, Word, PowerPoint, images, and spreadsheets into structured Markdown.',
      categoryKey: 'Document Intelligence',
      icon: 'document',
      status: 'ready',
      version: 'v3.4.2',
      tags: ['PDF', 'OCR', 'Markdown'],
      inputKey: 'Documents and images',
      outputKey: 'Markdown and structured data',
      deliveryKey: 'API service',
    },
    {
      id: 'document-image-ocr',
      nameKey: 'Document Image OCR',
      descriptionKey:
        'Recognize Chinese and English text while preserving blocks, tables, and reading order.',
      categoryKey: 'Document Intelligence',
      icon: 'document',
      status: 'ready',
      version: 'v2.1.0',
      tags: ['Chinese', 'Table', 'Layout'],
      inputKey: 'Document images',
      outputKey: 'Text and layout data',
      deliveryKey: 'API service',
    },
    {
      id: 'speech-recognition',
      nameKey: 'Speech Recognition',
      descriptionKey:
        'Convert recorded meetings and business audio into timestamped text.',
      categoryKey: 'Speech Intelligence',
      icon: 'audio',
      status: 'ready',
      version: 'v1.8.3',
      tags: ['ASR', 'Timestamp', 'Chinese'],
      inputKey: 'Audio files',
      outputKey: 'Timestamped transcript',
      deliveryKey: 'API service',
    },
    {
      id: 'speech-synthesis',
      nameKey: 'Speech Synthesis',
      descriptionKey:
        'Generate clear Mandarin speech for assistants, broadcasts, and digital humans.',
      categoryKey: 'Speech Intelligence',
      icon: 'voice',
      status: 'preview',
      version: 'v0.9.0',
      tags: ['TTS', 'Mandarin', 'Streaming'],
      inputKey: 'Text',
      outputKey: 'Speech audio',
      deliveryKey: 'Streaming API',
    },
    {
      id: 'text-embedding',
      nameKey: 'Text Embedding',
      descriptionKey:
        'Create semantic vectors for retrieval, clustering, and knowledge base indexing.',
      categoryKey: 'Data Intelligence',
      icon: 'embedding',
      status: 'ready',
      version: 'v1.3.1',
      tags: ['Embedding', 'Retrieval', 'Vector'],
      inputKey: 'Text',
      outputKey: 'Vector embeddings',
      deliveryKey: 'OpenAI-compatible API',
    },
    {
      id: 'text-reranking',
      nameKey: 'Text Reranking',
      descriptionKey:
        'Rerank retrieved passages by relevance to improve grounded answer quality.',
      categoryKey: 'Data Intelligence',
      icon: 'ranking',
      status: 'ready',
      version: 'v1.2.0',
      tags: ['Rerank', 'RAG', 'Relevance'],
      inputKey: 'Query and passages',
      outputKey: 'Relevance scores',
      deliveryKey: 'API service',
    },
  ],
}

export const SKILLS_MARKETPLACE: MarketplaceDefinition = {
  kind: 'skill',
  titleKey: 'Skills Square',
  subtitleKey:
    'Discover ready-to-use workflows that combine models, algorithms, and business prompts.',
  searchPlaceholderKey: 'Search skills by name, scenario, or tag...',
  items: [
    {
      id: 'document-summary',
      nameKey: 'Document Summary',
      descriptionKey:
        'Extract key findings, conclusions, and action items from long business documents.',
      categoryKey: 'Document Productivity',
      icon: 'document',
      status: 'ready',
      version: 'v1.2.0',
      tags: ['Summary', 'PDF', 'Long context'],
      inputKey: 'Documents and instructions',
      outputKey: 'Structured summary',
      deliveryKey: 'Workflow',
    },
    {
      id: 'knowledge-qa',
      nameKey: 'Knowledge Base Q&A',
      descriptionKey:
        'Answer questions against internal materials with traceable source references.',
      categoryKey: 'Knowledge Services',
      icon: 'embedding',
      status: 'ready',
      version: 'v2.0.1',
      tags: ['RAG', 'Citation', 'Knowledge'],
      inputKey: 'Question and knowledge base',
      outputKey: 'Grounded answer with citations',
      deliveryKey: 'Workflow',
    },
    {
      id: 'data-analysis-report',
      nameKey: 'Data Analysis Report',
      descriptionKey:
        'Turn tables and metric data into concise findings, trends, and management summaries.',
      categoryKey: 'Data Productivity',
      icon: 'chart',
      status: 'preview',
      version: 'v0.8.2',
      tags: ['Analysis', 'Chart', 'Report'],
      inputKey: 'Tables and analysis goals',
      outputKey: 'Insights and report outline',
      deliveryKey: 'Workflow',
    },
    {
      id: 'sql-copilot',
      nameKey: 'SQL Copilot',
      descriptionKey:
        'Generate, explain, and optimize SQL from business questions and database schemas.',
      categoryKey: 'Developer Tools',
      icon: 'ranking',
      status: 'ready',
      version: 'v1.5.0',
      tags: ['SQL', 'Database', 'Copilot'],
      inputKey: 'Question and database schema',
      outputKey: 'SQL and explanation',
      deliveryKey: 'Workflow',
    },
    {
      id: 'meeting-minutes',
      nameKey: 'Meeting Minutes',
      descriptionKey:
        'Organize meeting transcripts into topics, decisions, owners, and follow-up actions.',
      categoryKey: 'Office Productivity',
      icon: 'audio',
      status: 'ready',
      version: 'v1.1.4',
      tags: ['Meeting', 'Summary', 'Action items'],
      inputKey: 'Audio or transcript',
      outputKey: 'Structured meeting minutes',
      deliveryKey: 'Workflow',
    },
    {
      id: 'api-debug-assistant',
      nameKey: 'API Debug Assistant',
      descriptionKey:
        'Analyze API requests, responses, and logs to identify likely integration failures.',
      categoryKey: 'Developer Tools',
      icon: 'voice',
      status: 'preview',
      version: 'v0.7.0',
      tags: ['API', 'Logs', 'Diagnostics'],
      inputKey: 'Request, response, and logs',
      outputKey: 'Diagnosis and remediation steps',
      deliveryKey: 'Workflow',
    },
  ],
}
