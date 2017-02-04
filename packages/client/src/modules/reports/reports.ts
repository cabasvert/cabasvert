import { Observable } from "rxjs/Observable"
import { combineLatest as combineAllLatest } from "rxjs/observable/combineLatest"
import { forkJoin } from "rxjs/observable/forkJoin"
import { of } from "rxjs/observable/of"
import { zip } from "rxjs/observable/zip"
import { map, switchMap, take } from "rxjs/operators"

import { groupBy } from "../../utils/arrays"

import { Contract, ContractKind } from "../contracts/contract.model"
import { ContractService } from "../contracts/contract.service"
import { DistributionService } from "../distributions/distribution.service"
import { Member } from "../members/member.model"
import { Season } from "../seasons/season.model"

import { Report, ReportService } from "./report.service"

export class BasketPerMonthReport implements Report {

  write(fileName: string, generator: ReportService) {
    generator.writeFile('./basketsPerMonth-vegetables.csv',
      this.basketsPerMonth(of('legumes'), generator).pipe(take(1)),
    )
    generator.writeFile('./basketsPerMonth-eggs.csv',
      this.basketsPerMonth(of('oeufs'), generator).pipe(take(1)),
    )
  }

  private basketsPerMonth(basketType$: Observable<string>, generator: ReportService): Observable<string> {
    let seasons$ = generator.seasons.lastSeasons$(2)

    let membersIndexed$ = generator.members.getMembersIndexed$()
    let css$: Observable<Contract[][]> = seasons$.pipe(
      switchMap(seasons =>
        forkJoin(seasons.map(season =>
          generator.contracts.getSeasonContracts$(season).pipe(
            take(1),
          ),
        )),
      ),
    )

    type SeasonContractsPair = [Season, Array<Contract>]
    let scss$: Observable<SeasonContractsPair[]> =
      zip(css$, seasons$, (css, seasons) => ReportService.zip(seasons, css))

    return combineAllLatest(basketType$, membersIndexed$, scss$,
      (basketType, ms, scss: SeasonContractsPair[]) => {

        let sms = []

        scss.forEach(scs => {
          let season = scs[0]
          let seasonWeeks = season.seasonWeeks()

          let cs = scs[1]

          cs.forEach(c => {
            if (c.type !== 'contract' && c.srev !== 'v1') return
            if (!c.sections) return

            c.sections.forEach(s => {
              if (s.kind != basketType) return
              if (!s.formula) return

              let member = ms[c.member]
              let monthlyPresence = new Map<string, [number, number]>()
              seasonWeeks.forEach(week => {
                let month: [number, number] = [
                  week.distributionDate.getMonth(),
                  week.distributionDate.getFullYear(),
                ]

                let count = DistributionService.basketCount(c, s, week)
                if (count > 0) {
                  monthlyPresence.set(ReportService.monthAsString(month), month)
                }
              })
              monthlyPresence.forEach(month => {
                sms.push({ season: season, month: month, member: member, formula: s.formula })
              })
            })
          })
        })

        let bsByMonth = groupBy(sms, sm => ReportService.monthAsString(sm.month))
          .map(group => ({
            month: group.values[0].month,
            total: group.values.length,
            half: group.values.reduce((acc, v) => v.formula == .5 ? acc + 1 : acc, 0),
            one: group.values.reduce((acc, v) => v.formula == 1 ? acc + 1 : acc, 0),
            oneAndHalf: group.values.reduce((acc, v) => v.formula == 1.5 ? acc + 1 : acc, 0),
            two: group.values.reduce((acc, v) => v.formula == 2 ? acc + 1 : acc, 0),
          }))
          .sort((sm1, sm2) =>
            ReportService.monthAsString(sm1.month)
              .localeCompare(ReportService.monthAsString(sm2.month)))

        // TODO Update to take trial baskets in account

        let csv = bsByMonth.map(mc =>
          `${mc.month},${mc.total},${mc.half},${mc.one},${mc.oneAndHalf},${mc.two}`).join('\n')
        return csv
      },
    )
  }
}

export class DistributionChecklistReport implements Report {

  write(fileName: string, generator: ReportService) {
    generator.writeFile('./distribution-checklist-vegetables.csv',
      this.baskets(of('legumes'), generator).pipe(take(1)),
    )
    generator.writeFile('./distribution-checklist-eggs.csv',
      this.baskets(of('oeufs'), generator).pipe(take(1)),
    )
  }

  private baskets(basketType$: Observable<string>, generator: ReportService): Observable<string> {
    let season$ = generator.seasons.lastSeasons$().pipe(map(ss => ss[0]))

    let membersIndexed$ = generator.members.getMembersIndexed$()
    let cs$: Observable<Contract[]> = season$.pipe(
      switchMap(season =>
        generator.contracts.getSeasonContracts$(season).pipe(
          take(1),
        ),
      ),
    )

    type SeasonContractsPair = { season: Season, contracts: Array<Contract> }
    let scs$: Observable<SeasonContractsPair> = combineAllLatest(cs$, season$, (css, season) => ({
      season: season,
      contracts: css,
    }))

    return combineAllLatest(basketType$, membersIndexed$, scs$,
      (basketType, ms, scs: SeasonContractsPair) => {

        let presence = []

        let season = scs.season
        let seasonWeeks = season.seasonWeeks()

        let cs = scs.contracts

        cs.forEach(c => {
          if (c.type !== 'contract' && c.srev !== 'v1') return
          if (!c.sections) return

          c.sections.forEach(s => {
            if (s.kind != basketType) return
            if (!s.formula) return

            let member = ms[c.member]
            let weeklyPresence = []
            seasonWeeks.forEach(week => {
              let count = DistributionService.basketCount(c, s, week)
              weeklyPresence.push(count)
            })

            presence.push({ member: member, presence: weeklyPresence })
          })
        })

        // TODO Update to take trial baskets in account

        let formatDate: (d: Date) => string =
          d => '' + d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear()

        let totals = presence
          .reduce((acc, mp) => this.zip(acc, mp.presence, (a, b) => a + b), seasonWeeks.map(_ => 0))

        let csv =
          ',,,' + seasonWeeks.map(w => w.seasonWeek).join(',') + '\n' +
          ',,,' + seasonWeeks.map(w => formatDate(w.distributionDate)).join(',') + '\n' +
          ',,Totals,' + totals.join(',') + '\n' +
          'Nom,Prénom,Téléphone,' + seasonWeeks.map(w => '').join(',') + '\n' +
          presence.map(mp =>
            `${mp.member.persons[0].lastname},${mp.member.persons[0].firstname},${mp.member.persons[0].phoneNumber},` +
            mp.presence.join(','),
          ).join('\n')
        return csv
      },
    )
  }

  private zip<A, B, C>(a: A[], b: B[], f: (A, B) => C): C[] {
    let c = []
    for (var i = 0; i < Math.min(a.length, b.length); i++) {
      c.push(f(a[i], b[i]))
    }
    return c
  }
}

export class PerYearMemberListReport implements Report {

  write(fileName: string, generator: ReportService) {
    generator.writeFile('./per-year-member-list.csv',
      this.memberList(generator).pipe(take(1)),
    )
  }

  private memberList(generator: ReportService): Observable<string> {
    let year = new Date().getFullYear()

    let seasons$ = generator.seasons.lastSeasons$(3).pipe(
      map(ss => ss.filter(s =>
        s.contains(new Date('01/01/' + year)) || s.contains(new Date('07/01/' + year)),
      )),
    )

    let membersIndexed$ = generator.members.getMembersIndexed$()

    let css$: Observable<Contract[][]> = seasons$.pipe(
      switchMap(seasons =>
        forkJoin(seasons.map(season =>
          generator.contracts.getSeasonContracts$(season).pipe(take(1)),
        )),
      ),
    )

    type MemberPresence = {
      member: Member,
      seasons: Season[]
    }

    let memberPresence = new Map<String, MemberPresence>()

    return combineAllLatest(membersIndexed$, seasons$, css$,
      (ms, seasons, css: Contract[][]) => {

        type SeasonContractsPair = [Season, Array<Contract>]
        let scss: SeasonContractsPair[] = ReportService.zip(seasons, css)

        scss.reverse()
        scss.forEach(scs => {
          let season: Season = scs[0]
          let cs: Contract[] = scs[1]

          cs.forEach(c => {
            let s = c.sections.find(s => s.kind == ContractKind.VEGETABLES)

            if (!s.formula) return
            if (ContractService.hasNoneFormula(s)) return

            let memberId = c.member
            let member = ms[memberId]

            if (memberPresence.has(memberId)) {
              memberPresence.get(memberId).seasons.push(season)
            } else {
              memberPresence.set(memberId, {
                member: member,
                seasons: [season],
              })
            }
          })
        })

        var csv = 'Nom,Prénom,Téléphone,Courriel,Saisons\n'

        memberPresence.forEach(mp => {
          csv += `${mp.member.persons[0].lastname || ''},${mp.member.persons[0].firstname || ''},` +
            `${mp.member.persons[0].phoneNumber || ''},${mp.member.persons[0].emailAddress || ''},` +
            mp.seasons.map(s => s.name).join(' + ') + '\n'
        })
        return csv
      },
    )
  }
}
