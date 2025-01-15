import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FastFeaturePrototypeComponent} from "./Fast-Feature-Prototype.component";
import {TranslateLoader, TranslateModule} from "@ngx-translate/core";
import {Observable, of} from "rxjs";

describe('FastFeaturePrototypeComponent', () => {
  let fixture: ComponentFixture<FastFeaturePrototypeComponent>;
  let component: FastFeaturePrototypeComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FastFeaturePrototypeComponent],
      imports: [TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader, useValue: {
            getTranslation(): Observable<Record<string, string>> {
              return of({});
            }
          }
        }
      })],
    }).compileComponents();

    fixture = TestBed.createComponent(FastFeaturePrototypeComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });
});
