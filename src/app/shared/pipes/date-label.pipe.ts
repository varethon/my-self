import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'dateLabel', standalone: true })
export class DateLabelPipe implements PipeTransform {
  transform(value: string): string { return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(`${value}T00:00:00`)); }
}
