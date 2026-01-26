import { DashboardAnalyticsService } from './dashboard-analytics.service'
import { InstitutionAnalyticsService } from './institution-analytics.service'
import { ProfessorAnalyticsService } from './professor-analytics.service'

let _dashboardAnalyticsService: DashboardAnalyticsService | null = null
let _institutionAnalyticsService: InstitutionAnalyticsService | null = null
let _professorAnalyticsService: ProfessorAnalyticsService | null = null

function getDashboardAnalyticsService(): DashboardAnalyticsService {
  if (!_dashboardAnalyticsService) {
    _dashboardAnalyticsService = new DashboardAnalyticsService()
  }
  return _dashboardAnalyticsService
}

function getInstitutionAnalyticsService(): InstitutionAnalyticsService {
  if (!_institutionAnalyticsService) {
    _institutionAnalyticsService = new InstitutionAnalyticsService()
  }
  return _institutionAnalyticsService
}

function getProfessorAnalyticsService(): ProfessorAnalyticsService {
  if (!_professorAnalyticsService) {
    _professorAnalyticsService = new ProfessorAnalyticsService()
  }
  return _professorAnalyticsService
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

export const institutionAnalyticsService = new Proxy(
  {} as InstitutionAnalyticsService,
  {
    get(_target, prop) {
      const service = getInstitutionAnalyticsService()
      return service[prop as keyof InstitutionAnalyticsService]
    },
  }
)

export const professorAnalyticsService = new Proxy(
  {} as ProfessorAnalyticsService,
  {
    get(_target, prop) {
      const service = getProfessorAnalyticsService()
      return service[prop as keyof ProfessorAnalyticsService]
    },
  }
)

export { DashboardAnalyticsService, InstitutionAnalyticsService, ProfessorAnalyticsService }













