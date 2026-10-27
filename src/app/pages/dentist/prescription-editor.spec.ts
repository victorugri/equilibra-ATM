import { TestBed } from '@angular/core/testing';
import { PrescriptionDraft } from '../../core/prescription/dentist.service';
import { PrescriptionEditor } from './prescription-editor';

function render() {
  const fixture = TestBed.createComponent(PrescriptionEditor);
  const saved: PrescriptionDraft[] = [];
  fixture.componentInstance.saved.subscribe((draft) => saved.push(draft));
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  const button = (text: string) =>
    [...el.querySelectorAll('button')].find((b) => b.textContent?.includes(text))!;
  const submit = () => {
    el.querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  };
  return { fixture, el, saved, button, submit };
}

describe('PrescriptionEditor', () => {
  it('lista o 6x6 e os outros exercícios com texto liberado na planilha', () => {
    const { el } = render();
    const labels = [...el.querySelectorAll('.check span')].map((s) => s.textContent?.trim());
    expect(labels).toContain('Posição de repouso da língua');
    expect(labels).toContain('Respiração diafragmática');
    expect(labels).toHaveLength(12);
  });

  it('"Marcar os 6" marca o programa inteiro, na ordem, e o padrão é 2 sessões e 3 lembretes', () => {
    const { fixture, saved, button, submit } = render();
    button('Marcar os 6').click();
    fixture.detectChanges();
    expect(button('Desmarcar os 6')).toBeTruthy();
    submit();
    expect(saved[0]).toEqual({
      exercises: ['EX-R1', 'EX-R2', 'EX-R3', 'EX-R4', 'EX-R5', 'EX-R6'],
      sessionsPerDay: 2,
      remindersPerDay: 3,
      note: '',
      validUntil: '',
    });
  });

  it('edita uma prescrição existente (mantém a ordem do catálogo)', () => {
    const fixture = TestBed.createComponent(PrescriptionEditor);
    const saved: PrescriptionDraft[] = [];
    fixture.componentInstance.saved.subscribe((draft) => saved.push(draft));
    fixture.componentRef.setInput('initial', {
      exercises: ['EX-02'],
      sessionsPerDay: 4,
      remindersPerDay: 5,
      note: ' Devagar. ',
      validUntil: '2026-12-31',
    });
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const first = el.querySelector<HTMLInputElement>('.check input')!;
    first.click();
    fixture.detectChanges();
    el.querySelector('form')!.dispatchEvent(new Event('submit'));
    expect(saved[0]).toMatchObject({
      exercises: ['EX-R1', 'EX-02'],
      sessionsPerDay: 4,
      remindersPerDay: 5,
      note: 'Devagar.',
    });
    expect(el.textContent).toContain('Salvar alterações');
  });
});
