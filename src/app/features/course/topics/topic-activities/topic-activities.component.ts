import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ActivityService } from '../../../../core/services/activity.service';
import { Activity } from '../../../../shared/models/activity.model';

@Component({
  selector: 'app-topic-activities',
  standalone: true,
  imports: [],
  templateUrl: './topic-activities.html',
  styleUrl: './topic-activities.css',
})
export class TopicActivitiesComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private actSvc = inject(ActivityService);

  collectionId = signal(0);
  topicId = signal(0);
  activities = signal<Activity[]>([]);
  loading = signal(true);
  error = signal('');

  ngOnInit() {
    this.collectionId.set(Number(this.route.snapshot.paramMap.get('collectionId')));
    this.topicId.set(Number(this.route.snapshot.paramMap.get('topicId')));
    this.load();
  }

  load() {
    this.loading.set(true);
    this.actSvc.getByTopic(this.topicId()).subscribe({
      next: (data) => { this.activities.set(data); this.loading.set(false); },
      error: () => { this.error.set('No se pudieron cargar las actividades.'); this.loading.set(false); }
    });
  }

  createActivity() {
    this.router.navigate(['/docentes/colecciones', this.collectionId(), 'temas', this.topicId(), 'crear', 'nueva']);
  }

  deleteActivity(id: number, event: Event) {
    event.stopPropagation();
    if (!confirm('¿Eliminar esta actividad?')) return;
    this.actSvc.deleteActivity(id!).subscribe({
      next: () => this.activities.update(list => list.filter(a => a.id !== id)),
      error: () => alert('Error al eliminar la actividad.')
    });
  }

  goBack() {
    this.router.navigate(['/docentes/colecciones', this.collectionId()]);
  }

  typeLabel(type: string): string {
    return type === 'QUIZ' ? '📝 Quiz' : '🗂 Flashcards';
  }

  typeClass(type: string): string {
    return type === 'QUIZ' ? 'badge-quiz' : 'badge-flash';
  }
}
