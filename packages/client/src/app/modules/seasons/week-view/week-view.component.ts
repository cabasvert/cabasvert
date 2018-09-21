import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SeasonWeek } from '../season.model';
import { SeasonService } from '../season.service';

@Component({
  selector: 'app-week-view',
  templateUrl: './week-view.component.html',
  styleUrls: ['./week-view.component.scss'],
})
export class WeekViewComponent implements OnInit {

  @Input('seasonId') seasonId: string;
  @Input('weekNumber') weekNumber: number;

  seasonWeek$: Observable<SeasonWeek>;

  constructor(private seasonService: SeasonService) {
  }

  ngOnInit() {
    this.seasonWeek$ = this.seasonService.seasonById$(this.seasonId).pipe(
      map(season => season.seasonWeekByNumber(this.weekNumber)),
    );
  }
}
