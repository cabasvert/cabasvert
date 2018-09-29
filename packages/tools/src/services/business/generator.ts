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

import { injectable } from 'inversify'
import * as UIDGenerator from 'uid-generator'
import { loadNames } from '../../models/names'

@injectable()
export class DatabaseGenerator {

  async generate(): Promise<any[]> {
    let names = await loadNames()

    let today = new Date()

    let seasons = generateSeasons(today)

    let memberCount = generateInt(140, 100)

    let thisSeasonIndex = seasons.findIndex(
      s => distributionDate(s.startWeek, s.distributionDay).addDays(-6) <= today
        && today < distributionDate(s.endWeek, s.distributionDay).addDays(+1),
    )
    let thisSeason = seasons[thisSeasonIndex]
    let thisWeeks = computeWeeks(thisSeason)
    let thisSeasonWeek = thisWeeks.find(
      w => w.date.addDays(-6) <= today && today < w.date.addDays(+1),
    ).seasonWeek

    let memberInfo = generateArray(() => {
      let maxSeasonIndex = seasons.length - 1
      let firstSeasonIndex = generateInt(thisSeasonIndex)
      let lastSeasonIndex = firstSeasonIndex === maxSeasonIndex ?
        firstSeasonIndex : generateInt(maxSeasonIndex, firstSeasonIndex + 1)

      let firstSeason = seasons[firstSeasonIndex]

      let everyWeek = generateBoolean()

      let trialBasketCount =
        firstSeasonIndex === thisSeasonIndex && thisSeasonWeek >= thisSeason.weekCount - 4 ?
          generateInt((thisSeason.weekCount - thisSeasonWeek) / (everyWeek ? 1 : 2)) : generateInt(4)

      let trialBasketSpan = trialBasketCount * (everyWeek ? 1 : 2)

      let firstTrialWeek = firstSeasonIndex === thisSeasonIndex ?
        generateInt(thisSeasonWeek - trialBasketSpan, 1) :
        generateInt(firstSeason.weekCount - trialBasketSpan, 1)

      let firstContractWeek = firstTrialWeek + trialBasketSpan
      let sections = CONTRACT_KINDS
        .map(k => ({
          kind: k,
          count:
            k === 'legumes' ? generateInt(2, 1, x => x ** 3) : generateInt(2, 0, x => x ** 2),
        }))

      return {
        firstSeasonIndex,
        lastSeasonIndex,
        trialBasketCount,
        everyWeek,
        firstTrialWeek,
        firstContractWeek,
        sections,
      }
    }, memberCount)

    let members = generateMembers(memberInfo, seasons, names)
    let validators = generateArray(() => generateOneOf(members).persons[0].firstname, 4)
    let contracts = generateContracts(memberInfo, seasons, thisSeasonIndex, validators)
    let distributions = []

    return [].concat(seasons, members, ...contracts, distributions)
  }
}

const CONTRACT_KINDS = ['legumes', 'oeufs']

function generateSeasons(today: Date) {
  let seasons = []

  let currentYear = today.getFullYear()

  for (let year = currentYear - 2; year <= currentYear; year++) {
    seasons.push({
      _id: `season:${year}S`,
      type: 'season',
      sver: 'v1',
      name: `Été ${year}`,
      distributionDay: 'tuesday',
      startWeek: [year, 14],
      endWeek: [year, 39],
      weekCount: 24,
      ignoredWeeks: [[year, 31], [year, 32]],
    })
    seasons.push({
      _id: `season:${year}W`,
      type: 'season',
      sver: 'v1',
      name: `Hiver ${year}`,
      distributionDay: 'tuesday',
      startWeek: [year, 40],
      endWeek: [year + 1, 13],
      weekCount: 24,
      ignoredWeeks: [[year, 52], [year + 1, 1]],
    })
  }

  return seasons
}

const dayStringToISODay = {
  'monday': 0,
  'tuesday': 1,
  'wednesday': 2,
  'thursday': 3,
  'friday': 4,
  'saturday': 5,
  'sunday': 6,
}

function distributionDate(week: [number, number], distributionDay) {
  return Date.fromISOWeek(week).setISODay(dayStringToISODay[distributionDay])
}

function computeWeeks(season) {
  let weeks = []

  let date = distributionDate(season.startWeek, season.distributionDay)
  let weekCount = season.weekCount
  let ignoredWeeks = season.ignoredWeeks || []

  let otherWeek = false
  for (let seasonWeek = 1; seasonWeek <= weekCount;) {
    let calendarWeek = date.getISOWeek()

    let ignored = ignoredWeeks.some((w) => calendarWeek.toString() === w.toString())

    if (!ignored) {
      weeks.push({ calendarWeek, seasonWeek, date, otherWeek })
      seasonWeek++
    }

    date = date.addDays(7)
  }
  return weeks
}

function generateMembers(memberInfo, seasons, names) {
  return memberInfo
    .map(info => {
      let member = generateMember(names)
      info.memberId = member._id

      let season = seasons[info.firstSeasonIndex]

      let trialBaskets = info.trialBasketCount === 0 ? null :
        range(0, info.trialBasketCount - 1)
          .map(i => info.firstTrialWeek + i * (info.everyWeek ? 1 : 2))
          .map(w => ({
            season: season._id,
            week: w,
            paid: true,
            sections: info.sections,
          }))

      return { ...member, trialBaskets }
    })
}

function generateContracts(memberInfo, seasons, thisSeasonIndex, validators) {
  return memberInfo
    .map(info => {
      let firstSeason = seasons[info.firstSeasonIndex]
      let startsAtNextSeason = info.firstContractWeek === firstSeason.weekCount + 1
      let firstSeasonIndex = info.firstSeasonIndex + (startsAtNextSeason ? 1 : 0)
      return range(firstSeasonIndex, info.lastSeasonIndex)
        .map(seasonIndex => {
          let season = seasons[seasonIndex]
          let firstWeek = seasonIndex === firstSeasonIndex && startsAtNextSeason ? 1 : info.firstContractWeek
          let wish = seasonIndex > thisSeasonIndex && generateBoolean(x => Math.sqrt(x))
          return {
            _id: `contract:${season._id.replace('season:', '')}-${info.memberId.replace('member:', '')}`,
            type: 'contract',
            sver: 'v1',
            season: season._id,
            member: info.memberId,
            sections: info.sections.map(s => ({
              kind: s.kind,
              formula: info.everyWeek || s.count === 0 ? s.count : [s.count, 0],
              firstWeek: seasonIndex === firstSeasonIndex ? firstWeek : info.everyWeek ? 1 : firstWeek % 2 + 1,
            })),
            wish: wish,
            validation: wish ? null : {
              validatedBy: generateOneOf(validators),
              paperCopies: {
                forAssociation: true,
                forFarmer: true,
              },
              cheques: {
                vegetables: true,
                eggs: info.sections.find(s => s.kind === 'oeufs').count !== 0,
              },
            },
          }
        })
    })
}

function generateMember(names) {
  let personCount = generateInt(3, 1)
  let persons = range(1, personCount).map(() => generatePerson(names))
  let firstPerson = persons[0]
  let uid = generateUID()

  return {
    _id: `member:${firstPerson.lastname}-${firstPerson.firstname}-${uid}`,
    type: 'member',
    sver: 'v1',
    persons,
  }
}

function generatePerson(names) {
  let firstname = generateOneOf(names.firstnames)
  let lastname = generateOneOf(names.lastnames)

  return {
    firstname: firstname,
    lastname: lastname,
    address: generateAddress(),
    phoneNumber: generatePhoneNumber(),
    emailAddress: generateEmail(firstname, lastname),
  }
}

function generatePhoneNumber() {
  return generateOneOf(['06', '07']) + generateString(() => generateOneOf(CHARS_ZERO_TO_NINE), 8)
}

function generateEmail(firstname: string, lastname: string) {
  firstname = normalize(firstname.toLowerCase())
  lastname = normalize(lastname.toLowerCase())

  let firstnamePart = generateBoolean() ? firstname[0] : firstname
  let dot = generateBoolean() ? '.' : ''
  let server = generateOneOf(SERVERS)
  let numberSuffix = generateNumberString(generateInt(2))

  return firstnamePart + dot + lastname + numberSuffix + '@' + server
}

function generateAddress() {
  let num = generateInt(200, 1).toString()
  let road = generateOneOf(ROADS)
  let postalCode = generateOneOf(['13005', '13006', '13010'])
  return num + ' ' + road + '\n' + postalCode + ' ' + 'Marseille'
}

const ROADS = [
  'rue Saint-Etienne', 'rue Julia', 'avenue de Toulon', 'rue Antoine Maille', 'rue d\'Isly', 'rue Capitaine Galinat',
  'boulevard Baille', 'rue du Berceau', 'rue des Vertus', 'rue du Portail', 'rue Sainte-Cécile', 'rue Pascal Cros',
  'rue Bérard', 'rue Ernest Renan', 'rue Brandis', 'traverse des Hussards', 'impasse de l\'Aube', 'rue Roger Brun',
  'rue de Friedland', 'rue de l\'Abbé Féraud', 'rue Fernand Pauriol', 'rue Gay Lambert', 'rue Michel Mérino',
  'rue Yves Lariven', 'rue Nègre', 'rue d\'Eylau', 'rue de Lodi', 'rue Chauvelin', 'cours Gouffé', 'rue Melchion',
]

const SERVERS = ['lilo.org', 'framasoft.org', 'mail.org', 'libre.fr', 'monmel.fr', 'moi.fr', 'me.com', 'tribu.fr']

function generateBoolean(distribution: (x: number) => number = x => x) {
  return !!generateInt(1, 0, distribution)
}

function generateInt(max: number = -1, min: number = 0, distribution: (x: number) => number = x => x) {
  max = max !== -1 ? max : 99
  return Math.floor(distribution(Math.random()) * (max + 1 - min)) + min
}

function generateNumberString(length: number = -1): string {
  length = length !== -1 ? length : generateInt(5, 1)
  return (length === 0 ? '' : generateOneOf(CHARS_ONE_TO_NINE)) +
    (length < 2 ? '' : generateString(() => generateOneOf(CHARS_ZERO_TO_NINE), length - 1))
}

function generateUID() {
  return uidGenerator.generateSync()
}

function generateOneOf(choices) {
  return choices[generateInt(choices.length - 1)]
}

function generateString(charGen: () => string, count: number = -1) {
  count = count !== -1 ? count : generateInt(99, 1)
  let str = ''
  for (let i = 0; i < count; i++) {
    str += charGen()
  }
  return str
}

function generateArray(elementGen: (index: number) => any, length: number = -1) {
  length = length !== -1 ? length : generateInt(99)
  return length === 0 ? [] : range(1, length).map(elementGen)
}

const CHARS_ONE_TO_NINE = range(1, 9).map(n => n.toString())
const CHARS_ZERO_TO_NINE = range(0, 9).map(n => n.toString())

function normalize(str: string) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(' ', '')
}

function range(min: number = 0, max: number) {
  let elements = []
  for (let i = min; i <= max; i++) {
    elements.push(i)
  }
  return elements
}

const uidGenerator = new UIDGenerator(64, UIDGenerator.BASE62)
