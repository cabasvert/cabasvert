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

import { Roles } from './toolkit/providers/auth-service';

export interface PageGroup {
  title?: string;
  acceptedRoles?: string[];
  pages: PageDescription[];
}

export interface PageDescription {
  title: string;
  icon: string;
  acceptedRoles?: string[];
  path: string;
  params?: any;
}

export const PAGES = [
  {
    pages: [
      {
        title: 'SIDEMENU.DASHBOARD', icon: 'home',
        path: 'dashboard',
      },
      {
        title: 'SIDEMENU.PROFILE', icon: 'person',
        path: 'profile',
      },
    ],
  },
  {
    title: 'SIDEMENU.DISTRIBUTION',
    acceptedRoles: [Roles.DISTRIBUTOR],
    pages: [
      {
        title: 'SIDEMENU.CHECK_DISTRIBUTION', icon: 'checkmark',
        path: 'distribution',
      },
    ],
  },
  {
    title: 'SIDEMENU.ADMINISTRATION',
    acceptedRoles: [Roles.ADMINISTRATOR],
    pages: [
      {
        title: 'SIDEMENU.ADHERENTS', icon: 'people',
        path: 'members',
      },
      {
        title: 'SIDEMENU.REPORTS', icon: 'pie',
        path: 'reports',
      },
    ],
  },
];