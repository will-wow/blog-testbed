import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'sw-user',
  templateUrl: 'name.component.html'
})
export class UserComponent implements OnInit {
  constructor(httpClient: HttpClient) {}

  ngOnInit() {}
}
