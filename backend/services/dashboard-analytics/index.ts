import { DashboardAnalyticsService } from './dashboard-analytics.service'

let _dashboardAnalyticsService: DashboardAnalyticsService | null = null

function getDashboardAnalyticsService(): DashboardAnalyticsService {
  if (!_dashboardAnalyticsService) {
    _dashboardAnalyticsService = new DashboardAnalyticsService()
  }
  return _dashboardAnalyticsService
}

export const dashboardAnalyticsService = new Proxy(
  {} as DashboardAnalyticsService,
  {
    get(_target, prop) {
      const service = getDashboardAnalyticsService()
      return service[prop as keyof DashboardAnalyticsService]
    },
  }
)

export { DashboardAnalyticsService }





