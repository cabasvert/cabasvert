import { Roles } from './toolkit/auth'

export interface PageGroup {
  title?: string
  acceptedRoles?: string[]
  pages: PageDescription[]
}

export interface PageDescription {
  title: string
  icon: string
  acceptedRoles?: string[]
  path: string
  params?: any
}

export const PAGES: PageGroup[] = [
  {
    pages: [
      {
        title: 'DASHBOARD', icon: 'home',
        path: 'dashboard',
      },
      {
        title: 'CHECK_DISTRIBUTION', icon: 'checkmark',
        acceptedRoles: [Roles.DISTRIBUTOR],
        path: 'distribution',
      },
      {
        title: 'ADHERENTS', icon: 'people',
        acceptedRoles: [Roles.ADMINISTRATOR],
        path: 'members',
      },
      {
        title: 'REPORTS', icon: 'pie-chart',
        acceptedRoles: [Roles.ADMINISTRATOR],
        path: 'reports',
      },
    ],
  },
  {
    pages: [
      {
        title: 'PROFILE', icon: 'person',
        path: 'profile',
      },
    ],
  },
]
