import { Injectable } from "@angular/core"
import { File } from "@ionic-native/file"
import { FileOpener } from "@ionic-native/file-opener"
import { Observable } from "rxjs/Observable"
import { ContractService } from "../contracts/contract.service"
import { MemberService } from "../members/member.service"
import { SeasonService } from "../seasons/season.service"

export interface Report {
  write(fileName: string, generator: ReportService)
}

@Injectable()
export class ReportService {

  constructor(private file: File,
              private fileOpener: FileOpener,
              public seasons: SeasonService,
              public members: MemberService,
              public contracts: ContractService) {
  }

  public writeReport(report) {
    new report().write(null, this)
  }

  public static zip(...arrays) {
    return arrays[0].map(function (_, i) {
      return arrays.map(function (array) {
        return array[i]
      })
    })
  }

  public static monthAsString(month: [number, number]) {
    let formattedMonth = (month[0] < 10 ? "0" : "") + month[0]
    return `${month[1]}:${formattedMonth}`
  }

  public writeFile(fileName: string, csv$: Observable<string>) {
    csv$.subscribe(csv => {
      console.log(csv)
      return this.file.writeFile(this.file.dataDirectory, fileName, csv, { replace: true })
        .catch(error =>
          this.file.writeExistingFile(this.file.dataDirectory, fileName, csv)
        )
        .then(_ => this.openFile(fileName))
        .catch(error => {
          alert('Error: ' + JSON.stringify(error))
        })
    })
  }

  public openFile(fileName: string) {
    return this.file.resolveDirectoryUrl(this.file.dataDirectory)
      .then(dir => this.file.getFile(dir, fileName, {}))
      .then(file => file.toURL())
      .then(url => this.fileOpener.open(url, 'text/plain'))
      .then(() => console.log('File is opened'))
      .catch(e => console.log('Error opening file', e))
  }
}
