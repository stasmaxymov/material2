import {Direction, Directionality} from '@angular/cdk/bidi';
import {
  DOWN_ARROW,
  END,
  ENTER,
  HOME,
  LEFT_ARROW,
  RIGHT_ARROW,
  SPACE,
  UP_ARROW,
} from '@angular/cdk/keycodes';
import {StepperOrientation} from '@angular/cdk/stepper';
import {dispatchKeyboardEvent} from '@angular/cdk/testing';
import {Component, DebugElement} from '@angular/core';
import {async, ComponentFixture, inject, TestBed, fakeAsync, flush} from '@angular/core/testing';
import {
  AbstractControl,
  AsyncValidatorFn,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import {By} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {Observable, Subject} from 'rxjs';
import {map, take} from 'rxjs/operators';
import {MatStepperModule} from './index';
import {MatHorizontalStepper, MatStep, MatStepper, MatVerticalStepper} from './stepper';
import {MatStepperNext, MatStepperPrevious} from './stepper-button';
import {MatStepperIntl} from './stepper-intl';


const VALID_REGEX = /valid/;

describe('MatStepper', () => {
  let dir: Direction;

  beforeEach(async(() => {
    dir = 'ltr';

    TestBed.configureTestingModule({
      imports: [MatStepperModule, NoopAnimationsModule, ReactiveFormsModule],
      declarations: [
        SimpleMatVerticalStepperApp,
        LinearMatVerticalStepperApp,
        IconOverridesStepper,
        SimplePreselectedMatHorizontalStepperApp,
        SimpleStepperWithoutStepControl,
        SimpleStepperWithStepControlAndCompletedBinding,
        SimpleMatHorizontalStepperApp,
        LinearStepperWithValidOptionalStep,
      ],
      providers: [
        {provide: Directionality, useFactory: () => ({value: dir})}
      ]
    });

    TestBed.compileComponents();
  }));

  describe('basic stepper', () => {
    let fixture: ComponentFixture<SimpleMatVerticalStepperApp>;

    beforeEach(() => {
      fixture = TestBed.createComponent(SimpleMatVerticalStepperApp);
      fixture.detectChanges();
    });

    it('should default to the first step', () => {
      let stepperComponent = fixture.debugElement
          .query(By.css('mat-vertical-stepper')).componentInstance;
      expect(stepperComponent.selectedIndex).toBe(0);
    });

    it('should throw when a negative `selectedIndex` is assigned', () => {
      const stepperComponent: MatVerticalStepper = fixture.debugElement
          .query(By.css('mat-vertical-stepper')).componentInstance;

      expect(() => {
        stepperComponent.selectedIndex = -10;
        fixture.detectChanges();
      }).toThrowError(/Cannot assign out-of-bounds/);
    });

    it('should throw when an out-of-bounds `selectedIndex` is assigned', () => {
      const stepperComponent: MatVerticalStepper = fixture.debugElement
          .query(By.css('mat-vertical-stepper')).componentInstance;

      expect(() => {
        stepperComponent.selectedIndex = 1337;
        fixture.detectChanges();
      }).toThrowError(/Cannot assign out-of-bounds/);
    });

    it('should change selected index on header click', () => {
      let stepHeaders = fixture.debugElement.queryAll(By.css('.mat-vertical-stepper-header'));
      let stepperComponent = fixture.debugElement.query(By.directive(MatStepper)).componentInstance;

      expect(stepperComponent.selectedIndex).toBe(0);
      expect(stepperComponent.selected instanceof MatStep).toBe(true);

      // select the second step
      let stepHeaderEl = stepHeaders[1].nativeElement;
      stepHeaderEl.click();
      fixture.detectChanges();

      expect(stepperComponent.selectedIndex).toBe(1);
      expect(stepperComponent.selected instanceof MatStep).toBe(true);

      // select the third step
      stepHeaderEl = stepHeaders[2].nativeElement;
      stepHeaderEl.click();
      fixture.detectChanges();

      expect(stepperComponent.selectedIndex).toBe(2);
      expect(stepperComponent.selected instanceof MatStep).toBe(true);
    });

    it('should set the "tablist" role on stepper', () => {
      let stepperEl = fixture.debugElement.query(By.css('mat-vertical-stepper')).nativeElement;
      expect(stepperEl.getAttribute('role')).toBe('tablist');
    });

    it('should set aria-expanded of content correctly', () => {
      let stepContents = fixture.debugElement.queryAll(By.css(`.mat-vertical-stepper-content`));
      let stepperComponent = fixture.debugElement.query(By.directive(MatStepper)).componentInstance;
      let firstStepContentEl = stepContents[0].nativeElement;
      expect(firstStepContentEl.getAttribute('aria-expanded')).toBe('true');

      stepperComponent.selectedIndex = 1;
      fixture.detectChanges();

      expect(firstStepContentEl.getAttribute('aria-expanded')).toBe('false');
      let secondStepContentEl = stepContents[1].nativeElement;
      expect(secondStepContentEl.getAttribute('aria-expanded')).toBe('true');
    });

    it('should display the correct label', () => {
      let stepperComponent = fixture.debugElement.query(By.directive(MatStepper)).componentInstance;
      let selectedLabel = fixture.nativeElement.querySelector('[aria-selected="true"]');
      expect(selectedLabel.textContent).toMatch('Step 1');

      stepperComponent.selectedIndex = 2;
      fixture.detectChanges();

      selectedLabel = fixture.nativeElement.querySelector('[aria-selected="true"]');
      expect(selectedLabel.textContent).toMatch('Step 3');

      fixture.componentInstance.inputLabel = 'New Label';
      fixture.detectChanges();

      selectedLabel = fixture.nativeElement.querySelector('[aria-selected="true"]');
      expect(selectedLabel.textContent).toMatch('New Label');
    });

    it('should go to next available step when the next button is clicked', () => {
      let stepperComponent = fixture.debugElement.query(By.directive(MatStepper)).componentInstance;

      expect(stepperComponent.selectedIndex).toBe(0);

      let nextButtonNativeEl = fixture.debugElement
          .queryAll(By.directive(MatStepperNext))[0].nativeElement;
      nextButtonNativeEl.click();
      fixture.detectChanges();

      expect(stepperComponent.selectedIndex).toBe(1);

      nextButtonNativeEl = fixture.debugElement
          .queryAll(By.directive(MatStepperNext))[1].nativeElement;
      nextButtonNativeEl.click();
      fixture.detectChanges();

      expect(stepperComponent.selectedIndex).toBe(2);

      nextButtonNativeEl = fixture.debugElement
          .queryAll(By.directive(MatStepperNext))[2].nativeElement;
      nextButtonNativeEl.click();
      fixture.detectChanges();

      expect(stepperComponent.selectedIndex).toBe(2);
    });

    it('should set the next stepper button type to "submit"', () => {
      const button = fixture.debugElement.query(By.directive(MatStepperNext)).nativeElement;
      expect(button.type).toBe('submit', `Expected the button to have "submit" set as type.`);
    });

    it('should go to previous available step when the previous button is clicked', () => {
      let stepperComponent = fixture.debugElement.query(By.directive(MatStepper)).componentInstance;

      expect(stepperComponent.selectedIndex).toBe(0);

      stepperComponent.selectedIndex = 2;
      let previousButtonNativeEl = fixture.debugElement
          .queryAll(By.directive(MatStepperPrevious))[2].nativeElement;
      previousButtonNativeEl.click();
      fixture.detectChanges();

      expect(stepperComponent.selectedIndex).toBe(1);

      previousButtonNativeEl = fixture.debugElement
          .queryAll(By.directive(MatStepperPrevious))[1].nativeElement;
      previousButtonNativeEl.click();
      fixture.detectChanges();

      expect(stepperComponent.selectedIndex).toBe(0);

      previousButtonNativeEl = fixture.debugElement
          .queryAll(By.directive(MatStepperPrevious))[0].nativeElement;
      previousButtonNativeEl.click();
      fixture.detectChanges();

      expect(stepperComponent.selectedIndex).toBe(0);
    });

    it('should set the previous stepper button type to "button"', () => {
      const button = fixture.debugElement.query(By.directive(MatStepperPrevious)).nativeElement;
      expect(button.type).toBe('button', `Expected the button to have "button" set as type.`);
    });

    it('should set the correct step position for animation', () => {
      let stepperComponent = fixture.debugElement.query(By.directive(MatStepper)).componentInstance;

      expect(stepperComponent._getAnimationDirection(0)).toBe('current');
      expect(stepperComponent._getAnimationDirection(1)).toBe('next');
      expect(stepperComponent._getAnimationDirection(2)).toBe('next');

      stepperComponent.selectedIndex = 1;
      fixture.detectChanges();

      expect(stepperComponent._getAnimationDirection(0)).toBe('previous');
      expect(stepperComponent._getAnimationDirection(2)).toBe('next');
      expect(stepperComponent._getAnimationDirection(1)).toBe('current');

      stepperComponent.selectedIndex = 2;
      fixture.detectChanges();

      expect(stepperComponent._getAnimationDirection(0)).toBe('previous');
      expect(stepperComponent._getAnimationDirection(1)).toBe('previous');
      expect(stepperComponent._getAnimationDirection(2)).toBe('current');
    });

    it('should not set focus on header of selected step if header is not clicked', () => {
      let stepperComponent = fixture.debugElement.query(By.directive(MatStepper)).componentInstance;
      let stepHeaderEl = fixture.debugElement.queryAll(By.css('mat-step-header'))[1].nativeElement;
      let nextButtonNativeEl = fixture.debugElement
          .queryAll(By.directive(MatStepperNext))[0].nativeElement;
      spyOn(stepHeaderEl, 'focus');
      nextButtonNativeEl.click();
      fixture.detectChanges();

      expect(stepperComponent.selectedIndex).toBe(1);
      expect(stepHeaderEl.focus).not.toHaveBeenCalled();
    });

    it('should only be able to return to a previous step if it is editable', () => {
      let stepperComponent = fixture.debugElement.query(By.directive(MatStepper)).componentInstance;

      stepperComponent.selectedIndex = 1;
      stepperComponent._steps.toArray()[0].editable = false;
      let previousButtonNativeEl = fixture.debugElement
          .queryAll(By.directive(MatStepperPrevious))[1].nativeElement;
      previousButtonNativeEl.click();
      fixture.detectChanges();

      expect(stepperComponent.selectedIndex).toBe(1);

      stepperComponent._steps.toArray()[0].editable = true;
      previousButtonNativeEl.click();
      fixture.detectChanges();

      expect(stepperComponent.selectedIndex).toBe(0);
    });

    it('should set create icon if step is editable and completed', () => {
      let stepperComponent = fixture.debugElement.query(By.directive(MatStepper)).componentInstance;
      let nextButtonNativeEl = fixture.debugElement
          .queryAll(By.directive(MatStepperNext))[0].nativeElement;
      expect(stepperComponent._getIndicatorType(0)).toBe('number');
      stepperComponent._steps.toArray()[0].editable = true;
      nextButtonNativeEl.click();
      fixture.detectChanges();

      expect(stepperComponent._getIndicatorType(0)).toBe('edit');
    });

    it('should set done icon if step is not editable and is completed', () => {
      let stepperComponent = fixture.debugElement.query(By.directive(MatStepper)).componentInstance;
      let nextButtonNativeEl = fixture.debugElement
          .queryAll(By.directive(MatStepperNext))[0].nativeElement;
      expect(stepperComponent._getIndicatorType(0)).toBe('number');
      stepperComponent._steps.toArray()[0].editable = false;
      nextButtonNativeEl.click();
      fixture.detectChanges();

      expect(stepperComponent._getIndicatorType(0)).toBe('done');
    });

    it('should re-render when the i18n labels change', inject([MatStepperIntl],
      (intl: MatStepperIntl) => {
        fixture.destroy();

        const i18nFixture = TestBed.createComponent(SimpleMatHorizontalStepperApp);
        i18nFixture.detectChanges();

        const header =
            i18nFixture.debugElement.queryAll(By.css('mat-step-header'))[2].nativeElement;
        const optionalLabel = header.querySelector('.mat-step-optional');

        expect(optionalLabel).toBeTruthy();
        expect(optionalLabel.textContent).toBe('Optional');

        intl.optionalLabel = 'Valgfri';
        intl.changes.next();
        i18nFixture.detectChanges();

        expect(optionalLabel.textContent).toBe('Valgfri');
      }));

      it('should emit an event when the enter animation is done', fakeAsync(() => {
        let stepper = fixture.debugElement.query(By.directive(MatStepper)).componentInstance;
        let selectionChangeSpy = jasmine.createSpy('selectionChange spy');
        let animationDoneSpy = jasmine.createSpy('animationDone spy');
        let selectionChangeSubscription = stepper.selectionChange.subscribe(selectionChangeSpy);
        let animationDoneSubscription = stepper.animationDone.subscribe(animationDoneSpy);

        stepper.selectedIndex = 1;
        fixture.detectChanges();

        expect(selectionChangeSpy).toHaveBeenCalledTimes(1);
        expect(animationDoneSpy).not.toHaveBeenCalled();

        flush();

        expect(selectionChangeSpy).toHaveBeenCalledTimes(1);
        expect(animationDoneSpy).toHaveBeenCalledTimes(1);

        selectionChangeSubscription.unsubscribe();
        animationDoneSubscription.unsubscribe();
      }));
  });

  describe('icon overrides', () => {
    let fixture: ComponentFixture<IconOverridesStepper>;

    beforeEach(() => {
      fixture = TestBed.createComponent(IconOverridesStepper);
      fixture.detectChanges();
    });

    it('should allow for the `edit` icon to be overridden', () => {
      const stepperDebugElement = fixture.debugElement.query(By.directive(MatStepper));
      const stepperComponent: MatStepper = stepperDebugElement.componentInstance;

      stepperComponent._steps.toArray()[0].editable = true;
      stepperComponent.next();
      fixture.detectChanges();

      const header = stepperDebugElement.nativeElement.querySelector('mat-step-header');

      expect(header.textContent).toContain('Custom edit');
    });

    it('should allow for the `done` icon to be overridden', () => {
      const stepperDebugElement = fixture.debugElement.query(By.directive(MatStepper));
      const stepperComponent: MatStepper = stepperDebugElement.componentInstance;

      stepperComponent._steps.toArray()[0].editable = false;
      stepperComponent.next();
      fixture.detectChanges();

      const header = stepperDebugElement.nativeElement.querySelector('mat-step-header');

      expect(header.textContent).toContain('Custom done');
    });

    it('should allow for the `number` icon to be overridden with context', () => {
      const stepperDebugElement = fixture.debugElement.query(By.directive(MatStepper));
      const headers = stepperDebugElement.nativeElement.querySelectorAll('mat-step-header');

      expect(headers[2].textContent).toContain('III');
    });
  });

  describe('RTL', () => {
    let fixture: ComponentFixture<SimpleMatVerticalStepperApp>;

    beforeEach(() => {
      dir = 'rtl';
      fixture = TestBed.createComponent(SimpleMatVerticalStepperApp);
      fixture.detectChanges();
    });

    it('should reverse animation in RTL mode', () => {
      let stepperComponent = fixture.debugElement.query(By.directive(MatStepper)).componentInstance;

      expect(stepperComponent._getAnimationDirection(0)).toBe('current');
      expect(stepperComponent._getAnimationDirection(1)).toBe('previous');
      expect(stepperComponent._getAnimationDirection(2)).toBe('previous');

      stepperComponent.selectedIndex = 1;
      fixture.detectChanges();

      expect(stepperComponent._getAnimationDirection(0)).toBe('next');
      expect(stepperComponent._getAnimationDirection(2)).toBe('previous');
      expect(stepperComponent._getAnimationDirection(1)).toBe('current');

      stepperComponent.selectedIndex = 2;
      fixture.detectChanges();

      expect(stepperComponent._getAnimationDirection(0)).toBe('next');
      expect(stepperComponent._getAnimationDirection(1)).toBe('next');
      expect(stepperComponent._getAnimationDirection(2)).toBe('current');
    });
  });

  describe('linear stepper', () => {
    let fixture: ComponentFixture<LinearMatVerticalStepperApp>;
    let testComponent: LinearMatVerticalStepperApp;
    let stepperComponent: MatVerticalStepper;

    beforeEach(() => {
      fixture = TestBed.createComponent(LinearMatVerticalStepperApp);
      fixture.detectChanges();

      testComponent = fixture.componentInstance;
      stepperComponent = fixture.debugElement
          .query(By.css('mat-vertical-stepper')).componentInstance;
    });

    it('should have true linear attribute', () => {
      expect(stepperComponent.linear).toBe(true);
    });

    it('should not move to next step if current step is invalid', () => {
      expect(testComponent.oneGroup.get('oneCtrl')!.value).toBe('');
      expect(testComponent.oneGroup.get('oneCtrl')!.valid).toBe(false);
      expect(testComponent.oneGroup.valid).toBe(false);
      expect(testComponent.oneGroup.invalid).toBe(true);
      expect(stepperComponent.selectedIndex).toBe(0);

      let stepHeaderEl = fixture.debugElement
          .queryAll(By.css('.mat-vertical-stepper-header'))[1].nativeElement;

      stepHeaderEl.click();
      fixture.detectChanges();

      expect(stepperComponent.selectedIndex).toBe(0);

      let nextButtonNativeEl = fixture.debugElement
          .queryAll(By.directive(MatStepperNext))[0].nativeElement;
      nextButtonNativeEl.click();
      fixture.detectChanges();

      expect(stepperComponent.selectedIndex).toBe(0);

      testComponent.oneGroup.get('oneCtrl')!.setValue('answer');
      stepHeaderEl.click();
      fixture.detectChanges();

      expect(testComponent.oneGroup.valid).toBe(true);
      expect(stepperComponent.selectedIndex).toBe(1);
    });

    it('should not move to next step if current step is pending', () => {
      let stepHeaderEl = fixture.debugElement
          .queryAll(By.css('.mat-vertical-stepper-header'))[2].nativeElement;

      let nextButtonNativeEl = fixture.debugElement
          .queryAll(By.directive(MatStepperNext))[1].nativeElement;

      testComponent.oneGroup.get('oneCtrl')!.setValue('input');
      testComponent.twoGroup.get('twoCtrl')!.setValue('input');
      stepperComponent.selectedIndex = 1;
      fixture.detectChanges();
      expect(stepperComponent.selectedIndex).toBe(1);

      // Step status = PENDING
      // Assert that linear stepper does not allow step selection change
      expect(testComponent.twoGroup.pending).toBe(true);

      stepHeaderEl.click();
      fixture.detectChanges();

      expect(stepperComponent.selectedIndex).toBe(1);

      nextButtonNativeEl.click();
      fixture.detectChanges();

      expect(stepperComponent.selectedIndex).toBe(1);

      // Trigger asynchronous validation
      testComponent.validationTrigger.next();
      // Asynchronous validation completed:
      // Step status = VALID
      expect(testComponent.twoGroup.pending).toBe(false);
      expect(testComponent.twoGroup.valid).toBe(true);

      stepHeaderEl.click();
      fixture.detectChanges();

      expect(stepperComponent.selectedIndex).toBe(2);

      stepperComponent.selectedIndex = 1;
      fixture.detectChanges();
      expect(stepperComponent.selectedIndex).toBe(1);

      nextButtonNativeEl.click();
      fixture.detectChanges();

      expect(stepperComponent.selectedIndex).toBe(2);
    });

    it('should be able to focus step header upon click if it is unable to be selected', () => {
      let stepHeaderEl = fixture.debugElement.queryAll(By.css('mat-step-header'))[1].nativeElement;

      fixture.detectChanges();

      expect(stepHeaderEl.getAttribute('tabindex')).toBe('-1');
    });

    it('should be able to move to next step even when invalid if current step is optional', () => {
      testComponent.oneGroup.get('oneCtrl')!.setValue('input');
      testComponent.twoGroup.get('twoCtrl')!.setValue('input');
      testComponent.validationTrigger.next();
      stepperComponent.selectedIndex = 1;
      fixture.detectChanges();
      stepperComponent.selectedIndex = 2;
      fixture.detectChanges();

      expect(stepperComponent._steps.toArray()[2].optional).toBe(true);
      expect(stepperComponent.selectedIndex).toBe(2);
      expect(testComponent.threeGroup.get('threeCtrl')!.valid).toBe(true);

      const nextButtonNativeEl = fixture.debugElement
          .queryAll(By.directive(MatStepperNext))[2].nativeElement;
      nextButtonNativeEl.click();
      fixture.detectChanges();

      expect(stepperComponent.selectedIndex)
          .toBe(3, 'Expected selectedIndex to change when optional step input is empty.');

      stepperComponent.selectedIndex = 2;
      testComponent.threeGroup.get('threeCtrl')!.setValue('input');
      nextButtonNativeEl.click();
      fixture.detectChanges();

      expect(testComponent.threeGroup.get('threeCtrl')!.valid).toBe(false);
      expect(stepperComponent.selectedIndex)
          .toBe(3, 'Expected selectedIndex to change when optional step input is invalid.');
    });

    it('should be able to reset the stepper to its initial state', () => {
      const steps = stepperComponent._steps.toArray();

      testComponent.oneGroup.get('oneCtrl')!.setValue('value');
      fixture.detectChanges();

      stepperComponent.next();
      fixture.detectChanges();

      stepperComponent.next();
      fixture.detectChanges();

      expect(stepperComponent.selectedIndex).toBe(1);
      expect(steps[0].interacted).toBe(true);
      expect(steps[0].completed).toBe(true);
      expect(testComponent.oneGroup.get('oneCtrl')!.valid).toBe(true);
      expect(testComponent.oneGroup.get('oneCtrl')!.value).toBe('value');

      expect(steps[1].interacted).toBe(true);
      expect(steps[1].completed).toBe(false);
      expect(testComponent.twoGroup.get('twoCtrl')!.valid).toBe(false);

      stepperComponent.reset();
      fixture.detectChanges();

      expect(stepperComponent.selectedIndex).toBe(0);
      expect(steps[0].interacted).toBe(false);
      expect(steps[0].completed).toBe(false);
      expect(testComponent.oneGroup.get('oneCtrl')!.valid).toBe(false);
      expect(testComponent.oneGroup.get('oneCtrl')!.value).toBeFalsy();

      expect(steps[1].interacted).toBe(false);
      expect(steps[1].completed).toBe(false);
      expect(testComponent.twoGroup.get('twoCtrl')!.valid).toBe(false);
    });

    it('should reset back to the first step when some of the steps are not editable', () => {
      const steps = stepperComponent._steps.toArray();

      steps[0].editable = false;

      testComponent.oneGroup.get('oneCtrl')!.setValue('value');
      fixture.detectChanges();

      stepperComponent.next();
      fixture.detectChanges();

      expect(stepperComponent.selectedIndex).toBe(1);

      stepperComponent.reset();
      fixture.detectChanges();

      expect(stepperComponent.selectedIndex).toBe(0);
    });

    it('should not clobber the `complete` binding when resetting', () => {
      const steps: MatStep[] = stepperComponent._steps.toArray();
      const fillOutStepper = () => {
        testComponent.oneGroup.get('oneCtrl')!.setValue('input');
        testComponent.twoGroup.get('twoCtrl')!.setValue('input');
        testComponent.threeGroup.get('threeCtrl')!.setValue('valid');
        testComponent.validationTrigger.next();
        stepperComponent.selectedIndex = 1;
        fixture.detectChanges();
        stepperComponent.selectedIndex = 2;
        fixture.detectChanges();
        stepperComponent.selectedIndex = 3;
        fixture.detectChanges();
      };

      fillOutStepper();

      expect(steps[2].completed)
          .toBe(true, 'Expected third step to be considered complete after the first run through.');

      stepperComponent.reset();
      fixture.detectChanges();
      fillOutStepper();

      expect(steps[2].completed).toBe(true,
          'Expected third step to be considered complete when doing a run after a reset.');
    });

    it('should not throw when there is a pre-defined selectedIndex', () => {
      fixture.destroy();

      let preselectedFixture = TestBed.createComponent(SimplePreselectedMatHorizontalStepperApp);
      expect(() => preselectedFixture.detectChanges()).not.toThrow();
    });

    it('should not move to the next step if the current one is not completed ' +
      'and there is no `stepControl`', () => {
        fixture.destroy();

        const noStepControlFixture = TestBed.createComponent(SimpleStepperWithoutStepControl);

        noStepControlFixture.detectChanges();

        const stepper: MatHorizontalStepper = noStepControlFixture.debugElement
            .query(By.directive(MatHorizontalStepper)).componentInstance;

        const headers = noStepControlFixture.debugElement
            .queryAll(By.css('.mat-horizontal-stepper-header'));

        expect(stepper.selectedIndex).toBe(0);

        headers[1].nativeElement.click();
        noStepControlFixture.detectChanges();

        expect(stepper.selectedIndex).toBe(0);
      });

      it('should have the `stepControl` take precedence when both `completed` and ' +
        '`stepControl` are set', () => {
          fixture.destroy();

          const controlAndBindingFixture =
              TestBed.createComponent(SimpleStepperWithStepControlAndCompletedBinding);

          controlAndBindingFixture.detectChanges();

          expect(controlAndBindingFixture.componentInstance.steps[0].control.valid).toBe(true);
          expect(controlAndBindingFixture.componentInstance.steps[0].completed).toBe(false);

          const stepper: MatHorizontalStepper = controlAndBindingFixture.debugElement
              .query(By.directive(MatHorizontalStepper)).componentInstance;

          const headers = controlAndBindingFixture.debugElement
              .queryAll(By.css('.mat-horizontal-stepper-header'));

          expect(stepper.selectedIndex).toBe(0);

          headers[1].nativeElement.click();
          controlAndBindingFixture.detectChanges();

          expect(stepper.selectedIndex).toBe(1);
        });
  });

  describe('vertical stepper', () => {
    it('should set the aria-orientation to "vertical"', () => {
      let fixture = TestBed.createComponent(SimpleMatVerticalStepperApp);
      fixture.detectChanges();

      let stepperEl = fixture.debugElement.query(By.css('mat-vertical-stepper')).nativeElement;
      expect(stepperEl.getAttribute('aria-orientation')).toBe('vertical');
    });

    it('should support using the left/right arrows to move focus', () => {
      let fixture = TestBed.createComponent(SimpleMatVerticalStepperApp);
      fixture.detectChanges();

      let stepHeaders = fixture.debugElement.queryAll(By.css('.mat-vertical-stepper-header'));
      assertCorrectKeyboardInteraction(fixture, stepHeaders, 'horizontal');
    });

    it('should support using the up/down arrows to move focus', () => {
      let fixture = TestBed.createComponent(SimpleMatVerticalStepperApp);
      fixture.detectChanges();

      let stepHeaders = fixture.debugElement.queryAll(By.css('.mat-vertical-stepper-header'));
      assertCorrectKeyboardInteraction(fixture, stepHeaders, 'vertical');
    });

    it('should reverse arrow key focus in RTL mode', () => {
      dir = 'rtl';
      let fixture = TestBed.createComponent(SimpleMatVerticalStepperApp);
      fixture.detectChanges();

      let stepHeaders = fixture.debugElement.queryAll(By.css('.mat-vertical-stepper-header'));
      assertArrowKeyInteractionInRtl(fixture, stepHeaders);
    });
  });

  describe('horizontal stepper', () => {
    it('should set the aria-orientation to "horizontal"', () => {
      let fixture = TestBed.createComponent(SimpleMatHorizontalStepperApp);
      fixture.detectChanges();

      let stepperEl = fixture.debugElement.query(By.css('mat-horizontal-stepper')).nativeElement;
      expect(stepperEl.getAttribute('aria-orientation')).toBe('horizontal');
    });

    it('should support using the left/right arrows to move focus', () => {
      let fixture = TestBed.createComponent(SimpleMatHorizontalStepperApp);
      fixture.detectChanges();

      let stepHeaders = fixture.debugElement.queryAll(By.css('.mat-horizontal-stepper-header'));
      assertCorrectKeyboardInteraction(fixture, stepHeaders, 'horizontal');
    });

    it('should reverse arrow key focus in RTL mode', () => {
      dir = 'rtl';
      let fixture = TestBed.createComponent(SimpleMatHorizontalStepperApp);
      fixture.detectChanges();

      let stepHeaders = fixture.debugElement.queryAll(By.css('.mat-horizontal-stepper-header'));
      assertArrowKeyInteractionInRtl(fixture, stepHeaders);
    });
  });

  describe('valid step in linear stepper', () => {
    let fixture: ComponentFixture<LinearStepperWithValidOptionalStep>;
    let testComponent: LinearStepperWithValidOptionalStep;
    let stepper: MatStepper;

    beforeEach(() => {
      fixture = TestBed.createComponent(LinearStepperWithValidOptionalStep);
      fixture.detectChanges();

      testComponent = fixture.componentInstance;
      stepper = fixture.debugElement
          .query(By.css('mat-horizontal-stepper')).componentInstance;
    });

    it('must be visited if not optional', () => {
      stepper.selectedIndex = 2;
      fixture.detectChanges();
      expect(stepper.selectedIndex).toBe(0);

      stepper.selectedIndex = 1;
      fixture.detectChanges();
      expect(stepper.selectedIndex).toBe(1);

      stepper.selectedIndex = 2;
      fixture.detectChanges();
      expect(stepper.selectedIndex).toBe(2);
    });

    it('can be skipped entirely if optional', () => {
      testComponent.step2Optional = true;
      fixture.detectChanges();
      stepper.selectedIndex = 2;
      fixture.detectChanges();
      expect(stepper.selectedIndex).toBe(2);
    });
  });
});

/** Asserts that keyboard interaction works correctly. */
function assertCorrectKeyboardInteraction(fixture: ComponentFixture<any>,
                                          stepHeaders: DebugElement[],
                                          orientation: StepperOrientation) {
  let stepperComponent = fixture.debugElement.query(By.directive(MatStepper)).componentInstance;
  let nextKey = orientation === 'vertical' ? DOWN_ARROW : RIGHT_ARROW;
  let prevKey = orientation === 'vertical' ? UP_ARROW : LEFT_ARROW;

  expect(stepperComponent._getFocusIndex()).toBe(0);
  expect(stepperComponent.selectedIndex).toBe(0);

  let stepHeaderEl = stepHeaders[0].nativeElement;
  dispatchKeyboardEvent(stepHeaderEl, 'keydown', nextKey);
  fixture.detectChanges();

  expect(stepperComponent._getFocusIndex())
      .toBe(1, 'Expected index of focused step to increase by 1 after pressing the next key.');
  expect(stepperComponent.selectedIndex)
      .toBe(0, 'Expected index of selected step to remain unchanged after pressing the next key.');

  stepHeaderEl = stepHeaders[1].nativeElement;
  dispatchKeyboardEvent(stepHeaderEl, 'keydown', ENTER);
  fixture.detectChanges();

  expect(stepperComponent._getFocusIndex())
      .toBe(1, 'Expected index of focused step to remain unchanged after ENTER event.');
  expect(stepperComponent.selectedIndex)
      .toBe(1,
          'Expected index of selected step to change to index of focused step after ENTER event.');

  stepHeaderEl = stepHeaders[1].nativeElement;
  dispatchKeyboardEvent(stepHeaderEl, 'keydown', prevKey);
  fixture.detectChanges();

  expect(stepperComponent._getFocusIndex())
      .toBe(0, 'Expected index of focused step to decrease by 1 after pressing the previous key.');
  expect(stepperComponent.selectedIndex).toBe(1,
      'Expected index of selected step to remain unchanged after pressing the previous key.');

  // When the focus is on the last step and right arrow key is pressed, the focus should cycle
  // through to the first step.
  stepperComponent._keyManager.updateActiveItemIndex(2);
  stepHeaderEl = stepHeaders[2].nativeElement;
  dispatchKeyboardEvent(stepHeaderEl, 'keydown', nextKey);
  fixture.detectChanges();

  expect(stepperComponent._getFocusIndex()).toBe(0,
      'Expected index of focused step to cycle through to index 0 after pressing the next key.');
  expect(stepperComponent.selectedIndex)
      .toBe(1, 'Expected index of selected step to remain unchanged after pressing the next key.');

  stepHeaderEl = stepHeaders[0].nativeElement;
  dispatchKeyboardEvent(stepHeaderEl, 'keydown', SPACE);
  fixture.detectChanges();

  expect(stepperComponent._getFocusIndex())
      .toBe(0, 'Expected index of focused to remain unchanged after SPACE event.');
  expect(stepperComponent.selectedIndex)
      .toBe(0,
          'Expected index of selected step to change to index of focused step after SPACE event.');

  const endEvent = dispatchKeyboardEvent(stepHeaderEl, 'keydown', END);
  expect(stepperComponent._getFocusIndex())
      .toBe(stepHeaders.length - 1, 'Expected last step to be focused when pressing END.');
  expect(endEvent.defaultPrevented).toBe(true, 'Expected default END action to be prevented.');

  const homeEvent = dispatchKeyboardEvent(stepHeaderEl, 'keydown', HOME);
  expect(stepperComponent._getFocusIndex())
      .toBe(0, 'Expected first step to be focused when pressing HOME.');
  expect(homeEvent.defaultPrevented).toBe(true, 'Expected default HOME action to be prevented.');
}

/** Asserts that arrow key direction works correctly in RTL mode. */
function assertArrowKeyInteractionInRtl(fixture: ComponentFixture<any>,
                                        stepHeaders: DebugElement[]) {
  let stepperComponent = fixture.debugElement.query(By.directive(MatStepper)).componentInstance;

  expect(stepperComponent._getFocusIndex()).toBe(0);

  let stepHeaderEl = stepHeaders[0].nativeElement;
  dispatchKeyboardEvent(stepHeaderEl, 'keydown', LEFT_ARROW);
  fixture.detectChanges();

  expect(stepperComponent._getFocusIndex()).toBe(1);

  stepHeaderEl = stepHeaders[1].nativeElement;
  dispatchKeyboardEvent(stepHeaderEl, 'keydown', RIGHT_ARROW);
  fixture.detectChanges();

  expect(stepperComponent._getFocusIndex()).toBe(0);
}

function asyncValidator(minLength: number, validationTrigger: Observable<any>): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    return validationTrigger.pipe(
      map(() => control.value && control.value.length >= minLength ? null : {asyncValidation: {}}),
      take(1)
    );
  };
}

@Component({
  template: `
    <mat-horizontal-stepper>
      <mat-step>
        <ng-template matStepLabel>Step 1</ng-template>
        Content 1
        <div>
          <button mat-button matStepperPrevious>Back</button>
          <button mat-button matStepperNext>Next</button>
        </div>
      </mat-step>
      <mat-step>
        <ng-template matStepLabel>Step 2</ng-template>
        Content 2
        <div>
          <button mat-button matStepperPrevious>Back</button>
          <button mat-button matStepperNext>Next</button>
        </div>
      </mat-step>
      <mat-step [label]="inputLabel" optional>
        Content 3
        <div>
          <button mat-button matStepperPrevious>Back</button>
          <button mat-button matStepperNext>Next</button>
        </div>
      </mat-step>
    </mat-horizontal-stepper>
  `
})
class SimpleMatHorizontalStepperApp {
  inputLabel = 'Step 3';
}

@Component({
  template: `
    <mat-vertical-stepper>
      <mat-step>
        <ng-template matStepLabel>Step 1</ng-template>
        Content 1
        <div>
          <button mat-button matStepperPrevious>Back</button>
          <button mat-button matStepperNext>Next</button>
        </div>
      </mat-step>
      <mat-step>
        <ng-template matStepLabel>Step 2</ng-template>
        Content 2
        <div>
          <button mat-button matStepperPrevious>Back</button>
          <button mat-button matStepperNext>Next</button>
        </div>
      </mat-step>
      <mat-step [label]="inputLabel">
        Content 3
        <div>
          <button mat-button matStepperPrevious>Back</button>
          <button mat-button matStepperNext>Next</button>
        </div>
      </mat-step>
    </mat-vertical-stepper>
  `
})
class SimpleMatVerticalStepperApp {
  inputLabel = 'Step 3';
}

@Component({
  template: `
    <mat-vertical-stepper linear>
      <mat-step [stepControl]="oneGroup">
        <form [formGroup]="oneGroup">
          <ng-template matStepLabel>Step one</ng-template>
          <input formControlName="oneCtrl" required>
          <div>
            <button mat-button matStepperPrevious>Back</button>
            <button mat-button matStepperNext>Next</button>
          </div>
        </form>
      </mat-step>
      <mat-step [stepControl]="twoGroup">
        <form [formGroup]="twoGroup">
          <ng-template matStepLabel>Step two</ng-template>
          <input formControlName="twoCtrl" required>
          <div>
            <button mat-button matStepperPrevious>Back</button>
            <button mat-button matStepperNext>Next</button>
          </div>
        </form>
      </mat-step>
      <mat-step [stepControl]="threeGroup" optional>
        <form [formGroup]="threeGroup">
          <ng-template matStepLabel>Step two</ng-template>
          <input formControlName="threeCtrl">
          <div>
            <button mat-button matStepperPrevious>Back</button>
            <button mat-button matStepperNext>Next</button>
          </div>
        </form>
      </mat-step>
      <mat-step>
        Done
      </mat-step>
    </mat-vertical-stepper>
  `
})
class LinearMatVerticalStepperApp {
  oneGroup: FormGroup;
  twoGroup: FormGroup;
  threeGroup: FormGroup;

  validationTrigger: Subject<any> = new Subject();

  ngOnInit() {
    this.oneGroup = new FormGroup({
      oneCtrl: new FormControl('', Validators.required)
    });
    this.twoGroup = new FormGroup({
      twoCtrl: new FormControl('', Validators.required, asyncValidator(3, this.validationTrigger))
    });
    this.threeGroup = new FormGroup({
      threeCtrl: new FormControl('', Validators.pattern(VALID_REGEX))
    });
  }
}

@Component({
  template: `
    <mat-horizontal-stepper [linear]="true" [selectedIndex]="index">
      <mat-step label="One"></mat-step>
      <mat-step label="Two"></mat-step>
      <mat-step label="Three"></mat-step>
    </mat-horizontal-stepper>
  `
})
class SimplePreselectedMatHorizontalStepperApp {
  index = 0;
}

@Component({
  template: `
    <mat-horizontal-stepper linear>
      <mat-step
        *ngFor="let step of steps"
        [label]="step.label"
        [completed]="step.completed"></mat-step>
    </mat-horizontal-stepper>
  `
})
class SimpleStepperWithoutStepControl {
  steps = [
    {label: 'One', completed: false},
    {label: 'Two', completed: false},
    {label: 'Three', completed: false}
  ];
}

@Component({
  template: `
    <mat-horizontal-stepper linear>
      <mat-step
        *ngFor="let step of steps"
        [label]="step.label"
        [stepControl]="step.control"
        [completed]="step.completed"></mat-step>
    </mat-horizontal-stepper>
  `
})
class SimpleStepperWithStepControlAndCompletedBinding {
  steps = [
    {label: 'One', completed: false, control: new FormControl()},
    {label: 'Two', completed: false, control: new FormControl()},
    {label: 'Three', completed: false, control: new FormControl()}
  ];
}

@Component({
  template: `
    <mat-horizontal-stepper>
      <ng-template matStepperIcon="edit">Custom edit</ng-template>
      <ng-template matStepperIcon="done">Custom done</ng-template>
      <ng-template matStepperIcon="number" let-index="index">
        {{getRomanNumeral(index + 1)}}
      </ng-template>

      <mat-step>Content 1</mat-step>
      <mat-step>Content 2</mat-step>
      <mat-step>Content 3</mat-step>
    </mat-horizontal-stepper>
`
})
class IconOverridesStepper {
  getRomanNumeral(value: number) {
    return {
      1: 'I',
      2: 'II',
      3: 'III',
      4: 'IV',
      5: 'V',
      6: 'VI',
      7: 'VII',
      8: 'VIII',
      9: 'IX'
    }[value];
  }
}

@Component({
  template: `
    <mat-horizontal-stepper linear>
      <mat-step label="Step 1" [stepControl]="controls[0]"></mat-step>
      <mat-step label="Step 2" [stepControl]="controls[1]" [optional]="step2Optional"></mat-step>
      <mat-step label="Step 3" [stepControl]="controls[2]"></mat-step>
    </mat-horizontal-stepper>
  `
})
class LinearStepperWithValidOptionalStep {
  controls = [0, 0, 0].map(() => new FormControl());
  step2Optional = false;
}
