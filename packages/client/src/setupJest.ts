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

import 'jest-preset-angular'
import './jestGlobalMocks'

// A utility to configure the Angular TestBed

import { TestBed, async, TestModuleMetadata } from '@angular/core/testing'

const resetTestingModule = TestBed.resetTestingModule

declare global {
  let setupTestBed: (metadata: TestModuleMetadata) => void
}

global.setupTestBed = (moduleDef: TestModuleMetadata) => {

  beforeAll(async(async () => {
    resetTestingModule()

    // prevent Angular from resetting testing module
    TestBed.resetTestingModule = () => TestBed

    const compilerConfig = { preserveWhitespaces: false } as any
    TestBed.configureCompiler(compilerConfig).configureTestingModule(moduleDef)

    await TestBed.compileComponents()
  }))

  afterAll(() => {
    resetTestingModule()

    // reinstate resetTestingModule method
    TestBed.resetTestingModule = resetTestingModule
  })

}
