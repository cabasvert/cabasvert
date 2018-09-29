# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

<a name="0.3.0-beta.8"></a>
# [0.3.0-beta.8](https://github.com/cabasvert/cabasvert-client/compare/v0.3.0-beta.7...v0.3.0-beta.8) (2018-09-29)


### Bug Fixes

* **reports:** make the reports scrollable ([d79d9f7](https://github.com/cabasvert/cabasvert-client/commit/d79d9f7))
* **startup:** don't wait for platform ready for Capacitor plugins ([df493ba](https://github.com/cabasvert/cabasvert-client/commit/df493ba))



<a name="0.3.0-beta.7"></a>
# [0.3.0-beta.7](https://github.com/cabasvert/cabasvert-client/compare/v0.3.0-beta.6...v0.3.0-beta.7) (2018-09-28)


### Features

* **contracts:** add new formula '3 every other week' ([5b30df3](https://github.com/cabasvert/cabasvert-client/commit/5b30df3))
* **reports:** make reports shiny ([cd64e55](https://github.com/cabasvert/cabasvert-client/commit/cd64e55))



<a name="0.3.0-beta.6"></a>
# [0.3.0-beta.6](https://github.com/cabasvert/cabasvert-client/compare/v0.3.0-beta.5...v0.3.0-beta.6) (2018-09-28)


### Bug Fixes

* **sw:** don't compute hash for config.prod.json ([7adf6f7](https://github.com/cabasvert/cabasvert-client/commit/7adf6f7))



<a name="0.3.0-beta.5"></a>
# [0.3.0-beta.5](https://github.com/cabasvert/cabasvert-client/compare/v0.3.0-beta.4...v0.3.0-beta.5) (2018-09-28)


### Bug Fixes

* **lists:** force visible to have progressive loading ([b33117c](https://github.com/cabasvert/cabasvert-client/commit/b33117c))
* **seasons:** load based on distribution day, start and end weeks ([c3d9450](https://github.com/cabasvert/cabasvert-client/commit/c3d9450))
* **startup:** don't fail if no indexes during initial sync ([d2db5f2](https://github.com/cabasvert/cabasvert-client/commit/d2db5f2))



<a name="0.3.0-beta.4"></a>
# [0.3.0-beta.4](https://github.com/cabasvert/cabasvert-client/compare/v0.3.0-beta.3...v0.3.0-beta.4) (2018-09-26)


### Bug Fixes

* **backbutton:** configure ionic at startup ([4965aab](https://github.com/cabasvert/cabasvert-client/commit/4965aab))
* **contracts:** inference for new contracts uses trials ([bd33850](https://github.com/cabasvert/cabasvert-client/commit/bd33850))
* **logger:** display correct line numbers in console ([2021aab](https://github.com/cabasvert/cabasvert-client/commit/2021aab))
* **members:** allow distributor to view member details ([1cca33b](https://github.com/cabasvert/cabasvert-client/commit/1cca33b))


### Features

* **database:** use Capacitor's App and Network instead of Cordova ([d565a41](https://github.com/cabasvert/cabasvert-client/commit/d565a41))


### Performance Improvements

* **database:** name indexes ([f477567](https://github.com/cabasvert/cabasvert-client/commit/f477567))



<a name="0.3.0-beta.3"></a>
# [0.3.0-beta.3](https://github.com/cabasvert/cabasvert-client/compare/v0.3.0-beta.2...v0.3.0-beta.3) (2018-09-22)


### Bug Fixes

* **auth:** setup secure storage ([9e6c73e](https://github.com/cabasvert/cabasvert-client/commit/9e6c73e))
* **contracts:** reference formulas with a string identifier ([51a18cd](https://github.com/cabasvert/cabasvert-client/commit/51a18cd))
* **distribution:** unfolding items animate correctly ([5a08e36](https://github.com/cabasvert/cabasvert-client/commit/5a08e36))
* **i18n:** translate confirmation dialogs ([c693205](https://github.com/cabasvert/cabasvert-client/commit/c693205))
* **menu:** split pane is correctly displayed ([1ee6b37](https://github.com/cabasvert/cabasvert-client/commit/1ee6b37))
* **sw:** check for updates and show toast if an update is available ([7cb2ebc](https://github.com/cabasvert/cabasvert-client/commit/7cb2ebc))
* **trials:** allow to add trials even with contracts ([06ec824](https://github.com/cabasvert/cabasvert-client/commit/06ec824))
* **trials:** sort with padded week numbers ([664b04c](https://github.com/cabasvert/cabasvert-client/commit/664b04c))


### Features

* **database:** specify database in user metadata ([156558c](https://github.com/cabasvert/cabasvert-client/commit/156558c))



<a name="0.3.0-beta.2"></a>
# [0.3.0-beta.2](https://github.com/cabasvert/cabasvert-client/compare/v0.3.0-beta.1...v0.3.0-beta.2) (2018-09-21)


### Bug Fixes

* **android:** rework launcher icon background ([d2a90e6](https://github.com/cabasvert/cabasvert-client/commit/d2a90e6))
* **backbutton:** override Ionic's default behavior ([c991fca](https://github.com/cabasvert/cabasvert-client/commit/c991fca))
* **dashboard:** more null checks during initialization ([5ea87aa](https://github.com/cabasvert/cabasvert-client/commit/5ea87aa))
* **members:** members correctly filter with no trial baskets ([dc8dfd2](https://github.com/cabasvert/cabasvert-client/commit/dc8dfd2))
* **members:** strengthen member creation reliability ([c00893f](https://github.com/cabasvert/cabasvert-client/commit/c00893f))
* **members:** various design enhancements ([f575d98](https://github.com/cabasvert/cabasvert-client/commit/f575d98))
* **navigation:** remove now useless back button code ([0ad54f0](https://github.com/cabasvert/cabasvert-client/commit/0ad54f0))


### Features

* **backbutton:** make back button testable in development setup ([9fdeb93](https://github.com/cabasvert/cabasvert-client/commit/9fdeb93))
* **log:** beautify logs ([dff5524](https://github.com/cabasvert/cabasvert-client/commit/dff5524))
* **members:** add additional filters (contracts, trials and problems) ([6fb0bfa](https://github.com/cabasvert/cabasvert-client/commit/6fb0bfa))
* **members:** add searchbar again ([b0ccb23](https://github.com/cabasvert/cabasvert-client/commit/b0ccb23))


### Performance Improvements

* **database:** use maps where possible ([67cd9b0](https://github.com/cabasvert/cabasvert-client/commit/67cd9b0))
* **members:** cache contracts to avoid blocking main thread ([2b78dba](https://github.com/cabasvert/cabasvert-client/commit/2b78dba))
* **members:** various performance improvements ([d6a6076](https://github.com/cabasvert/cabasvert-client/commit/d6a6076))



<a name="0.3.0-beta.1"></a>
# [0.3.0-beta.1](https://github.com/cabasvert/cabasvert-client/compare/v0.3.0-beta.0...v0.3.0-beta.1) (2018-09-21)


### Bug Fixes

* **contracts:** save contracts as old format ([f4d4aeb](https://github.com/cabasvert/cabasvert-client/commit/f4d4aeb))
* **forms:** initialize disablement observers eagerly ([3b48669](https://github.com/cabasvert/cabasvert-client/commit/3b48669))
* **forms:** unprotect members and remove useless variable ([8c173b7](https://github.com/cabasvert/cabasvert-client/commit/8c173b7))
* **members:** correctly create and go to member detail page ([5d1a9a4](https://github.com/cabasvert/cabasvert-client/commit/5d1a9a4))
* **modals:** handle cancel with escape key correctly ([a357d44](https://github.com/cabasvert/cabasvert-client/commit/a357d44))
* **trials:** better infer next trial basket's week ([f1a84f2](https://github.com/cabasvert/cabasvert-client/commit/f1a84f2))


### Features

* **forms:** add dynamic forms to the toolkit ([aad0246](https://github.com/cabasvert/cabasvert-client/commit/aad0246))
* **trials:** cosmetic changes ([136424c](https://github.com/cabasvert/cabasvert-client/commit/136424c))
* **trials:** reverse sort trial baskets ([f4ac044](https://github.com/cabasvert/cabasvert-client/commit/f4ac044))



<a name="0.3.0-beta.0"></a>
# [0.3.0-beta.0](https://github.com/cabasvert/cabasvert-client/compare/v0.2.9...v0.3.0-beta.0) (2018-09-21)
