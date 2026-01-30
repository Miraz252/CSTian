
import { Notice } from './types';

export const ROLL_MIN = 825788;
export const ROLL_MAX = 825895;

export const INITIAL_NOTICES: Notice[] = [
  {
    id: '1',
    title: 'Mid-Term Examination Schedule',
    content: 'The mid-term exams for the 4th semester will commence from next Monday. Please check the department board for details.',
    date: '2024-05-15T10:00:00Z',
    author: 'Admin Office'
  },
  {
    id: '2',
    title: 'New Lab Equipment Arrival',
    content: 'The new microprocessor kits have arrived in Lab 302. Students are encouraged to explore them during lab hours.',
    date: '2024-05-10T14:30:00Z',
    author: 'Prof. Ahmed'
  },
  {
    id: '3',
    title: 'Industrial Visit - Dhaka Metro Rail',
    content: 'A visit to the Dhaka Metro Rail control center is planned for Batch 23-24. Registration starts tomorrow.',
    date: '2024-05-08T09:15:00Z',
    author: 'Student Coordinator'
  }
];

export const PERFORMANCE_LEVELS = [
  { label: 'Weak', min: 0, max: 2.5, color: '#EF4444' },
  { label: 'Average', min: 2.5, max: 3.0, color: '#F59E0B' },
  { label: 'Good', min: 3.0, max: 3.5, color: '#3B82F6' },
  { label: 'Excellent', min: 3.5, max: 4.0, color: '#10B981' }
];
