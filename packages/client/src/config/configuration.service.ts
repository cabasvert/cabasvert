import { HttpClient } from "@angular/common/http"
import { Injectable } from "@angular/core"
import { take } from "rxjs/operators"
import { Configuration, defaultConfiguration } from "./configuration"

@Injectable()
export class ConfigurationService {

  private configData: Configuration

  constructor(private http: HttpClient) {
  }

  async loadConfiguration() {
    try {
      console.log('Loading configuration...')

      let configData = await this.http.get<Configuration>('config.json')
        .pipe(take(1))
        .toPromise()

      this.configData = Object.assign({}, defaultConfiguration(), configData)

      console.log(`Loaded configuration: ${JSON.stringify(this.configData)}`)
    } catch (error) {
      console.error(`Error while loading configuration: ${error}`)
      console.error(error)
      throw error
    }
  }

  get base() {
    return this.configData.base
  }

  get log() {
    return this.configData.log
  }
}
