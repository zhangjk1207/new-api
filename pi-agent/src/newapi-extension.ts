import type { ExtensionFactory } from '@earendil-works/pi-coding-agent'
import { Type } from 'typebox'

import { NewApiClient } from './newapi-client'

function toolResult(data: unknown) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(data) }],
    details: {},
  }
}

export function createNewApiExtension(client: NewApiClient): ExtensionFactory {
  return (pi) => {
    pi.registerTool({
      name: 'newapi_list_models',
      label: '查询可用模型',
      description: '查询当前用户在指定分组中可以调用的模型。',
      parameters: Type.Object({
        group: Type.Optional(
          Type.String({ description: '用户分组，留空时使用 default' })
        ),
      }),
      execute: async (_id, params) =>
        toolResult(
          await client.get(
            `/api/user/models?group=${encodeURIComponent(params.group || 'default')}`
          )
        ),
    })

    pi.registerTool({
      name: 'newapi_list_groups',
      label: '查询用户分组',
      description: '查询当前用户可以使用的 New API 分组及倍率。',
      parameters: Type.Object({}),
      execute: async () =>
        toolResult(await client.get('/api/user/self/groups')),
    })

    pi.registerTool({
      name: 'newapi_get_account',
      label: '查询账户信息',
      description: '查询当前用户的账户、额度、分组和调用统计。',
      parameters: Type.Object({}),
      execute: async () => toolResult(await client.get('/api/user/self')),
    })

    pi.registerTool({
      name: 'newapi_list_tokens',
      label: '查询 API 密钥',
      description: '查询当前用户的 API 密钥元数据。密钥值由服务端脱敏。',
      parameters: Type.Object({
        page: Type.Optional(Type.Integer({ minimum: 0, default: 0 })),
        page_size: Type.Optional(
          Type.Integer({ minimum: 1, maximum: 100, default: 20 })
        ),
      }),
      execute: async (_id, params) =>
        toolResult(
          await client.get(
            `/api/token/?p=${params.page ?? 0}&page_size=${params.page_size ?? 20}`
          )
        ),
    })
  }
}
