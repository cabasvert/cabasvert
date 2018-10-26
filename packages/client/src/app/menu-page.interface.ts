/*
 * This file is part of CabasVert.
 *
 * Copyright 2017, 2018 Didier Villevalois
 *
 * CabasVert is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * CabasVert is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with CabasVert.  If not, see <http://www.gnu.org/licenses/>.
 */

import { Roles } from './toolkit/providers/auth-service'

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

export const PAGES = [
  {
    pages: [
      {
        title: 'SIDEMENU.DASHBOARD', icon: 'home',
        path: 'dashboard',
      },
      {
        title: 'SIDEMENU.CHECK_DISTRIBUTION', icon: 'checkmark',
        acceptedRoles: [Roles.DISTRIBUTOR],
        path: 'distribution',
      },
      {
        title: 'SIDEMENU.ADHERENTS', icon: 'people',
        acceptedRoles: [Roles.ADMINISTRATOR],
        path: 'members',
      },
      {
        title: 'SIDEMENU.REPORTS', icon: 'pie',
        acceptedRoles: [Roles.ADMINISTRATOR],
        path: 'reports',
      },
    ],
  },
  {
    pages: [
      {
        title: 'SIDEMENU.PROFILE', icon: 'person',
        path: 'profile',
      },
    ],
  },
]
