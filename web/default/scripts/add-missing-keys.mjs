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
import fs from 'node:fs/promises'
import path from 'node:path'

const LOCALES_DIR = path.resolve('src/i18n/locales')

function stableStringify(obj) {
  return JSON.stringify(obj, null, 2) + '\n'
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
    'Call analysis and request-path audit': 'Call analysis and request-path audit',
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
    'Request trend for the last 24 hours': 'Request trend for the last 24 hours',
    'Request trend data': 'Request trend data',
    'At {{time}}: {{requests}} requests':
      'At {{time}}: {{requests}} requests',
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
    'Reduce application changes through a unified API': '通过统一 API 减少应用改造',
    'Full-link monitoring and analysis': '全链路监控分析',
    'Understand operations from gateway to inference engine': '洞察从网关到推理引擎的运行情况',
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
    '{{healthy}} / {{total}} services healthy': '{{healthy}} / {{total}} 个服务健康',
    'Platform operation overview': '平台运行概览',
    'Retry operation overview': '重试平台运行概览',
    'Request trend': '请求趋势',
    'Request trend for the last 24 hours': '最近 24 小时请求趋势',
    'Request trend data': '请求趋势数据',
    'At {{time}}: {{requests}} requests': '{{time}}：{{requests}} 次请求',
  },
  'zh-TW': {
    'Xingluo model service component': '星羅數場大模型服務元件',
    'Unify access, routing, and governance for every model capability':
      '統一接入、調度與治理每一項模型能力',
    'Zhiqing provides internal business applications with unified management for multi-node local models and multi-channel model services, including compatible APIs, stable routing, operational monitoring, and call analysis.':
      'Zhiqing 為內部業務應用提供多節點本地模型與多渠道模型服務的統一管理，涵蓋相容 API、穩定調度、營運監控與呼叫分析。',
    'Browse models': '瀏覽模型',
    'Core capabilities': '核心能力',
    'Operate every model service from one control plane': '以單一控制面營運所有模型服務',
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
    'Reduce application changes through a unified API': '透過統一 API 減少應用改造',
    'Full-link monitoring and analysis': '全鏈路監控與分析',
    'Understand operations from gateway to inference engine': '掌握從閘道到推理引擎的營運狀態',
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
    '{{healthy}} / {{total}} services healthy': '{{healthy}} / {{total}} 個服務正常',
    'Platform operation overview': '平台營運概覽',
    'Retry operation overview': '重試平台營運概覽',
    'Request trend': '請求趨勢',
    'Request trend for the last 24 hours': '最近 24 小時請求趨勢',
    'Request trend data': '請求趨勢資料',
    'At {{time}}: {{requests}} requests': '{{time}}：{{requests}} 次請求',
  },
  fr: {
    'Xingluo model service component': 'Composant de service de modèles Xingluo',
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
    'Call analysis and request-path audit': 'Analyse des appels et audit des requêtes',
    'Analyze usage by user, key, and model while retaining auditable request paths.':
      "Analysez l'usage par utilisateur, clé et modèle, avec des chemins de requête auditables.",
    'Multi-node unified management': 'Gestion unifiée multi-noeuds',
    'Centrally manage distributed model services':
      'Gérez centralement les services de modèles distribués',
    'Multi-protocol compatible access': 'Accès compatible multi-protocole',
    'Reduce application changes through a unified API':
      'Réduisez les changements applicatifs avec une API unifiée',
    'Full-link monitoring and analysis': 'Supervision et analyse de bout en bout',
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
    '{{healthy}} / {{total}} services healthy': '{{healthy}} / {{total}} services sains',
    'Platform operation overview': "Vue d'ensemble de la plateforme",
    'Retry operation overview': "Réessayer la vue d'ensemble",
    'Request trend': 'Tendance des requêtes',
    'Request trend for the last 24 hours': 'Tendance des requêtes sur 24 heures',
    'Request trend data': 'Données de tendance des requêtes',
    'At {{time}}: {{requests}} requests': '{{time}} : {{requests}} requêtes',
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
    'Multi-channel intelligent routing': 'マルチチャネルインテリジェントルーティング',
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
    '{{healthy}} / {{total}} services healthy': '{{healthy}} / {{total}} サービスが正常',
    'Platform operation overview': 'プラットフォーム運用概要',
    'Retry operation overview': '運用概要を再試行',
    'Request trend': 'リクエスト推移',
    'Request trend for the last 24 hours': '過去 24 時間のリクエスト推移',
    'Request trend data': 'リクエスト推移データ',
    'At {{time}}: {{requests}} requests': '{{time}}: {{requests}} 件のリクエスト',
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
    'Multi-channel intelligent routing': 'Интеллектуальная многоканальная маршрутизация',
    'Route requests by group, priority, and availability with automatic failover.':
      'Маршрутизируйте запросы по группам, приоритету и доступности с автоматическим переключением.',
    'Service status monitoring': 'Мониторинг состояния сервисов',
    'Review 24-hour availability, success rate, response latency, and status timelines.':
      'Просматривайте доступность, успешность, задержку ответов и хронологию за 24 часа.',
    'Resource and engine monitoring': 'Мониторинг ресурсов и движков',
    'Track CPU, memory, GPU, vLLM concurrency, queueing, and cache metrics.':
      'Отслеживайте CPU, память, GPU, параллелизм vLLM, очереди и метрики кеша.',
    'Call analysis and request-path audit': 'Анализ вызовов и аудит пути запросов',
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
    '{{healthy}} / {{total}} services healthy': '{{healthy}} / {{total}} сервисов исправны',
    'Platform operation overview': 'Обзор работы платформы',
    'Retry operation overview': 'Повторить обзор работы',
    'Request trend': 'Динамика запросов',
    'Request trend for the last 24 hours': 'Динамика запросов за 24 часа',
    'Request trend data': 'Данные динамики запросов',
    'At {{time}}: {{requests}} requests': '{{time}}: {{requests}} запросов',
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
    'Call analysis and request-path audit': 'Phân tích cuộc gọi và kiểm toán đường dẫn yêu cầu',
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
    '{{healthy}} / {{total}} services healthy': '{{healthy}} / {{total}} dịch vụ hoạt động tốt',
    'Platform operation overview': 'Tổng quan vận hành nền tảng',
    'Retry operation overview': 'Thử lại tổng quan vận hành',
    'Request trend': 'Xu hướng yêu cầu',
    'Request trend for the last 24 hours': 'Xu hướng yêu cầu trong 24 giờ qua',
    'Request trend data': 'Dữ liệu xu hướng yêu cầu',
    'At {{time}}: {{requests}} requests': '{{time}}: {{requests}} yêu cầu',
  },
}

const newKeys = {
  en: {
    ...homepageKeys.en,
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
