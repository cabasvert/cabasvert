import { Component, Input } from '@angular/core'

import { Member } from "./member.model"

@Component({
  selector: 'member-view',
  templateUrl: './member-view.html',
})
export class MemberView {
  @Input() member: Member
}
