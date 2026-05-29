/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Student {
  id: string;
  name: string;
  code: string;
  level?: string;
  phone?: string;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  date: string;
  time: string;
  method: 'يدوي' | 'QR كاميرا';
}

export interface StudentGrade {
  id: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  type: 'امتحان' | 'واجب' | 'نشاط';
  title: string;
  score: number;
  maxScore: number;
  date: string;
}

export type TabType = 'attendance' | 'students' | 'reports';
