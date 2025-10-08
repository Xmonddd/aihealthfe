import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

type Gender = '' | 'male' | 'female' | 'other';
type Step = 1 | 2 | 3 | 4;

interface CheckResponse {
  severity: string;
  insights: string[];
  advice: string;
  topCondition?: string;
  conditionDetails?: string;
  treatment?: string;
}

@Component({
  selector: 'app-symptoms',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './symptoms.component.html',
  styleUrls: ['./symptoms.component.scss'],
})
export class SymptomsComponent {
  // Steps: 1 = enter, 2 = details, 3 = review, 4 = results
  step: Step = 1;

  // Step 1 state
  inputText = '';
  selectedSymptoms: string[] = [];

  // Typeahead state
  filteredSuggestions: string[] = [];
  showSuggestions = false;
  activeIndex = -1;

  // Step 2 state
  age: number | null = null;
  gender: Gender = '';

  // Step 4 state (results)
  result: CheckResponse | null = null;

  // UI flags
  loading = false;
  error = '';

  // Only items present in this dataset can be searched/added
  // Replace or fetch from your backend as needed
  readonly ALL_SYMPTOMS: string[] = [
    'headache',
    'fever',
    'cough',
    'sore throat',
    'runny nose',
    'nausea',
    'vomiting',
    'diarrhea',
    'fatigue',
    'dizziness',
    'chills',
    'shortness of breath',
    'abdominal pain',
    'back pain',
    'chest pain',
    'muscle pain',
    'joint pain',
    'rash',
    
  ];

  // Step 1: Typeahead handlers
  onInputChange(value: string) {
    this.inputText = value;
    this.error = '';

    const q = value.trim().toLowerCase();
    if (!q) {
      this.filteredSuggestions = [];
      this.showSuggestions = false;
      this.activeIndex = -1;
      return;
    }

    // Filter only from existing data and not already selected
    this.filteredSuggestions = this.ALL_SYMPTOMS
      .filter(
        (s) =>
          s.toLowerCase().includes(q) &&
          !this.selectedSymptoms.includes(s)
      )
      .slice(0, 8);

    this.showSuggestions = true;
    this.activeIndex = -1;
  }

  onInputKeydown(e: KeyboardEvent) {
    if (!this.showSuggestions && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      this.showSuggestions = true;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (this.filteredSuggestions.length) {
          this.activeIndex = (this.activeIndex + 1) % this.filteredSuggestions.length;
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (this.filteredSuggestions.length) {
          this.activeIndex =
            (this.activeIndex - 1 + this.filteredSuggestions.length) %
            this.filteredSuggestions.length;
        }
        break;
      case 'Enter':
      case ',':
        e.preventDefault();
        if (this.activeIndex >= 0 && this.activeIndex < this.filteredSuggestions.length) {
          this.selectSuggestion(this.filteredSuggestions[this.activeIndex]);
        } else {
          // Only allow add if exact match exists in dataset
          this.addFromInputExact();
        }
        break;
      case 'Escape':
        this.closeSuggestions();
        break;
    }
  }

  onInputBlur() {
    // Delay so click/mousedown on suggestion still works
    setTimeout(() => this.closeSuggestions(), 150);
  }

  selectSuggestion(s: string) {
    this.addSymptom(s);
  }

  private addSymptom(s: string) {
    if (!s) return;
    const found = this.ALL_SYMPTOMS.find((x) => x.toLowerCase() === s.toLowerCase());
    if (!found) {
      this.error = 'No results';
      return;
    }
    if (!this.selectedSymptoms.includes(found)) {
      this.selectedSymptoms.push(found);
    }
    this.resetInput();
  }

  private addFromInputExact() {
    const parts = this.inputText
      .split(',')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    let added = false;
    for (const raw of parts) {
      const exact = this.ALL_SYMPTOMS.find((s) => s.toLowerCase() === raw.toLowerCase());
      if (exact && !this.selectedSymptoms.includes(exact)) {
        this.selectedSymptoms.push(exact);
        added = true;
      }
    }

    if (!added) {
      this.error = 'No results';
      this.showSuggestions = true;
      this.filteredSuggestions = [];
      return;
    }

    this.resetInput();
  }

  removeSymptom(index: number) {
    this.selectedSymptoms.splice(index, 1);
  }

  private resetInput() {
    this.inputText = '';
    this.filteredSuggestions = [];
    this.showSuggestions = false;
    this.activeIndex = -1;
    this.error = '';
  }

  private closeSuggestions() {
    this.showSuggestions = false;
    this.activeIndex = -1;
  }

  nextStep() {
    this.error = '';
    if (this.inputText.trim().length > 0) {
      // Try to add only exact matches before moving on
      this.addFromInputExact();
      if (this.error) return; // stop if nothing valid
    }
    if (this.selectedSymptoms.length === 0) {
      this.error = 'Please pick from available symptoms. No results were found for your input.';
      return;
    }
    this.step = 2;
  }

  // Step 2 handlers
  backToStep1() { this.step = 1; }
  onAgeInput(v: string) { this.age = v ? Number(v) : null; }
  onGenderChange(v: string) { this.gender = v as Gender; }
  nextFromStep2() { this.step = 3; }
  backToStep2() { this.step = 2; }

  // Labels for review
  genderLabel(): string {
    switch (this.gender) {
      case 'male': return 'Male';
      case 'female': return 'Female';
      case 'other': return 'Other';
      default: return 'Select Gender';
    }
  }

  // Call backend to analyze
  async analyze() {
    this.loading = true;
    this.error = '';
    try {
      const payload = {
        symptoms: this.selectedSymptoms,
        age: this.age ?? undefined,
        gender: this.gender || undefined,
      };

      const res = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data: CheckResponse = await res.json();
      this.result = data;
      this.step = 4;
    } catch (err: any) {
      console.error(err);
      this.error = err?.message || 'Failed to analyze. Please try again.';
    } finally {
      this.loading = false;
    }
  }

  // Extra care tips derived from severity
  careTips(): string {
    const sev = this.result?.severity?.toLowerCase() || 'low';
    if (sev === 'high') {
      return 'If symptoms are severe or worsening, call emergency services. Avoid strenuous activity.';
    }
    if (sev === 'medium') {
      return 'Get adequate rest, fluids, and consider OTC meds. Book a consultation if not improving.';
    }
    return 'Maintain hydration, rest, and observe for changes. Reassess if new symptoms appear.';
  }

  // Restart flow
  startNew() {
    this.step = 1;
    this.inputText = '';
    this.selectedSymptoms = [];
    this.age = null;
    this.gender = '';
    this.result = null;
    this.error = '';
    this.loading = false;
    this.filteredSuggestions = [];
    this.showSuggestions = false;
    this.activeIndex = -1;
  }
}