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

import { Injectable } from '@angular/core';
// import { File } from '@ionic-native/file';
// import { FileOpener } from '@ionic-native/file-opener';
import { Observable } from 'rxjs';
import { ContractService } from '../contracts/contract.service';
import { MemberService } from '../members/member.service';
import { SeasonService } from '../seasons/season.service';

export interface Report {
  write(fileName: string, generator: ReportService);
}

@Injectable()
export class ReportService {

  constructor(// private file: File,
              // private fileOpener: FileOpener,
              public seasons: SeasonService,
              public members: MemberService,
              public contracts: ContractService) {
  }

  public static zip(...arrays) {
    return arrays[0].map(function (_, i) {
      return arrays.map(function (array) {
        return array[i];
      });
    });
  }

  public static monthFor(week): Date {
    return new Date(
      week.distributionDate.getFullYear(),
      week.distributionDate.getMonth(),
      1,
    );
  }

  public writeReport(report) {
    new report().write(null, this);
  }

  public writeFile(fileName: string, csv$: Observable<string>) {
    csv$.subscribe(csv => {
      console.log(csv);
      // return this.file.writeFile(this.file.dataDirectory, fileName, csv, { replace: true })
      //   .catch(error =>
      //     this.file.writeExistingFile(this.file.dataDirectory, fileName, csv),
      //   )
      //   .then(_ => this.openFile(fileName))
      //   .catch(error => {
      //     alert('Error: ' + JSON.stringify(error));
      //   });
    });
  }

  // public openFile(fileName: string) {
  //   return this.file.resolveDirectoryUrl(this.file.dataDirectory)
  //     .then(dir => this.file.getFile(dir, fileName, {}))
  //     .then(file => file.toURL())
  //     .then(url => this.fileOpener.open(url, 'text/plain'))
  //     .then(() => console.log('File is opened'))
  //     .catch(e => console.log('Error opening file', e));
  // }
}
