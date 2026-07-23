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
import { readFileSync } from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'

const LOCALES_DIR = path.resolve('src/i18n/locales')
const marketplaceTranslations = JSON.parse(
  readFileSync(
    new URL('./marketplace-translations.json', import.meta.url),
    'utf8'
  )
)

function stableStringify(obj) {
  return `${JSON.stringify(obj, null, 2)}\n`
}

const homepageKeys = {
  en: {
    'Xingluo model service component': 'Xingluo model service component',
    'Unify access, routing, and governance for every model capability':
      'Unify access, routing, and governance for every model capability',
    'Zhiqing provides internal business applications with unified management for multi-node local models and multi-channel model services, including compatible APIs, stable routing, operational monitoring, and call analysis.':
      'Zhiqing provides internal business applications with unified management for multi-node local models and multi-channel model services, including compatible APIs, stable routing, operational monitoring, and call analysis.',
    'Browse models': 'Browse models',
    'Core capabilities': 'Core capabilities',
    'Operate every model service from one control plane':
      'Operate every model service from one control plane',
    'Unified model gateway': 'Unified model gateway',
    'Serve different model protocols and upstream services through one compatible interface.':
      'Serve different model protocols and upstream services through one compatible interface.',
    'Local model access': 'Local model access',
    'Connect multi-node vLLM model services and manage model-channel relationships centrally.':
      'Connect multi-node vLLM model services and manage model-channel relationships centrally.',
    'Multi-channel intelligent routing': 'Multi-channel intelligent routing',
    'Route requests by group, priority, and availability with automatic failover.':
      'Route requests by group, priority, and availability with automatic failover.',
    'Service status monitoring': 'Service status monitoring',
    'Review 24-hour availability, success rate, response latency, and status timelines.':
      'Review 24-hour availability, success rate, response latency, and status timelines.',
    'Resource and engine monitoring': 'Resource and engine monitoring',
    'Track CPU, memory, GPU, vLLM concurrency, queueing, and cache metrics.':
      'Track CPU, memory, GPU, vLLM concurrency, queueing, and cache metrics.',
    'Call analysis and request-path audit':
      'Call analysis and request-path audit',
    'Analyze usage by user, key, and model while retaining auditable request paths.':
      'Analyze usage by user, key, and model while retaining auditable request paths.',
    'Multi-node unified management': 'Multi-node unified management',
    'Centrally manage distributed model services':
      'Centrally manage distributed model services',
    'Multi-protocol compatible access': 'Multi-protocol compatible access',
    'Reduce application changes through a unified API':
      'Reduce application changes through a unified API',
    'Full-link monitoring and analysis': 'Full-link monitoring and analysis',
    'Understand operations from gateway to inference engine':
      'Understand operations from gateway to inference engine',
    'Request-path audit': 'Request-path audit',
    'Support troubleshooting and internal governance':
      'Support troubleshooting and internal governance',
    'Access flow': 'Access flow',
    'A clear path from model resources to governed service':
      'A clear path from model resources to governed service',
    'Connect resources': 'Connect resources',
    'Prepare local model nodes or external model services.':
      'Prepare local model nodes or external model services.',
    'Configure channels': 'Configure channels',
    'Maintain models, groups, credentials, and routing policies.':
      'Maintain models, groups, credentials, and routing policies.',
    'Call through one API': 'Call through one API',
    'Business systems use model capabilities through a standard API.':
      'Business systems use model capabilities through a standard API.',
    'Monitor and govern': 'Monitor and govern',
    'Continuously analyze service health, resources, and request paths.':
      'Continuously analyze service health, resources, and request paths.',
    'Keep every model capability reliable for every business scenario':
      'Keep every model capability reliable for every business scenario',
    'Connect, route, monitor, and govern model services through one dependable platform.':
      'Connect, route, monitor, and govern model services through one dependable platform.',
    'Available models': 'Available models',
    'Requests in the last 24 hours': 'Requests in the last 24 hours',
    'Tokens in the last 24 hours': 'Tokens in the last 24 hours',
    'Platform call success rate': 'Platform call success rate',
    '{{healthy}} / {{total}} services healthy':
      '{{healthy}} / {{total}} services healthy',
    'Platform operation overview': 'Platform operation overview',
    'Retry operation overview': 'Retry operation overview',
    'Request trend': 'Request trend',
    'Request trend for the last 24 hours':
      'Request trend for the last 24 hours',
    'Request trend data': 'Request trend data',
    'At {{time}}: {{requests}} requests': 'At {{time}}: {{requests}} requests',
    Routed: 'Routed',
    'Route matched': 'Route matched',
  },
  zh: {
    'Xingluo model service component': '星罗数场大模型服务组件',
    'Unify access, routing, and governance for every model capability':
      '统一接入、调度与治理每一项模型能力',
    'Zhiqing provides internal business applications with unified management for multi-node local models and multi-channel model services, including compatible APIs, stable routing, operational monitoring, and call analysis.':
      '智擎为内部业务应用提供多节点本地模型与多渠道模型服务的统一管理，涵盖兼容 API、稳定调度、运行监控和调用分析。',
    'Browse models': '浏览模型',
    'Core capabilities': '核心能力',
    'Operate every model service from one control plane':
      '在一个控制面统一运营所有模型服务',
    'Unified model gateway': '统一模型网关',
    'Serve different model protocols and upstream services through one compatible interface.':
      '通过一个兼容接口接入不同模型协议和上游服务。',
    'Local model access': '本地模型接入',
    'Connect multi-node vLLM model services and manage model-channel relationships centrally.':
      '接入多节点 vLLM 模型服务，集中管理模型与渠道关系。',
    'Multi-channel intelligent routing': '多渠道智能调度',
    'Route requests by group, priority, and availability with automatic failover.':
      '按分组、优先级和可用性调度请求，并自动故障切换。',
    'Service status monitoring': '服务状态监控',
    'Review 24-hour availability, success rate, response latency, and status timelines.':
      '查看 24 小时可用性、成功率、响应延迟和状态时间线。',
    'Resource and engine monitoring': '资源与引擎监控',
    'Track CPU, memory, GPU, vLLM concurrency, queueing, and cache metrics.':
      '跟踪 CPU、内存、GPU、vLLM 并发、排队和缓存指标。',
    'Call analysis and request-path audit': '调用分析与调用链路审计',
    'Analyze usage by user, key, and model while retaining auditable request paths.':
      '按用户、密钥和模型分析用量，并保留可审计的调用链路。',
    'Multi-node unified management': '多节点统一纳管',
    'Centrally manage distributed model services': '集中管理分布式模型服务',
    'Multi-protocol compatible access': '多协议兼容接入',
    'Reduce application changes through a unified API':
      '通过统一 API 减少应用改造',
    'Full-link monitoring and analysis': '全链路监控分析',
    'Understand operations from gateway to inference engine':
      '洞察从网关到推理引擎的运行情况',
    'Request-path audit': '调用链路审计',
    'Support troubleshooting and internal governance': '支持问题排查与内部治理',
    'Access flow': '接入流程',
    'A clear path from model resources to governed service':
      '从模型资源到受治理服务的清晰路径',
    'Connect resources': '接入资源',
    'Prepare local model nodes or external model services.':
      '准备本地模型节点或外部模型服务。',
    'Configure channels': '配置渠道',
    'Maintain models, groups, credentials, and routing policies.':
      '维护模型、分组、凭据和调度策略。',
    'Call through one API': '统一调用',
    'Business systems use model capabilities through a standard API.':
      '业务系统通过标准 API 使用模型能力。',
    'Monitor and govern': '监控治理',
    'Continuously analyze service health, resources, and request paths.':
      '持续分析服务健康度、资源和调用链路。',
    'Keep every model capability reliable for every business scenario':
      '让模型能力稳定服务于每一个业务场景',
    'Connect, route, monitor, and govern model services through one dependable platform.':
      '通过一个可靠平台接入、调度、监控和治理模型服务。',
    'Available models': '可用模型',
    'Requests in the last 24 hours': '最近 24 小时请求数',
    'Tokens in the last 24 hours': '最近 24 小时 Token 用量',
    'Platform call success rate': '平台调用成功率',
    '{{healthy}} / {{total}} services healthy':
      '{{healthy}} / {{total}} 个服务健康',
    'Platform operation overview': '平台运行概览',
    'Retry operation overview': '重新加载运行概览',
    'Request trend': '请求趋势',
    'Request trend for the last 24 hours': '最近 24 小时请求趋势',
    'Request trend data': '请求趋势数据',
    'At {{time}}: {{requests}} requests': '{{time}}：{{requests}} 次请求',
    Routed: '已路由',
    'Route matched': '路由已匹配',
  },
  'zh-TW': {
    'Xingluo model service component': '星羅數場大模型服務元件',
    'Unify access, routing, and governance for every model capability':
      '統一接入、調度與治理每一項模型能力',
    'Zhiqing provides internal business applications with unified management for multi-node local models and multi-channel model services, including compatible APIs, stable routing, operational monitoring, and call analysis.':
      'Zhiqing 為內部業務應用提供多節點本地模型與多渠道模型服務的統一管理，涵蓋相容 API、穩定調度、營運監控與呼叫分析。',
    'Browse models': '瀏覽模型',
    'Core capabilities': '核心能力',
    'Operate every model service from one control plane':
      '以單一控制面營運所有模型服務',
    'Unified model gateway': '統一模型閘道',
    'Serve different model protocols and upstream services through one compatible interface.':
      '透過單一相容介面接入不同模型協定與上游服務。',
    'Local model access': '本地模型接入',
    'Connect multi-node vLLM model services and manage model-channel relationships centrally.':
      '接入多節點 vLLM 模型服務，集中管理模型與渠道關係。',
    'Multi-channel intelligent routing': '多渠道智慧調度',
    'Route requests by group, priority, and availability with automatic failover.':
      '依分組、優先順序與可用性調度請求，並自動容錯切換。',
    'Service status monitoring': '服務狀態監控',
    'Review 24-hour availability, success rate, response latency, and status timelines.':
      '查看 24 小時可用性、成功率、回應延遲與狀態時間軸。',
    'Resource and engine monitoring': '資源與引擎監控',
    'Track CPU, memory, GPU, vLLM concurrency, queueing, and cache metrics.':
      '追蹤 CPU、記憶體、GPU、vLLM 併發、佇列與快取指標。',
    'Call analysis and request-path audit': '呼叫分析與呼叫路徑稽核',
    'Analyze usage by user, key, and model while retaining auditable request paths.':
      '依使用者、金鑰與模型分析用量，並保留可稽核的呼叫路徑。',
    'Multi-node unified management': '多節點統一管理',
    'Centrally manage distributed model services': '集中管理分散式模型服務',
    'Multi-protocol compatible access': '多協定相容接入',
    'Reduce application changes through a unified API':
      '透過統一 API 減少應用改造',
    'Full-link monitoring and analysis': '全鏈路監控與分析',
    'Understand operations from gateway to inference engine':
      '掌握從閘道到推理引擎的營運狀態',
    'Request-path audit': '呼叫路徑稽核',
    'Support troubleshooting and internal governance': '支援問題排查與內部治理',
    'Access flow': '接入流程',
    'A clear path from model resources to governed service':
      '從模型資源到受治理服務的清晰路徑',
    'Connect resources': '接入資源',
    'Prepare local model nodes or external model services.':
      '準備本地模型節點或外部模型服務。',
    'Configure channels': '設定渠道',
    'Maintain models, groups, credentials, and routing policies.':
      '維護模型、分組、憑證與調度策略。',
    'Call through one API': '透過單一 API 呼叫',
    'Business systems use model capabilities through a standard API.':
      '業務系統透過標準 API 使用模型能力。',
    'Monitor and govern': '監控與治理',
    'Continuously analyze service health, resources, and request paths.':
      '持續分析服務健康度、資源與呼叫路徑。',
    'Keep every model capability reliable for every business scenario':
      '讓模型能力穩定服務每一個業務情境',
    'Connect, route, monitor, and govern model services through one dependable platform.':
      '透過單一可靠平台接入、調度、監控與治理模型服務。',
    'Available models': '可用模型',
    'Requests in the last 24 hours': '最近 24 小時請求數',
    'Tokens in the last 24 hours': '最近 24 小時 Token 用量',
    'Platform call success rate': '平台呼叫成功率',
    '{{healthy}} / {{total}} services healthy':
      '{{healthy}} / {{total}} 個服務正常',
    'Platform operation overview': '平台營運概覽',
    'Retry operation overview': '重新載入運行概覽',
    'Request trend': '請求趨勢',
    'Request trend for the last 24 hours': '最近 24 小時請求趨勢',
    'Request trend data': '請求趨勢資料',
    'At {{time}}: {{requests}} requests': '{{time}}：{{requests}} 次請求',
    Routed: '已路由',
    'Route matched': '路由已符合',
  },
  fr: {
    'Xingluo model service component':
      'Composant de service de modèles Xingluo',
    'Unify access, routing, and governance for every model capability':
      'Unifiez accès, routage et gouvernance de chaque capacité de modèle',
    'Zhiqing provides internal business applications with unified management for multi-node local models and multi-channel model services, including compatible APIs, stable routing, operational monitoring, and call analysis.':
      'Zhiqing unifie les modèles locaux multi-noeuds et les services multi-canaux pour les applications internes : API compatibles, routage stable, supervision et analyse des appels.',
    'Browse models': 'Parcourir les modèles',
    'Core capabilities': 'Capacités clés',
    'Operate every model service from one control plane':
      'Gérez tous les services de modèles depuis un seul plan de contrôle',
    'Unified model gateway': 'Passerelle de modèles unifiée',
    'Serve different model protocols and upstream services through one compatible interface.':
      'Exposez divers protocoles de modèles et services amont via une interface compatible.',
    'Local model access': 'Accès aux modèles locaux',
    'Connect multi-node vLLM model services and manage model-channel relationships centrally.':
      'Connectez des services vLLM multi-noeuds et gérez centralement les relations modèle-canal.',
    'Multi-channel intelligent routing': 'Routage intelligent multi-canal',
    'Route requests by group, priority, and availability with automatic failover.':
      'Routez par groupe, priorité et disponibilité avec basculement automatique.',
    'Service status monitoring': "Supervision de l'état des services",
    'Review 24-hour availability, success rate, response latency, and status timelines.':
      'Consultez disponibilité, succès, latence et chronologie sur 24 heures.',
    'Resource and engine monitoring': 'Supervision des ressources et moteurs',
    'Track CPU, memory, GPU, vLLM concurrency, queueing, and cache metrics.':
      "Suivez CPU, mémoire, GPU, concurrence vLLM, files d'attente et cache.",
    'Call analysis and request-path audit':
      'Analyse des appels et audit des requêtes',
    'Analyze usage by user, key, and model while retaining auditable request paths.':
      "Analysez l'usage par utilisateur, clé et modèle, avec des chemins de requête auditables.",
    'Multi-node unified management': 'Gestion unifiée multi-noeuds',
    'Centrally manage distributed model services':
      'Gérez centralement les services de modèles distribués',
    'Multi-protocol compatible access': 'Accès compatible multi-protocole',
    'Reduce application changes through a unified API':
      'Réduisez les changements applicatifs avec une API unifiée',
    'Full-link monitoring and analysis':
      'Supervision et analyse de bout en bout',
    'Understand operations from gateway to inference engine':
      "Comprenez les opérations de la passerelle au moteur d'inférence",
    'Request-path audit': 'Audit du chemin des requêtes',
    'Support troubleshooting and internal governance':
      'Facilitez le diagnostic et la gouvernance interne',
    'Access flow': "Flux d'accès",
    'A clear path from model resources to governed service':
      'Un parcours clair des ressources de modèles au service gouverné',
    'Connect resources': 'Connecter les ressources',
    'Prepare local model nodes or external model services.':
      'Préparez des noeuds de modèles locaux ou des services externes.',
    'Configure channels': 'Configurer les canaux',
    'Maintain models, groups, credentials, and routing policies.':
      'Maintenez modèles, groupes, identifiants et politiques de routage.',
    'Call through one API': 'Appeler via une API',
    'Business systems use model capabilities through a standard API.':
      'Les systèmes métier utilisent les modèles via une API standard.',
    'Monitor and govern': 'Superviser et gouverner',
    'Continuously analyze service health, resources, and request paths.':
      'Analysez en continu santé, ressources et chemins de requête.',
    'Keep every model capability reliable for every business scenario':
      'Fiabilisez chaque capacité de modèle pour tous les cas métier',
    'Connect, route, monitor, and govern model services through one dependable platform.':
      'Connectez, routez, supervisez et gouvernez les services de modèles sur une plateforme fiable.',
    'Available models': 'Modèles disponibles',
    'Requests in the last 24 hours': 'Requêtes sur 24 heures',
    'Tokens in the last 24 hours': 'Jetons sur 24 heures',
    'Platform call success rate': 'Taux de succès des appels',
    '{{healthy}} / {{total}} services healthy':
      '{{healthy}} / {{total}} services sains',
    'Platform operation overview': "Vue d'ensemble de la plateforme",
    'Retry operation overview': 'Recharger la vue d’ensemble opérationnelle',
    'Request trend': 'Tendance des requêtes',
    'Request trend for the last 24 hours':
      'Tendance des requêtes sur 24 heures',
    'Request trend data': 'Données de tendance des requêtes',
    'At {{time}}: {{requests}} requests': '{{time}} : {{requests}} requêtes',
    Routed: 'Acheminé',
    'Route matched': 'Route trouvée',
  },
  ja: {
    'Xingluo model service component': '星羅モデルサービスコンポーネント',
    'Unify access, routing, and governance for every model capability':
      'あらゆるモデル機能のアクセス、ルーティング、統制を一元化',
    'Zhiqing provides internal business applications with unified management for multi-node local models and multi-channel model services, including compatible APIs, stable routing, operational monitoring, and call analysis.':
      'Zhiqing は、互換 API、安定したルーティング、運用監視、呼び出し分析を備え、社内業務向けにマルチノードのローカルモデルとマルチチャネルのモデルサービスを一元管理します。',
    'Browse models': 'モデルを表示',
    'Core capabilities': '主要機能',
    'Operate every model service from one control plane':
      '単一のコントロールプレーンで全モデルサービスを運用',
    'Unified model gateway': '統合モデルゲートウェイ',
    'Serve different model protocols and upstream services through one compatible interface.':
      '1 つの互換インターフェースで異なるモデルプロトコルと上流サービスを提供します。',
    'Local model access': 'ローカルモデル接続',
    'Connect multi-node vLLM model services and manage model-channel relationships centrally.':
      'マルチノード vLLM モデルサービスに接続し、モデルとチャネルの関係を一元管理します。',
    'Multi-channel intelligent routing':
      'マルチチャネルインテリジェントルーティング',
    'Route requests by group, priority, and availability with automatic failover.':
      'グループ、優先度、可用性に応じてリクエストをルーティングし、自動フェイルオーバーします。',
    'Service status monitoring': 'サービス状態監視',
    'Review 24-hour availability, success rate, response latency, and status timelines.':
      '24 時間の可用性、成功率、応答遅延、状態タイムラインを確認します。',
    'Resource and engine monitoring': 'リソースとエンジンの監視',
    'Track CPU, memory, GPU, vLLM concurrency, queueing, and cache metrics.':
      'CPU、メモリ、GPU、vLLM の同時実行数、キュー、キャッシュ指標を追跡します。',
    'Call analysis and request-path audit': '呼び出し分析とリクエストパス監査',
    'Analyze usage by user, key, and model while retaining auditable request paths.':
      'ユーザー、キー、モデル別に利用状況を分析し、監査可能なリクエストパスを保持します。',
    'Multi-node unified management': 'マルチノード統合管理',
    'Centrally manage distributed model services':
      '分散モデルサービスを一元管理します',
    'Multi-protocol compatible access': 'マルチプロトコル対応アクセス',
    'Reduce application changes through a unified API':
      '統合 API でアプリケーション変更を削減します',
    'Full-link monitoring and analysis': 'エンドツーエンド監視と分析',
    'Understand operations from gateway to inference engine':
      'ゲートウェイから推論エンジンまでの運用状況を把握します',
    'Request-path audit': 'リクエストパス監査',
    'Support troubleshooting and internal governance':
      'トラブルシューティングと内部統制を支援します',
    'Access flow': '接続フロー',
    'A clear path from model resources to governed service':
      'モデルリソースから統制されたサービスへの明確な流れ',
    'Connect resources': 'リソースを接続',
    'Prepare local model nodes or external model services.':
      'ローカルモデルノードまたは外部モデルサービスを準備します。',
    'Configure channels': 'チャネルを設定',
    'Maintain models, groups, credentials, and routing policies.':
      'モデル、グループ、認証情報、ルーティングポリシーを管理します。',
    'Call through one API': '1 つの API で呼び出し',
    'Business systems use model capabilities through a standard API.':
      '業務システムは標準 API でモデル機能を利用します。',
    'Monitor and govern': '監視と統制',
    'Continuously analyze service health, resources, and request paths.':
      'サービスの健全性、リソース、リクエストパスを継続的に分析します。',
    'Keep every model capability reliable for every business scenario':
      'あらゆる業務シナリオでモデル機能の信頼性を維持',
    'Connect, route, monitor, and govern model services through one dependable platform.':
      '信頼できる 1 つのプラットフォームでモデルサービスを接続、ルーティング、監視、統制します。',
    'Available models': '利用可能なモデル',
    'Requests in the last 24 hours': '過去 24 時間のリクエスト',
    'Tokens in the last 24 hours': '過去 24 時間のトークン',
    'Platform call success rate': 'プラットフォーム呼び出し成功率',
    '{{healthy}} / {{total}} services healthy':
      '{{healthy}} / {{total}} サービスが正常',
    'Platform operation overview': 'プラットフォーム運用概要',
    'Retry operation overview': '運用概要を再読み込み',
    'Request trend': 'リクエスト推移',
    'Request trend for the last 24 hours': '過去 24 時間のリクエスト推移',
    'Request trend data': 'リクエスト推移データ',
    'At {{time}}: {{requests}} requests':
      '{{time}}: {{requests}} 件のリクエスト',
    Routed: 'ルーティング済み',
    'Route matched': 'ルート一致',
  },
  ru: {
    'Xingluo model service component': 'Компонент модельного сервиса Xingluo',
    'Unify access, routing, and governance for every model capability':
      'Единый доступ, маршрутизация и управление всеми возможностями моделей',
    'Zhiqing provides internal business applications with unified management for multi-node local models and multi-channel model services, including compatible APIs, stable routing, operational monitoring, and call analysis.':
      'Zhiqing объединяет управление локальными многоузловыми моделями и многоканальными модельными сервисами для внутренних приложений: совместимые API, стабильная маршрутизация, мониторинг и анализ вызовов.',
    'Browse models': 'Просмотреть модели',
    'Core capabilities': 'Ключевые возможности',
    'Operate every model service from one control plane':
      'Управляйте всеми модельными сервисами из единой панели',
    'Unified model gateway': 'Единый шлюз моделей',
    'Serve different model protocols and upstream services through one compatible interface.':
      'Предоставляйте разные протоколы моделей и внешние сервисы через единый совместимый интерфейс.',
    'Local model access': 'Доступ к локальным моделям',
    'Connect multi-node vLLM model services and manage model-channel relationships centrally.':
      'Подключайте многоузловые сервисы vLLM и централизованно управляйте связями моделей и каналов.',
    'Multi-channel intelligent routing':
      'Интеллектуальная многоканальная маршрутизация',
    'Route requests by group, priority, and availability with automatic failover.':
      'Маршрутизируйте запросы по группам, приоритету и доступности с автоматическим переключением.',
    'Service status monitoring': 'Мониторинг состояния сервисов',
    'Review 24-hour availability, success rate, response latency, and status timelines.':
      'Просматривайте доступность, успешность, задержку ответов и хронологию за 24 часа.',
    'Resource and engine monitoring': 'Мониторинг ресурсов и движков',
    'Track CPU, memory, GPU, vLLM concurrency, queueing, and cache metrics.':
      'Отслеживайте CPU, память, GPU, параллелизм vLLM, очереди и метрики кеша.',
    'Call analysis and request-path audit':
      'Анализ вызовов и аудит пути запросов',
    'Analyze usage by user, key, and model while retaining auditable request paths.':
      'Анализируйте использование по пользователю, ключу и модели, сохраняя проверяемые пути запросов.',
    'Multi-node unified management': 'Единое управление многими узлами',
    'Centrally manage distributed model services':
      'Централизованно управляйте распределенными модельными сервисами',
    'Multi-protocol compatible access': 'Совместимый многопротокольный доступ',
    'Reduce application changes through a unified API':
      'Сократите изменения приложений с единым API',
    'Full-link monitoring and analysis': 'Сквозной мониторинг и анализ',
    'Understand operations from gateway to inference engine':
      'Контролируйте работу от шлюза до движка вывода',
    'Request-path audit': 'Аудит пути запросов',
    'Support troubleshooting and internal governance':
      'Поддерживайте диагностику и внутреннее управление',
    'Access flow': 'Поток доступа',
    'A clear path from model resources to governed service':
      'Понятный путь от ресурсов моделей к управляемому сервису',
    'Connect resources': 'Подключить ресурсы',
    'Prepare local model nodes or external model services.':
      'Подготовьте локальные узлы моделей или внешние сервисы моделей.',
    'Configure channels': 'Настроить каналы',
    'Maintain models, groups, credentials, and routing policies.':
      'Ведите модели, группы, учетные данные и политики маршрутизации.',
    'Call through one API': 'Вызов через единый API',
    'Business systems use model capabilities through a standard API.':
      'Бизнес-системы используют возможности моделей через стандартный API.',
    'Monitor and govern': 'Мониторинг и управление',
    'Continuously analyze service health, resources, and request paths.':
      'Постоянно анализируйте состояние сервисов, ресурсы и пути запросов.',
    'Keep every model capability reliable for every business scenario':
      'Надежные возможности моделей для каждого бизнес-сценария',
    'Connect, route, monitor, and govern model services through one dependable platform.':
      'Подключайте, маршрутизируйте, контролируйте и управляйте модельными сервисами на одной надежной платформе.',
    'Available models': 'Доступные модели',
    'Requests in the last 24 hours': 'Запросы за 24 часа',
    'Tokens in the last 24 hours': 'Токены за 24 часа',
    'Platform call success rate': 'Успешность вызовов платформы',
    '{{healthy}} / {{total}} services healthy':
      '{{healthy}} / {{total}} сервисов исправны',
    'Platform operation overview': 'Обзор работы платформы',
    'Retry operation overview': 'Перезагрузить обзор работы платформы',
    'Request trend': 'Динамика запросов',
    'Request trend for the last 24 hours': 'Динамика запросов за 24 часа',
    'Request trend data': 'Данные динамики запросов',
    'At {{time}}: {{requests}} requests': '{{time}}: {{requests}} запросов',
    Routed: 'Маршрутизировано',
    'Route matched': 'Маршрут подобран',
  },
  vi: {
    'Xingluo model service component': 'Thành phần dịch vụ mô hình Xingluo',
    'Unify access, routing, and governance for every model capability':
      'Thống nhất truy cập, điều phối và quản trị mọi năng lực mô hình',
    'Zhiqing provides internal business applications with unified management for multi-node local models and multi-channel model services, including compatible APIs, stable routing, operational monitoring, and call analysis.':
      'Zhiqing quản lý thống nhất mô hình cục bộ đa nút và dịch vụ mô hình đa kênh cho ứng dụng nội bộ, với API tương thích, định tuyến ổn định, giám sát vận hành và phân tích cuộc gọi.',
    'Browse models': 'Xem mô hình',
    'Core capabilities': 'Năng lực cốt lõi',
    'Operate every model service from one control plane':
      'Vận hành mọi dịch vụ mô hình từ một mặt phẳng điều khiển',
    'Unified model gateway': 'Cổng mô hình thống nhất',
    'Serve different model protocols and upstream services through one compatible interface.':
      'Cung cấp các giao thức mô hình và dịch vụ thượng nguồn qua một giao diện tương thích.',
    'Local model access': 'Truy cập mô hình cục bộ',
    'Connect multi-node vLLM model services and manage model-channel relationships centrally.':
      'Kết nối dịch vụ mô hình vLLM đa nút và quản lý tập trung quan hệ mô hình-kênh.',
    'Multi-channel intelligent routing': 'Điều phối thông minh đa kênh',
    'Route requests by group, priority, and availability with automatic failover.':
      'Điều phối yêu cầu theo nhóm, ưu tiên và tính khả dụng, với chuyển đổi dự phòng tự động.',
    'Service status monitoring': 'Giám sát trạng thái dịch vụ',
    'Review 24-hour availability, success rate, response latency, and status timelines.':
      'Xem tính khả dụng, tỷ lệ thành công, độ trễ phản hồi và dòng thời gian trạng thái trong 24 giờ.',
    'Resource and engine monitoring': 'Giám sát tài nguyên và động cơ',
    'Track CPU, memory, GPU, vLLM concurrency, queueing, and cache metrics.':
      'Theo dõi CPU, bộ nhớ, GPU, mức đồng thời vLLM, hàng đợi và chỉ số bộ nhớ đệm.',
    'Call analysis and request-path audit':
      'Phân tích cuộc gọi và kiểm toán đường dẫn yêu cầu',
    'Analyze usage by user, key, and model while retaining auditable request paths.':
      'Phân tích mức sử dụng theo người dùng, khóa và mô hình, đồng thời giữ lại đường dẫn yêu cầu có thể kiểm toán.',
    'Multi-node unified management': 'Quản lý thống nhất đa nút',
    'Centrally manage distributed model services':
      'Quản lý tập trung các dịch vụ mô hình phân tán',
    'Multi-protocol compatible access': 'Truy cập tương thích đa giao thức',
    'Reduce application changes through a unified API':
      'Giảm thay đổi ứng dụng qua API thống nhất',
    'Full-link monitoring and analysis': 'Giám sát và phân tích toàn tuyến',
    'Understand operations from gateway to inference engine':
      'Hiểu vận hành từ gateway đến động cơ suy luận',
    'Request-path audit': 'Kiểm toán đường dẫn yêu cầu',
    'Support troubleshooting and internal governance':
      'Hỗ trợ xử lý sự cố và quản trị nội bộ',
    'Access flow': 'Quy trình truy cập',
    'A clear path from model resources to governed service':
      'Lộ trình rõ ràng từ tài nguyên mô hình đến dịch vụ được quản trị',
    'Connect resources': 'Kết nối tài nguyên',
    'Prepare local model nodes or external model services.':
      'Chuẩn bị các nút mô hình cục bộ hoặc dịch vụ mô hình bên ngoài.',
    'Configure channels': 'Cấu hình kênh',
    'Maintain models, groups, credentials, and routing policies.':
      'Duy trì mô hình, nhóm, thông tin xác thực và chính sách điều phối.',
    'Call through one API': 'Gọi qua một API',
    'Business systems use model capabilities through a standard API.':
      'Hệ thống nghiệp vụ sử dụng năng lực mô hình qua API chuẩn.',
    'Monitor and govern': 'Giám sát và quản trị',
    'Continuously analyze service health, resources, and request paths.':
      'Liên tục phân tích sức khỏe dịch vụ, tài nguyên và đường dẫn yêu cầu.',
    'Keep every model capability reliable for every business scenario':
      'Đảm bảo năng lực mô hình đáng tin cậy cho mọi tình huống kinh doanh',
    'Connect, route, monitor, and govern model services through one dependable platform.':
      'Kết nối, định tuyến, giám sát và quản trị dịch vụ mô hình trên một nền tảng đáng tin cậy.',
    'Available models': 'Mô hình khả dụng',
    'Requests in the last 24 hours': 'Yêu cầu trong 24 giờ qua',
    'Tokens in the last 24 hours': 'Token trong 24 giờ qua',
    'Platform call success rate': 'Tỷ lệ gọi thành công của nền tảng',
    '{{healthy}} / {{total}} services healthy':
      '{{healthy}} / {{total}} dịch vụ hoạt động tốt',
    'Platform operation overview': 'Tổng quan vận hành nền tảng',
    'Retry operation overview': 'Tải lại tổng quan vận hành',
    'Request trend': 'Xu hướng yêu cầu',
    'Request trend for the last 24 hours': 'Xu hướng yêu cầu trong 24 giờ qua',
    'Request trend data': 'Dữ liệu xu hướng yêu cầu',
    'At {{time}}: {{requests}} requests': '{{time}}: {{requests}} yêu cầu',
    Routed: 'Đã định tuyến',
    'Route matched': 'Đã khớp tuyến',
  },
}

const marketplaceEnglishKeys = [
  'API Debug Assistant',
  'API service',
  'Algorithm Square',
  'Analyze API requests, responses, and logs to identify likely integration failures.',
  'Answer questions against internal materials with traceable source references.',
  'Audio files',
  'Audio or transcript',
  'Capability catalog',
  'Capability tags',
  'Categories',
  'Convert recorded meetings and business audio into timestamped text.',
  'Create semantic vectors for retrieval, clustering, and knowledge base indexing.',
  'Data Analysis Report',
  'Data Intelligence',
  'Data Productivity',
  'Developer Tools',
  'Diagnosis and remediation steps',
  'Discover ready-to-use workflows that combine models, algorithms, and business prompts.',
  'Document Image OCR',
  'Document Intelligence',
  'Document Productivity',
  'Document Summary',
  'Document images',
  'Documents and images',
  'Documents and instructions',
  'Explore reusable algorithm services for document, speech, and data processing.',
  'Extract key findings, conclusions, and action items from long business documents.',
  'Generate clear Mandarin speech for assistants, broadcasts, and digital humans.',
  'Generate, explain, and optimize SQL from business questions and database schemas.',
  'Grounded answer with citations',
  'Insights and report outline',
  'Knowledge Base Q&A',
  'Knowledge Services',
  'Markdown and structured data',
  'Meeting Minutes',
  'MinerU Document Parsing',
  'Mock data',
  'No matching capabilities',
  'Office Productivity',
  'OpenAI-compatible API',
  'Organize meeting transcripts into topics, decisions, owners, and follow-up actions.',
  'Parse PDF, Word, PowerPoint, images, and spreadsheets into structured Markdown.',
  'Query and passages',
  'Question and database schema',
  'Question and knowledge base',
  'Recognize Chinese and English text while preserving blocks, tables, and reading order.',
  'Relevance scores',
  'Request, response, and logs',
  'Rerank retrieved passages by relevance to improve grounded answer quality.',
  'SQL Copilot',
  'SQL and explanation',
  'Search algorithms by name, category, or tag...',
  'Search skills by name, scenario, or tag...',
  'Skills Square',
  'Speech Intelligence',
  'Speech Recognition',
  'Speech Synthesis',
  'Speech audio',
  'Streaming API',
  'Structured meeting minutes',
  'Structured summary',
  'Tables and analysis goals',
  'Text Embedding',
  'Text Reranking',
  'Text and layout data',
  'This is preview data. Access instructions and live availability will be connected later.',
  'Timestamped transcript',
  'Try another keyword or category.',
  'Turn tables and metric data into concise findings, trends, and management summaries.',
  'Vector embeddings',
  'Workflow',
  '{{count}} capabilities',
]

const marketplaceEnglish = Object.fromEntries(
  marketplaceEnglishKeys.map((key) => [key, key])
)

const marketplaceChinese = {
  'API Debug Assistant': 'API 调试助手',
  'API service': 'API 服务',
  'Algorithm Square': '算法广场',
  'Analyze API requests, responses, and logs to identify likely integration failures.':
    '分析 API 请求、响应与日志，定位可能的集成故障。',
  'Answer questions against internal materials with traceable source references.':
    '基于内部资料回答问题，并提供可追溯的来源引用。',
  'Audio files': '音频文件',
  'Audio or transcript': '音频或转写文本',
  'Capability catalog': '能力目录',
  'Capability tags': '能力标签',
  Categories: '分类',
  'Convert recorded meetings and business audio into timestamped text.':
    '将会议录音和业务音频转换为带时间戳的文本。',
  'Create semantic vectors for retrieval, clustering, and knowledge base indexing.':
    '生成用于检索、聚类和知识库索引的语义向量。',
  'Data Analysis Report': '数据分析报告',
  'Data Intelligence': '数据智能',
  'Data Productivity': '数据生产力',
  'Developer Tools': '开发工具',
  'Diagnosis and remediation steps': '诊断结果与修复步骤',
  'Discover ready-to-use workflows that combine models, algorithms, and business prompts.':
    '发现由模型、算法和业务提示词组合而成的开箱即用工作流。',
  'Document Image OCR': '文档图像 OCR',
  'Document Intelligence': '文档智能',
  'Document Productivity': '文档生产力',
  'Document Summary': '文档摘要',
  'Document images': '文档图像',
  'Documents and images': '文档与图像',
  'Documents and instructions': '文档与处理要求',
  'Explore reusable algorithm services for document, speech, and data processing.':
    '浏览面向文档、语音和数据处理的可复用算法服务。',
  'Extract key findings, conclusions, and action items from long business documents.':
    '从长篇业务文档中提取核心发现、结论和行动项。',
  'Generate clear Mandarin speech for assistants, broadcasts, and digital humans.':
    '为助手、播报和数字人生成清晰的普通话语音。',
  'Generate, explain, and optimize SQL from business questions and database schemas.':
    '根据业务问题和数据库结构生成、解释并优化 SQL。',
  'Grounded answer with citations': '带引用的可信回答',
  'Insights and report outline': '分析洞察与报告提纲',
  'Knowledge Base Q&A': '知识库问答',
  'Knowledge Services': '知识服务',
  'Markdown and structured data': 'Markdown 与结构化数据',
  'Meeting Minutes': '会议纪要',
  'MinerU Document Parsing': 'MinerU 文档解析',
  'Mock data': '模拟数据',
  'No matching capabilities': '没有匹配的能力',
  'Office Productivity': '办公生产力',
  'OpenAI-compatible API': 'OpenAI 兼容 API',
  'Organize meeting transcripts into topics, decisions, owners, and follow-up actions.':
    '将会议转写整理为议题、决策、负责人和后续行动。',
  'Parse PDF, Word, PowerPoint, images, and spreadsheets into structured Markdown.':
    '将 PDF、Word、PowerPoint、图像和表格解析为结构化 Markdown。',
  'Query and passages': '查询与候选段落',
  'Question and database schema': '问题与数据库结构',
  'Question and knowledge base': '问题与知识库',
  'Recognize Chinese and English text while preserving blocks, tables, and reading order.':
    '识别中英文文本，并保留区块、表格和阅读顺序。',
  'Relevance scores': '相关性评分',
  'Request, response, and logs': '请求、响应与日志',
  'Rerank retrieved passages by relevance to improve grounded answer quality.':
    '按相关性重排检索段落，提高有依据回答的质量。',
  'SQL Copilot': 'SQL 助手',
  'SQL and explanation': 'SQL 与说明',
  'Search algorithms by name, category, or tag...':
    '按名称、分类或标签搜索算法...',
  'Search skills by name, scenario, or tag...':
    '按名称、场景或标签搜索 Skills...',
  'Skills Square': 'Skills 广场',
  'Speech Intelligence': '语音智能',
  'Speech Recognition': '语音识别',
  'Speech Synthesis': '语音合成',
  'Speech audio': '语音音频',
  'Streaming API': '流式 API',
  'Structured meeting minutes': '结构化会议纪要',
  'Structured summary': '结构化摘要',
  'Tables and analysis goals': '表格与分析目标',
  'Text Embedding': '文本向量化',
  'Text Reranking': '文本重排序',
  'Text and layout data': '文本与版面数据',
  'This is preview data. Access instructions and live availability will be connected later.':
    '当前展示为预览数据，后续将接入调用说明和实时可用状态。',
  'Timestamped transcript': '带时间戳的转写文本',
  'Try another keyword or category.': '请尝试其他关键词或分类。',
  'Turn tables and metric data into concise findings, trends, and management summaries.':
    '将表格和指标数据转化为简明发现、趋势与管理摘要。',
  'Vector embeddings': '向量数据',
  Workflow: '工作流',
  '{{count}} capabilities': '{{count}} 项能力',
}

const algorithmServiceKeys = {
  en: {
    'Algorithm Services': 'Algorithm Services',
    'Add algorithm service': 'Add algorithm service',
    'Edit algorithm service': 'Edit algorithm service',
    'Import an OpenAPI operation and expose it through the unified algorithm endpoint.':
      'Import an OpenAPI operation and expose it through the unified algorithm endpoint.',
    'OpenAPI URL': 'OpenAPI URL',
    'Import OpenAPI': 'Import OpenAPI',
    'OpenAPI operation': 'OpenAPI operation',
    'Select an operation': 'Select an operation',
    'Algorithm identifier': 'Algorithm identifier',
    'Operation path': 'Operation path',
    'Price per call': 'Price per call',
    'Timeout (seconds)': 'Timeout (seconds)',
    'Disabled algorithms cannot be invoked or shown in Algorithm Square.':
      'Disabled algorithms cannot be invoked or shown in Algorithm Square.',
    'Algorithm service saved': 'Algorithm service saved',
    'No algorithm services configured': 'No algorithm services configured',
    'Delete this algorithm service?': 'Delete this algorithm service?',
    'OpenAPI response': 'OpenAPI response',
    'Unified algorithm API': 'Unified algorithm API',
    'Test algorithm service': 'Test algorithm service',
    'Algorithm service not found': 'Algorithm service not found',
    'Use service default': 'Use service default',
    'Comma-separated values': 'Comma-separated values',
    'No request fields were found in the OpenAPI schema.':
      'No request fields were found in the OpenAPI schema.',
    'Run test': 'Run test',
    'Form Data': 'Form Data',
    'URL Encoded': 'URL Encoded',
    'JSON request body': 'JSON request body',
    'Request body must be valid JSON': 'Request body must be valid JSON',
    'Parameter name': 'Parameter name',
    'Parameter value': 'Parameter value',
    'Remove field': 'Remove field',
    'Add field': 'Add field',
    'Send request': 'Send request',
    'Invocation guide': 'Invocation guide',
    'Request content type': 'Request content type',
    Timeout: 'Timeout',
    '{{seconds}} seconds': '{{seconds}} seconds',
    'Capability information': 'Capability information',
    Method: 'Method',
    Optional: 'Optional',
    'Unified endpoint': 'Unified endpoint',
    'The unified endpoint forwards the request to the configured algorithm service.':
      'The unified endpoint forwards the request to the configured algorithm service.',
    'Use an API key created in API Keys.':
      'Use an API key created in API Keys.',
    'The upstream response is returned with its original status code and content type.':
      'The upstream response is returned with its original status code and content type.',
    'Algorithm not found': 'Algorithm not found',
    'The algorithm may have been disabled or removed.':
      'The algorithm may have been disabled or removed.',
    'Back to Algorithm Square': 'Back to Algorithm Square',
    'No description': 'No description',
    'Free of charge': 'Free of charge',
  },
  zh: {
    'Algorithm Services': '算法服务',
    'Add algorithm service': '添加算法服务',
    'Edit algorithm service': '编辑算法服务',
    'Import an OpenAPI operation and expose it through the unified algorithm endpoint.':
      '导入 OpenAPI 操作，并通过统一算法接口对外提供服务。',
    'OpenAPI URL': 'OpenAPI 地址',
    'Import OpenAPI': '导入 OpenAPI',
    'OpenAPI operation': 'OpenAPI 操作',
    'Select an operation': '选择一个操作',
    'Algorithm identifier': '算法标识',
    'Operation path': '操作路径',
    'Price per call': '单次调用价格',
    'Timeout (seconds)': '超时时间（秒）',
    'Disabled algorithms cannot be invoked or shown in Algorithm Square.':
      '禁用后将无法调用，也不会显示在算法广场中。',
    'Algorithm service saved': '算法服务已保存',
    'No algorithm services configured': '暂无算法服务配置',
    'Delete this algorithm service?': '确定删除这个算法服务吗？',
    'OpenAPI response': 'OpenAPI 响应',
    'Unified algorithm API': '统一算法 API',
    'Test algorithm service': '测试算法服务',
    'Algorithm service not found': '未找到算法服务',
    'Use service default': '使用服务默认值',
    'Comma-separated values': '多个值请用逗号分隔',
    'No request fields were found in the OpenAPI schema.':
      'OpenAPI 请求结构中没有可用字段。',
    'Run test': '开始测试',
    'Form Data': '表单数据',
    'URL Encoded': 'URL 编码',
    'JSON request body': 'JSON 请求体',
    'Request body must be valid JSON': '请求体必须是有效的 JSON',
    'Parameter name': '参数名',
    'Parameter value': '参数值',
    'Remove field': '删除字段',
    'Add field': '添加字段',
    'Send request': '发送请求',
    'Invocation guide': '调用方式',
    'Request content type': '请求内容类型',
    Timeout: '超时时间',
    '{{seconds}} seconds': '{{seconds}} 秒',
    'Capability information': '能力信息',
    Method: '请求方法',
    Optional: '可选',
    'Unified endpoint': '统一调用地址',
    'The unified endpoint forwards the request to the configured algorithm service.':
      '平台通过统一入口完成鉴权、计费，并将请求转发到已配置的算法服务。',
    'Use an API key created in API Keys.': '请使用在 API 密钥页面创建的密钥。',
    'The upstream response is returned with its original status code and content type.':
      '上游响应将保留原状态码和内容类型返回。',
    'Algorithm not found': '未找到算法',
    'The algorithm may have been disabled or removed.':
      '该算法可能已被禁用或删除。',
    'Back to Algorithm Square': '返回算法广场',
    'No description': '暂无说明',
    'Free of charge': '免费',
  },
  'zh-TW': {
    'Algorithm Services': '演算法服務',
    'Add algorithm service': '新增演算法服務',
    'Edit algorithm service': '編輯演算法服務',
    'Import an OpenAPI operation and expose it through the unified algorithm endpoint.':
      '匯入 OpenAPI 操作，並透過統一演算法介面提供服務。',
    'OpenAPI URL': 'OpenAPI 位址',
    'Import OpenAPI': '匯入 OpenAPI',
    'OpenAPI operation': 'OpenAPI 操作',
    'Select an operation': '選擇一個操作',
    'Algorithm identifier': '演算法識別碼',
    'Operation path': '操作路徑',
    'Price per call': '單次呼叫價格',
    'Timeout (seconds)': '逾時時間（秒）',
    'Disabled algorithms cannot be invoked or shown in Algorithm Square.':
      '停用後將無法呼叫，也不會顯示於演算法廣場。',
    'Algorithm service saved': '演算法服務已儲存',
    'No algorithm services configured': '尚未設定演算法服務',
    'Delete this algorithm service?': '確定刪除此演算法服務嗎？',
    'OpenAPI response': 'OpenAPI 回應',
    'Unified algorithm API': '統一演算法 API',
    'Test algorithm service': '測試演算法服務',
    'Algorithm service not found': '找不到演算法服務',
    'Use service default': '使用服務預設值',
    'Comma-separated values': '多個值請以逗號分隔',
    'No request fields were found in the OpenAPI schema.':
      'OpenAPI 請求結構中沒有可用欄位。',
    'Run test': '開始測試',
    'Form Data': '表單資料',
    'URL Encoded': 'URL 編碼',
    'JSON request body': 'JSON 請求本文',
    'Request body must be valid JSON': '請求本文必須是有效的 JSON',
    'Parameter name': '參數名稱',
    'Parameter value': '參數值',
    'Remove field': '刪除欄位',
    'Add field': '新增欄位',
    'Send request': '傳送請求',
    'Invocation guide': '呼叫方式',
    'Request content type': '請求內容類型',
    Timeout: '逾時時間',
    '{{seconds}} seconds': '{{seconds}} 秒',
    'Capability information': '能力資訊',
    Method: '請求方法',
    Optional: '選填',
    'Unified endpoint': '統一呼叫位址',
    'The unified endpoint forwards the request to the configured algorithm service.':
      '平台透過統一入口完成驗證、計費，並將請求轉送至已設定的演算法服務。',
    'Use an API key created in API Keys.': '請使用在 API 金鑰頁面建立的金鑰。',
    'The upstream response is returned with its original status code and content type.':
      '上游回應將保留原始狀態碼與內容類型。',
    'Algorithm not found': '找不到演算法',
    'The algorithm may have been disabled or removed.':
      '此演算法可能已停用或移除。',
    'Back to Algorithm Square': '返回演算法廣場',
    'No description': '暫無說明',
    'Free of charge': '免費',
  },
  fr: {
    'Algorithm Services': 'Services algorithmiques',
    'Add algorithm service': 'Ajouter un service algorithmique',
    'Edit algorithm service': 'Modifier le service algorithmique',
    'Import an OpenAPI operation and expose it through the unified algorithm endpoint.':
      "Importez une operation OpenAPI et exposez-la via le point d'acces algorithmique unifie.",
    'OpenAPI URL': 'URL OpenAPI',
    'Import OpenAPI': 'Importer OpenAPI',
    'OpenAPI operation': 'Operation OpenAPI',
    'Select an operation': 'Selectionner une operation',
    'Algorithm identifier': "Identifiant de l'algorithme",
    'Operation path': "Chemin de l'operation",
    'Price per call': 'Prix par appel',
    'Timeout (seconds)': "Delai d'attente (secondes)",
    'Disabled algorithms cannot be invoked or shown in Algorithm Square.':
      'Les algorithmes desactives ne peuvent pas etre appeles ni affiches.',
    'Algorithm service saved': 'Service algorithmique enregistre',
    'No algorithm services configured': 'Aucun service algorithmique configure',
    'Delete this algorithm service?': 'Supprimer ce service algorithmique ?',
    'OpenAPI response': 'Reponse OpenAPI',
    'Unified algorithm API': 'API algorithmique unifiee',
    'Test algorithm service': 'Tester le service algorithmique',
    'Algorithm service not found': 'Service algorithmique introuvable',
    'Use service default': 'Utiliser la valeur par defaut',
    'Comma-separated values': 'Valeurs separees par des virgules',
    'No request fields were found in the OpenAPI schema.':
      'Aucun champ de requete trouve dans le schema OpenAPI.',
    'Run test': 'Lancer le test',
    'Form Data': 'Donnees de formulaire',
    'URL Encoded': 'Encode URL',
    'JSON request body': 'Corps de requete JSON',
    'Request body must be valid JSON':
      'Le corps de la requete doit etre un JSON valide',
    'Parameter name': 'Nom du parametre',
    'Parameter value': 'Valeur du parametre',
    'Remove field': 'Supprimer le champ',
    'Add field': 'Ajouter un champ',
    'Send request': 'Envoyer la requete',
    'Invocation guide': "Guide d'appel",
    'Request content type': 'Type de contenu de la requete',
    Timeout: "Delai d'attente",
    '{{seconds}} seconds': '{{seconds}} secondes',
    'Capability information': 'Informations de capacite',
    Method: 'Methode',
    Optional: 'Facultatif',
    'Unified endpoint': "Point d'acces unifie",
    'The unified endpoint forwards the request to the configured algorithm service.':
      "Le point d'acces unifie transfere la requete au service algorithmique configure.",
    'Use an API key created in API Keys.':
      'Utilisez une cle API creee dans Cles API.',
    'The upstream response is returned with its original status code and content type.':
      "La reponse amont conserve son code d'etat et son type de contenu.",
    'Algorithm not found': 'Algorithme introuvable',
    'The algorithm may have been disabled or removed.':
      "L'algorithme a peut-etre ete desactive ou supprime.",
    'Back to Algorithm Square': 'Retour au catalogue des algorithmes',
    'No description': 'Aucune description',
    'Free of charge': 'Gratuit',
  },
  ja: {
    'Algorithm Services': 'アルゴリズムサービス',
    'Add algorithm service': 'アルゴリズムサービスを追加',
    'Edit algorithm service': 'アルゴリズムサービスを編集',
    'Import an OpenAPI operation and expose it through the unified algorithm endpoint.':
      'OpenAPI 操作をインポートし、統一アルゴリズムエンドポイントで公開します。',
    'OpenAPI URL': 'OpenAPI の URL',
    'Import OpenAPI': 'OpenAPI をインポート',
    'OpenAPI operation': 'OpenAPI 操作',
    'Select an operation': '操作を選択',
    'Algorithm identifier': 'アルゴリズム識別子',
    'Operation path': '操作パス',
    'Price per call': '1回あたりの価格',
    'Timeout (seconds)': 'タイムアウト（秒）',
    'Disabled algorithms cannot be invoked or shown in Algorithm Square.':
      '無効なアルゴリズムは呼び出せず、アルゴリズム広場にも表示されません。',
    'Algorithm service saved': 'アルゴリズムサービスを保存しました',
    'No algorithm services configured':
      'アルゴリズムサービスが設定されていません',
    'Delete this algorithm service?':
      'このアルゴリズムサービスを削除しますか？',
    'OpenAPI response': 'OpenAPI レスポンス',
    'Unified algorithm API': '統一アルゴリズム API',
    'Test algorithm service': 'アルゴリズムサービスをテスト',
    'Algorithm service not found': 'アルゴリズムサービスが見つかりません',
    'Use service default': 'サービスのデフォルト値を使用',
    'Comma-separated values': 'カンマ区切りの値',
    'No request fields were found in the OpenAPI schema.':
      'OpenAPI スキーマにリクエストフィールドがありません。',
    'Run test': 'テストを実行',
    'Form Data': 'フォームデータ',
    'URL Encoded': 'URL エンコード',
    'JSON request body': 'JSON リクエスト本文',
    'Request body must be valid JSON':
      'リクエスト本文は有効な JSON である必要があります',
    'Parameter name': 'パラメーター名',
    'Parameter value': 'パラメーター値',
    'Remove field': 'フィールドを削除',
    'Add field': 'フィールドを追加',
    'Send request': 'リクエストを送信',
    'Invocation guide': '呼び出し方法',
    'Request content type': 'リクエストコンテンツタイプ',
    Timeout: 'タイムアウト',
    '{{seconds}} seconds': '{{seconds}} 秒',
    'Capability information': '機能情報',
    Method: 'メソッド',
    Optional: '任意',
    'Unified endpoint': '統一エンドポイント',
    'The unified endpoint forwards the request to the configured algorithm service.':
      '統一エンドポイントは、設定済みのアルゴリズムサービスにリクエストを転送します。',
    'Use an API key created in API Keys.':
      'API キーページで作成したキーを使用してください。',
    'The upstream response is returned with its original status code and content type.':
      '上流のレスポンスは元のステータスコードとコンテンツタイプで返されます。',
    'Algorithm not found': 'アルゴリズムが見つかりません',
    'The algorithm may have been disabled or removed.':
      'アルゴリズムが無効化または削除された可能性があります。',
    'Back to Algorithm Square': 'アルゴリズム広場に戻る',
    'No description': '説明はありません',
    'Free of charge': '無料',
  },
  ru: {
    'Algorithm Services': 'Алгоритмические сервисы',
    'Add algorithm service': 'Добавить алгоритмический сервис',
    'Edit algorithm service': 'Изменить алгоритмический сервис',
    'Import an OpenAPI operation and expose it through the unified algorithm endpoint.':
      'Импортируйте операцию OpenAPI и опубликуйте ее через единый endpoint алгоритмов.',
    'OpenAPI URL': 'URL OpenAPI',
    'Import OpenAPI': 'Импортировать OpenAPI',
    'OpenAPI operation': 'Операция OpenAPI',
    'Select an operation': 'Выберите операцию',
    'Algorithm identifier': 'Идентификатор алгоритма',
    'Operation path': 'Путь операции',
    'Price per call': 'Цена за вызов',
    'Timeout (seconds)': 'Тайм-аут (секунды)',
    'Disabled algorithms cannot be invoked or shown in Algorithm Square.':
      'Отключенные алгоритмы нельзя вызывать, и они не отображаются в каталоге.',
    'Algorithm service saved': 'Алгоритмический сервис сохранен',
    'No algorithm services configured': 'Алгоритмические сервисы не настроены',
    'Delete this algorithm service?': 'Удалить этот алгоритмический сервис?',
    'OpenAPI response': 'Ответ OpenAPI',
    'Unified algorithm API': 'Единый API алгоритмов',
    'Test algorithm service': 'Тест алгоритмического сервиса',
    'Algorithm service not found': 'Алгоритмический сервис не найден',
    'Use service default': 'Использовать значение сервиса по умолчанию',
    'Comma-separated values': 'Значения через запятую',
    'No request fields were found in the OpenAPI schema.':
      'В схеме OpenAPI не найдены поля запроса.',
    'Run test': 'Запустить тест',
    'Form Data': 'Данные формы',
    'URL Encoded': 'URL-кодирование',
    'JSON request body': 'Тело JSON-запроса',
    'Request body must be valid JSON':
      'Тело запроса должно содержать корректный JSON',
    'Parameter name': 'Имя параметра',
    'Parameter value': 'Значение параметра',
    'Remove field': 'Удалить поле',
    'Add field': 'Добавить поле',
    'Send request': 'Отправить запрос',
    'Invocation guide': 'Способ вызова',
    'Request content type': 'Тип содержимого запроса',
    Timeout: 'Тайм-аут',
    '{{seconds}} seconds': '{{seconds}} сек.',
    'Capability information': 'Сведения о возможности',
    Method: 'Метод',
    Optional: 'Необязательно',
    'Unified endpoint': 'Единая точка доступа',
    'The unified endpoint forwards the request to the configured algorithm service.':
      'Единая точка доступа перенаправляет запрос настроенному алгоритмическому сервису.',
    'Use an API key created in API Keys.':
      'Используйте ключ, созданный на странице API-ключей.',
    'The upstream response is returned with its original status code and content type.':
      'Ответ сервиса возвращается с исходным кодом состояния и типом содержимого.',
    'Algorithm not found': 'Алгоритм не найден',
    'The algorithm may have been disabled or removed.':
      'Алгоритм мог быть отключен или удален.',
    'Back to Algorithm Square': 'Назад к алгоритмам',
    'No description': 'Нет описания',
    'Free of charge': 'Бесплатно',
  },
  vi: {
    'Algorithm Services': 'Dich vu thuat toan',
    'Add algorithm service': 'Them dich vu thuat toan',
    'Edit algorithm service': 'Sua dich vu thuat toan',
    'Import an OpenAPI operation and expose it through the unified algorithm endpoint.':
      'Nhap thao tac OpenAPI va cung cap qua diem cuoi thuat toan thong nhat.',
    'OpenAPI URL': 'URL OpenAPI',
    'Import OpenAPI': 'Nhap OpenAPI',
    'OpenAPI operation': 'Thao tac OpenAPI',
    'Select an operation': 'Chon mot thao tac',
    'Algorithm identifier': 'Ma thuat toan',
    'Operation path': 'Duong dan thao tac',
    'Price per call': 'Gia moi lan goi',
    'Timeout (seconds)': 'Thoi gian cho (giay)',
    'Disabled algorithms cannot be invoked or shown in Algorithm Square.':
      'Thuat toan bi tat khong the goi va khong hien thi trong danh muc.',
    'Algorithm service saved': 'Da luu dich vu thuat toan',
    'No algorithm services configured': 'Chua cau hinh dich vu thuat toan',
    'Delete this algorithm service?': 'Xoa dich vu thuat toan nay?',
    'OpenAPI response': 'Phan hoi OpenAPI',
    'Unified algorithm API': 'API thuat toan thong nhat',
    'Test algorithm service': 'Kiem tra dich vu thuat toan',
    'Algorithm service not found': 'Khong tim thay dich vu thuat toan',
    'Use service default': 'Dung gia tri mac dinh cua dich vu',
    'Comma-separated values': 'Cac gia tri cach nhau bang dau phay',
    'No request fields were found in the OpenAPI schema.':
      'Khong tim thay truong yeu cau trong luoc do OpenAPI.',
    'Run test': 'Chay kiem tra',
    'Form Data': 'Du lieu bieu mau',
    'URL Encoded': 'Ma hoa URL',
    'JSON request body': 'Noi dung yeu cau JSON',
    'Request body must be valid JSON': 'Noi dung yeu cau phai la JSON hop le',
    'Parameter name': 'Ten tham so',
    'Parameter value': 'Gia tri tham so',
    'Remove field': 'Xoa truong',
    'Add field': 'Them truong',
    'Send request': 'Gui yeu cau',
    'Invocation guide': 'Huong dan goi',
    'Request content type': 'Loai noi dung yeu cau',
    Timeout: 'Thoi gian cho',
    '{{seconds}} seconds': '{{seconds}} giay',
    'Capability information': 'Thong tin kha nang',
    Method: 'Phuong thuc',
    Optional: 'Tuy chon',
    'Unified endpoint': 'Diem cuoi thong nhat',
    'The unified endpoint forwards the request to the configured algorithm service.':
      'Diem cuoi thong nhat chuyen yeu cau den dich vu thuat toan da cau hinh.',
    'Use an API key created in API Keys.':
      'Su dung khoa duoc tao trong trang Khoa API.',
    'The upstream response is returned with its original status code and content type.':
      'Phan hoi thuong nguon giu nguyen ma trang thai va loai noi dung.',
    'Algorithm not found': 'Khong tim thay thuat toan',
    'The algorithm may have been disabled or removed.':
      'Thuat toan co the da bi tat hoac xoa.',
    'Back to Algorithm Square': 'Quay lai danh muc thuat toan',
    'No description': 'Khong co mo ta',
    'Free of charge': 'Mien phi',
  },
}

const newKeys = {
  en: {
    ...homepageKeys.en,
    ...algorithmServiceKeys.en,
    ...marketplaceEnglish,
    'preset.xingluo': 'Xingluo',
    'Xingluo Data Field': 'Xingluo Data Field',
    'Zhiqing Model Service Platform': 'Zhiqing Model Service Platform',
    'Average first token latency': 'Average first token latency',
    'Conversation Audit': 'Conversation Audit',
    'Conversation details': 'Conversation details',
    'Conversation ID': 'Conversation ID',
    'Decode speed': 'Decode speed',
    'Engine instances': 'Engine instances',
    'End reason': 'End reason',
    'Filter by API key': 'Filter by API key',
    'Filter token analytics by time range, user, API key, and model.':
      'Filter token analytics by time range, user, API key, and model.',
    'Generation throughput': 'Generation throughput',
    'Generated content': 'Generated content',
    'Health check timed out': 'Health check timed out',
    Interrupted: 'Interrupted',
    'KV cache usage': 'KV cache usage',
    'No vLLM metrics': 'No vLLM metrics',
    'No audit records': 'No audit records',
    'Output response': 'Output response',
    'Output tokens/s': 'Output tokens/s',
    'Prefix cache hit rate': 'Prefix cache hit rate',
    'Running requests': 'Running requests',
    'First response': 'First response',
    'HTTP status': 'HTTP status',
    'Input messages': 'Input messages',
    Messages: 'Messages',
    Records: 'Records',
    'Request parameters': 'Request parameters',
    'Request IP': 'Request IP',
    'Request path': 'Request path',
    'Reasoning content': 'Reasoning content',
    'Started at': 'Started at',
    'Token Analytics Filters': 'Token Analytics Filters',
    'Token Input and Output Trend': 'Token Input and Output Trend',
    'Total Token Trend': 'Total Token Trend',
    'Waiting requests': 'Waiting requests',
    'vLLM engine': 'vLLM engine',
    'vLLM instances': 'vLLM instances',
    'Average call latency': 'Average call latency',
    'Channels requiring attention': 'Channels requiring attention',
    'Current channel and model risks': 'Current channel and model risks',
    'Data as of {{time}}': 'Data as of {{time}}',
    'Failed requests': 'Failed requests',
    'Gateway success rate': 'Gateway success rate',
    'Latest health check within 3 minutes':
      'Latest health check within 3 minutes',
    'Last 15 minutes': 'Last 15 minutes',
    'Low model success rate': 'Low model success rate',
    'Model Service Operations Overview': 'Model Service Operations Overview',
    'Model usage ranking': 'Model usage ranking',
    'No recent health data': 'No recent health data',
    'P95 call latency': 'P95 call latency',
    'Request volume': 'Request volume',
    'Slow channel response': 'Slow channel response',
    'Successful requests': 'Successful requests',
    'Token usage': 'Token usage',
    'Total token usage': 'Total token usage',
    'User usage ranking': 'User usage ranking',
    '{{unavailable}} unavailable, {{unknown}} without data':
      '{{unavailable}} unavailable, {{unknown}} without data',
  },
  zh: {
    ...homepageKeys.zh,
    ...algorithmServiceKeys.zh,
    ...marketplaceChinese,
    'preset.xingluo': '星罗',
    'Xingluo Data Field': '星罗·数场',
    'Zhiqing Model Service Platform': '智擎模型服务平台',
    'Average first token latency': '平均首 Token 延迟',
    'Conversation Audit': '对话审计',
    'Conversation details': '对话详情',
    'Conversation ID': '会话 ID',
    'Decode speed': '解码速度',
    'Engine instances': '引擎实例',
    'End reason': '结束原因',
    'Filter by API key': '按 API 密钥筛选',
    'Filter token analytics by time range, user, API key, and model.':
      '按时间范围、用户、API 密钥和模型筛选 Token 统计。',
    'Generation throughput': '生成吞吐',
    'Generated content': '已生成内容',
    'Health check timed out': '健康检查超时',
    Interrupted: '已中断',
    'KV cache usage': 'KV Cache 使用率',
    'No vLLM metrics': '暂无 vLLM 指标',
    'No audit records': '暂无审计记录',
    'Output response': '输出响应',
    'Output tokens/s': '输出 Token/s',
    'Prefix cache hit rate': '前缀缓存命中率',
    'Running requests': '运行中请求',
    'First response': '首响应',
    'HTTP status': 'HTTP 状态',
    'Input messages': '输入消息',
    Messages: '消息内容',
    Records: '条记录',
    'Request parameters': '请求参数',
    'Request IP': '请求 IP',
    'Request path': '请求路径',
    'Reasoning content': '思考内容',
    'Started at': '开始时间',
    'Token Analytics Filters': 'Token 统计筛选',
    'Token Input and Output Trend': '输入与输出 Token 趋势',
    'Total Token Trend': '总 Token 趋势',
    'Waiting requests': '排队请求',
    'vLLM engine': 'vLLM 引擎',
    'vLLM instances': 'vLLM 实例',
    'Average call latency': '平均调用耗时',
    'Channels requiring attention': '需关注渠道',
    'Current channel and model risks': '当前渠道与模型风险',
    'Data as of {{time}}': '数据截至 {{time}}',
    'Failed requests': '失败请求',
    'Gateway success rate': '网关调用成功率',
    'Latest health check within 3 minutes': '最近一次健康检查在 3 分钟内',
    'Last 15 minutes': '最近 15 分钟',
    'Low model success rate': '模型成功率低',
    'Model Service Operations Overview': '模型服务运行总览',
    'Model usage ranking': '模型使用排行',
    'No recent health data': '无近期健康检查数据',
    'P95 call latency': 'P95 调用耗时',
    'Request volume': '请求量',
    'Slow channel response': '渠道响应慢',
    'Successful requests': '成功请求',
    'Token usage': 'Token 用量',
    'Total token usage': 'Token 总用量',
    'User usage ranking': '用户使用排行',
    '{{unavailable}} unavailable, {{unknown}} without data':
      '{{unavailable}} 个不可用，{{unknown}} 个无监测数据',
  },
  'zh-TW': {
    ...homepageKeys['zh-TW'],
    ...algorithmServiceKeys['zh-TW'],
    ...marketplaceChinese,
    'preset.xingluo': '星羅',
    'Xingluo Data Field': '星羅·數場',
    'Zhiqing Model Service Platform': '智擎模型服務平台',
    'Filter by API key': '按 API 金鑰篩選',
    'Filter token analytics by time range, user, API key, and model.':
      '按時間範圍、使用者、API 金鑰和模型篩選 Token 統計。',
    'Reasoning content': '思考內容',
    'Request IP': '請求 IP',
    'Request path': '請求路徑',
    'HTTP status': 'HTTP 狀態',
    'Input messages': '輸入訊息',
    'Output response': '輸出回應',
    'Health check timed out': '健康檢查逾時',
    'Token Analytics Filters': 'Token 統計篩選',
    'Token Input and Output Trend': '輸入與輸出 Token 趨勢',
    'Total Token Trend': '總 Token 趨勢',
    'Average call latency': '平均呼叫耗時',
    'Channels requiring attention': '需關注渠道',
    'Current channel and model risks': '目前渠道與模型風險',
    'Data as of {{time}}': '資料截至 {{time}}',
    'Failed requests': '失敗請求',
    'Gateway success rate': '網關呼叫成功率',
    'Latest health check within 3 minutes': '最近一次健康檢查在 3 分鐘內',
    'Last 15 minutes': '最近 15 分鐘',
    'Low model success rate': '模型成功率低',
    'Model Service Operations Overview': '模型服務運行總覽',
    'Model usage ranking': '模型使用排行',
    'No recent health data': '無近期健康檢查資料',
    'P95 call latency': 'P95 呼叫耗時',
    'Request volume': '請求量',
    'Slow channel response': '渠道回應慢',
    'Successful requests': '成功請求',
    'Token usage': 'Token 用量',
    'Total token usage': 'Token 總用量',
    'User usage ranking': '使用者使用排行',
    '{{unavailable}} unavailable, {{unknown}} without data':
      '{{unavailable}} 個不可用，{{unknown}} 個無監測資料',
  },
  fr: {
    ...homepageKeys.fr,
    ...marketplaceTranslations.fr,
    ...algorithmServiceKeys.fr,
    'preset.xingluo': 'Xingluo',
    'Xingluo Data Field': 'Xingluo Data Field',
    'Zhiqing Model Service Platform':
      'Plateforme de services de modèles Zhiqing',
    'Average first token latency': 'Latence moyenne du premier token',
    'Conversation Audit': 'Audit des conversations',
    'Conversation details': 'Details de la conversation',
    'Conversation ID': 'ID de conversation',
    'Decode speed': 'Vitesse de decodage',
    'Engine instances': 'Instances du moteur',
    'End reason': 'Motif de fin',
    'Filter by API key': "Filtrer par cle d'API",
    'Filter token analytics by time range, user, API key, and model.':
      "Filtrer les statistiques de tokens par periode, utilisateur, cle d'API et modele.",
    'Generation throughput': 'Debit de generation',
    'Generated content': 'Contenu genere',
    'Health check timed out': 'Delai de verification depasse',
    Interrupted: 'Interrompu',
    'KV cache usage': 'Utilisation du cache KV',
    'No vLLM metrics': 'Aucune metrique vLLM',
    'No audit records': "Aucun enregistrement d'audit",
    'Output response': 'Reponse de sortie',
    'Output tokens/s': 'Tokens de sortie/s',
    'Prefix cache hit rate': 'Taux de reussite du cache de prefixe',
    'Running requests': 'Requetes en cours',
    'First response': 'Premiere reponse',
    'HTTP status': 'Statut HTTP',
    'Input messages': "Messages d'entree",
    Messages: 'Messages',
    Records: 'Enregistrements',
    'Request parameters': 'Parametres de requete',
    'Request IP': 'IP de requete',
    'Request path': 'Chemin de requete',
    'Reasoning content': 'Contenu du raisonnement',
    'Started at': 'Demarre le',
    'Token Analytics Filters': 'Filtres des statistiques de tokens',
    'Token Input and Output Trend': 'Tendance des tokens en entree et sortie',
    'Total Token Trend': 'Tendance totale des tokens',
    'Waiting requests': 'Requetes en attente',
    'vLLM engine': 'Moteur vLLM',
    'vLLM instances': 'Instances vLLM',
    'Average call latency': "Latence moyenne d'appel",
    'Channels requiring attention': 'Canaux necessitant une attention',
    'Current channel and model risks':
      'Risques actuels lies aux canaux et aux modeles',
    'Data as of {{time}}': 'Donnees au {{time}}',
    'Failed requests': 'Requetes echouees',
    'Gateway success rate': 'Taux de succes de la passerelle',
    'Latest health check within 3 minutes':
      'Dernier controle de sante datant de moins de 3 minutes',
    'Last 15 minutes': '15 dernieres minutes',
    'Low model success rate': 'Faible taux de succes du modele',
    'Model Service Operations Overview': "Vue d'ensemble du service de modeles",
    'Model usage ranking': "Classement d'utilisation des modeles",
    'No recent health data': 'Aucune donnee de sante recente',
    'P95 call latency': "Latence d'appel P95",
    'Request volume': 'Volume de requetes',
    'Slow channel response': 'Reponse lente du canal',
    'Successful requests': 'Requetes reussies',
    'Token usage': 'Utilisation des tokens',
    'Total token usage': 'Utilisation totale des tokens',
    'User usage ranking': "Classement d'utilisation des utilisateurs",
    '{{unavailable}} unavailable, {{unknown}} without data':
      '{{unavailable}} indisponibles, {{unknown}} sans donnees',
  },
  ja: {
    ...homepageKeys.ja,
    ...marketplaceTranslations.ja,
    ...algorithmServiceKeys.ja,
    'preset.xingluo': '星羅',
    'Xingluo Data Field': 'Xingluo Data Field',
    'Zhiqing Model Service Platform': 'Zhiqingモデルサービスプラットフォーム',
    'Average first token latency': '平均初回トークン遅延',
    'Conversation Audit': '会話監査',
    'Conversation details': '会話の詳細',
    'Conversation ID': '会話 ID',
    'Decode speed': 'デコード速度',
    'Engine instances': 'エンジンインスタンス',
    'End reason': '終了理由',
    'Filter by API key': 'API キーで絞り込む',
    'Filter token analytics by time range, user, API key, and model.':
      '期間、ユーザー、API キー、モデルでトークン統計を絞り込みます。',
    'Generation throughput': '生成スループット',
    'Generated content': '生成済みコンテンツ',
    'Health check timed out': 'ヘルスチェックがタイムアウトしました',
    Interrupted: '中断',
    'KV cache usage': 'KV キャッシュ使用率',
    'No vLLM metrics': 'vLLM 指標はありません',
    'No audit records': '監査記録はありません',
    'Output response': '出力レスポンス',
    'Output tokens/s': '出力トークン/秒',
    'Prefix cache hit rate': 'プレフィックスキャッシュヒット率',
    'Running requests': '実行中リクエスト',
    'First response': '最初の応答',
    'HTTP status': 'HTTP ステータス',
    'Input messages': '入力メッセージ',
    Messages: 'メッセージ',
    Records: '件',
    'Request parameters': 'リクエストパラメータ',
    'Request IP': 'リクエスト IP',
    'Request path': 'リクエストパス',
    'Reasoning content': '思考内容',
    'Started at': '開始時刻',
    'Token Analytics Filters': 'トークン統計フィルター',
    'Token Input and Output Trend': '入力・出力トークンの推移',
    'Total Token Trend': 'トークン合計の推移',
    'Waiting requests': '待機中リクエスト',
    'vLLM engine': 'vLLM エンジン',
    'vLLM instances': 'vLLM インスタンス',
    'Average call latency': '平均呼び出し遅延',
    'Channels requiring attention': '注意が必要なチャネル',
    'Current channel and model risks': '現在のチャネルとモデルのリスク',
    'Data as of {{time}}': 'データ時点: {{time}}',
    'Failed requests': '失敗したリクエスト',
    'Gateway success rate': 'ゲートウェイ成功率',
    'Latest health check within 3 minutes': '直近3分以内のヘルスチェック',
    'Last 15 minutes': '直近15分',
    'Low model success rate': 'モデル成功率が低い',
    'Model Service Operations Overview': 'モデルサービス運用概要',
    'Model usage ranking': 'モデル利用ランキング',
    'No recent health data': '最近のヘルスデータなし',
    'P95 call latency': 'P95 呼び出し遅延',
    'Request volume': 'リクエスト量',
    'Slow channel response': 'チャネル応答が遅い',
    'Successful requests': '成功したリクエスト',
    'Token usage': 'トークン使用量',
    'Total token usage': '総トークン使用量',
    'User usage ranking': 'ユーザー利用ランキング',
    '{{unavailable}} unavailable, {{unknown}} without data':
      '{{unavailable}} 件利用不可、{{unknown}} 件データなし',
  },
  ru: {
    ...homepageKeys.ru,
    ...marketplaceTranslations.ru,
    ...algorithmServiceKeys.ru,
    'preset.xingluo': 'Синло',
    'Xingluo Data Field': 'Xingluo Data Field',
    'Zhiqing Model Service Platform': 'Платформа модельных сервисов Zhiqing',
    'Average first token latency': 'Средняя задержка первого токена',
    'Conversation Audit': 'Аудит диалогов',
    'Conversation details': 'Сведения о диалоге',
    'Conversation ID': 'ID диалога',
    'Decode speed': 'Скорость декодирования',
    'Engine instances': 'Экземпляры движка',
    'End reason': 'Причина завершения',
    'Filter by API key': 'Фильтр по API-ключу',
    'Filter token analytics by time range, user, API key, and model.':
      'Фильтруйте статистику токенов по периоду, пользователю, API-ключу и модели.',
    'Generation throughput': 'Пропускная способность генерации',
    'Generated content': 'Созданный контент',
    'Health check timed out': 'Время ожидания проверки истекло',
    Interrupted: 'Прервано',
    'KV cache usage': 'Использование KV-кеша',
    'No vLLM metrics': 'Нет метрик vLLM',
    'No audit records': 'Нет записей аудита',
    'Output response': 'Выходной ответ',
    'Output tokens/s': 'Выходных токенов/с',
    'Prefix cache hit rate': 'Доля попаданий в кеш префиксов',
    'Running requests': 'Выполняемые запросы',
    'First response': 'Первый ответ',
    'HTTP status': 'HTTP-статус',
    'Input messages': 'Входные сообщения',
    Messages: 'Сообщения',
    Records: 'Записи',
    'Request parameters': 'Параметры запроса',
    'Request IP': 'IP запроса',
    'Request path': 'Путь запроса',
    'Reasoning content': 'Содержимое рассуждений',
    'Started at': 'Начато',
    'Token Analytics Filters': 'Фильтры статистики токенов',
    'Token Input and Output Trend': 'Динамика входных и выходных токенов',
    'Total Token Trend': 'Динамика общего числа токенов',
    'Waiting requests': 'Ожидающие запросы',
    'vLLM engine': 'Движок vLLM',
    'vLLM instances': 'Экземпляры vLLM',
    'Average call latency': 'Средняя задержка вызова',
    'Channels requiring attention': 'Каналы, требующие внимания',
    'Current channel and model risks': 'Текущие риски каналов и моделей',
    'Data as of {{time}}': 'Данные на {{time}}',
    'Failed requests': 'Неуспешные запросы',
    'Gateway success rate': 'Успешность шлюза',
    'Latest health check within 3 minutes':
      'Последняя проверка здоровья выполнена в течение 3 минут',
    'Last 15 minutes': 'Последние 15 минут',
    'Low model success rate': 'Низкая успешность модели',
    'Model Service Operations Overview': 'Сводка работы модельного сервиса',
    'Model usage ranking': 'Рейтинг использования моделей',
    'No recent health data': 'Нет свежих данных о здоровье',
    'P95 call latency': 'Задержка вызова P95',
    'Request volume': 'Объем запросов',
    'Slow channel response': 'Медленный ответ канала',
    'Successful requests': 'Успешные запросы',
    'Token usage': 'Использование токенов',
    'Total token usage': 'Общее использование токенов',
    'User usage ranking': 'Рейтинг использования пользователей',
    '{{unavailable}} unavailable, {{unknown}} without data':
      '{{unavailable}} недоступно, {{unknown}} без данных',
  },
  vi: {
    ...homepageKeys.vi,
    ...marketplaceTranslations.vi,
    ...algorithmServiceKeys.vi,
    'preset.xingluo': 'Xingluo',
    'Xingluo Data Field': 'Xingluo Data Field',
    'Zhiqing Model Service Platform': 'Nền tảng dịch vụ mô hình Zhiqing',
    'Average first token latency': 'Do tre token dau tien trung binh',
    'Conversation Audit': 'Kiem toan hoi thoai',
    'Conversation details': 'Chi tiet hoi thoai',
    'Conversation ID': 'ID hoi thoai',
    'Decode speed': 'Toc do giai ma',
    'Engine instances': 'Cac phien ban dong co',
    'End reason': 'Ly do ket thuc',
    'Filter by API key': 'Loc theo khoa API',
    'Filter token analytics by time range, user, API key, and model.':
      'Loc thong ke token theo thoi gian, nguoi dung, khoa API va mo hinh.',
    'Generation throughput': 'Thong luong sinh',
    'Generated content': 'Noi dung da tao',
    'Health check timed out': 'Kiem tra suc khoe het thoi gian',
    Interrupted: 'Da gian doan',
    'KV cache usage': 'Muc su dung bo nho dem KV',
    'No vLLM metrics': 'Khong co chi so vLLM',
    'No audit records': 'Khong co ban ghi kiem toan',
    'Output response': 'Phan hoi dau ra',
    'Output tokens/s': 'Token dau ra/giay',
    'Prefix cache hit rate': 'Ty le trung bo nho dem tien to',
    'Running requests': 'Yeu cau dang chay',
    'First response': 'Phan hoi dau tien',
    'HTTP status': 'Trang thai HTTP',
    'Input messages': 'Tin nhan dau vao',
    Messages: 'Tin nhan',
    Records: 'Ban ghi',
    'Request parameters': 'Tham so yeu cau',
    'Request IP': 'IP yeu cau',
    'Request path': 'Duong dan yeu cau',
    'Reasoning content': 'Noi dung suy luan',
    'Started at': 'Bat dau luc',
    'Token Analytics Filters': 'Bo loc thong ke token',
    'Token Input and Output Trend': 'Xu huong token dau vao va dau ra',
    'Total Token Trend': 'Xu huong tong token',
    'Waiting requests': 'Yeu cau dang cho',
    'vLLM engine': 'Dong co vLLM',
    'vLLM instances': 'Cac phien ban vLLM',
    'Average call latency': 'Do tre goi trung binh',
    'Channels requiring attention': 'Kenh can chu y',
    'Current channel and model risks': 'Rui ro kenh va mo hinh hien tai',
    'Data as of {{time}}': 'Du lieu tinh den {{time}}',
    'Failed requests': 'Yeu cau that bai',
    'Gateway success rate': 'Ty le thanh cong cua gateway',
    'Latest health check within 3 minutes':
      'Lan kiem tra suc khoe gan nhat trong 3 phut',
    'Last 15 minutes': '15 phut gan nhat',
    'Low model success rate': 'Ty le thanh cong cua mo hinh thap',
    'Model Service Operations Overview': 'Tong quan van hanh dich vu mo hinh',
    'Model usage ranking': 'Xep hang su dung mo hinh',
    'No recent health data': 'Khong co du lieu suc khoe gan day',
    'P95 call latency': 'Do tre goi P95',
    'Request volume': 'Luong yeu cau',
    'Slow channel response': 'Phan hoi kenh cham',
    'Successful requests': 'Yeu cau thanh cong',
    'Token usage': 'Su dung token',
    'Total token usage': 'Tong su dung token',
    'User usage ranking': 'Xep hang su dung nguoi dung',
    '{{unavailable}} unavailable, {{unknown}} without data':
      '{{unavailable}} khong kha dung, {{unknown}} khong co du lieu',
  },
}

async function main() {
  let totalAdded = 0
  for (const [locale, trans] of Object.entries(newKeys)) {
    const filePath = path.join(LOCALES_DIR, `${locale}.json`)
    const json = JSON.parse(await fs.readFile(filePath, 'utf8'))
    let count = 0
    for (const [key, value] of Object.entries(trans)) {
      if (json.translation[key] !== value) {
        json.translation[key] = value
        count++
      }
    }
    if (count > 0) {
      json.translation = Object.fromEntries(
        Object.entries(json.translation).sort(([a], [b]) => a.localeCompare(b))
      )
      await fs.writeFile(filePath, stableStringify(json), 'utf8')
    }
    console.log(`${locale}: ${count} translations applied`)
    totalAdded += count
  }
  console.log(`\nTotal: ${totalAdded} translations applied`)
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
