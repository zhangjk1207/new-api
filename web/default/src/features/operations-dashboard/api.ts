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
*/
import { getPerfMetricsSummary } from '@/features/performance-metrics/api'
import { getServiceMonitoring } from '@/features/service-monitoring/api'

export async function getOperationsDashboard() {
  const [performanceResponse, monitoringGroups] = await Promise.all([
    getPerfMetricsSummary(24),
    getServiceMonitoring(),
  ])

  return {
    quotaData: [],
    performance: performanceResponse.success
      ? performanceResponse.data.models
      : [],
    monitors: monitoringGroups.flatMap((group) => group.monitors),
  }
}
