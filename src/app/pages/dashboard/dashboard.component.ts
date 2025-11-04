import { Component, OnInit } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AnalysisService, SymptomHistory } from '../../services/analysis.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, AsyncPipe],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  items: SymptomHistory[] = [];
  loading = true;
  error = '';
  deletingId: string | null = null;

  constructor(
    public auth: AuthService,
    private router: Router,
    private analysis: AnalysisService
  ) {}

  ngOnInit() {
    this.auth.isAuthenticated$.subscribe(isAuthed => {
      if (!isAuthed) this.router.navigateByUrl('/home');
    });
    this.refresh();
  }

  async refresh() {
    this.loading = true;
    this.error = '';
    try {
      this.items = await this.analysis.listHistory(50);
    } catch (e: any) {
      this.error = e?.message || 'Failed to load history.';
    } finally {
      this.loading = false;
    }
  }

  async remove(id: string) {
    if (!confirm('Delete this record?')) return;
    this.deletingId = id;
    try {
      await this.analysis.deleteHistory(id);
      this.items = this.items.filter(i => i.id !== id);
    } catch (e: any) {
      this.error = e?.message || 'Failed to delete item.';
    } finally {
      this.deletingId = null;
    }
  }

  displaySymptoms(sym: any): string {
    if (Array.isArray(sym)) {
      const names = sym.map((s: any) => (typeof s === 'string' ? s : (s.name ?? s.code ?? 'symptom')));
      return names.join(', ');
    }
    if (sym && typeof sym === 'object') return Object.values(sym).join(', ');
    return String(sym ?? '');
  }

  chipLabel(s: any): string {
    return typeof s === 'string' ? s : (s?.name || s?.code || 'symptom');
  }
  asSymArray(sym: any): any[] {
    if (!sym) return [];
    return Array.isArray(sym) ? sym : [sym];
  }

  // Result helpers
  resultCondition(res: any): string {
    if (!res) return '';
    if (typeof res === 'string') return res;
    return res.condition || res.topCondition || res.conditions?.[0]?.name || res.conditions?.[0] || 'Analysis';
  }
  resultDetails(res: any): string {
    if (!res || typeof res === 'string') return '';
    return res.details || res.description || res.conditionDetails || '';
  }
  resultTreatment(res: any): string {
    if (!res || typeof res === 'string') return '';
    return res.treatment || res.treatmentOption || res.recommendation || '';
  }
  resultAdvice(res: any): string {
    if (!res || typeof res === 'string') return '';
    return res.advice || res.generalAdvice || res.nextSteps || '';
  }

  // Stats
  get totalChecks(): number { return this.items.length; }
  get lastItem(): SymptomHistory | undefined { return this.items[0]; }
  get lastCondition(): string { return this.lastItem ? this.resultCondition(this.lastItem.result) : '—'; }
  get lastWhen(): string {
    return this.lastItem ? new Date(this.lastItem.created_at).toLocaleString() : '—';
  }

  private readonly symptomRemedies: Record<string, string> = {
    'headache': 'Rest in a quiet, dark room, stay hydrated, and consider OTC pain relievers if appropriate.',
    'chest pain': 'Sit upright, practice slow breathing, and seek urgent care if pain is severe or with shortness of breath.',
    'cough': 'Sip warm fluids, use throat lozenges, and add humidity to the air; see a doctor for persistent cough.',
    'fever': 'Hydrate frequently, rest, and use fever reducers as advised by a healthcare provider.',
    'sore throat': 'Gargle warm salt water, drink warm teas with honey, and avoid irritants like smoke.',
    'fatigue': 'Prioritize sleep, eat balanced meals, and pace activities with gentle movement breaks.',
    'nausea': 'Take small sips of clear liquids, eat bland foods, and avoid strong odors.',
    'dizziness': 'Sit or lie down, hydrate, and stand slowly; seek care if dizziness persists or worsens.'
  };

  remedySuggestions(sym: any): { label: string; remedy: string }[] {
    return this.asSymArray(sym)
      .slice(0, 3)
      .map(s => {
        const label = this.chipLabel(s);
        const key = label.toLowerCase();
        const remedy =
          this.symptomRemedies[key] ||
          'Rest, hydrate, and monitor symptoms. Consult a clinician if they worsen.';
        return { label, remedy };
      });
  }
}