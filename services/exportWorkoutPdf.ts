import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Workout } from '../types';

function formatRest(seconds: number): string {
  if (seconds <= 0) return '—';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s === 0 ? `${m}min` : `${m}min${s}s`;
}

export function exportWorkoutPdf(
  programName: string,
  trainerName: string,
  workouts: Workout[],
): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 15;

  // ── Header ──────────────────────────────────────────────────────────────────
  doc.setFillColor(16, 185, 129); // emerald-500
  doc.rect(0, 0, pageW, 30, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(programName, margin, 13);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Professor: ${trainerName}`, margin, 21);
  doc.text(
    `Gerado em: ${new Date().toLocaleDateString('pt-BR')}`,
    pageW - margin,
    21,
    { align: 'right' },
  );

  let y = 38;

  // ── Days ────────────────────────────────────────────────────────────────────
  workouts.forEach((day, idx) => {
    // Check space — add page if less than 40mm left
    if (y > 250) {
      doc.addPage();
      y = 20;
    }

    // Day title bar
    doc.setFillColor(31, 41, 55); // gray-800
    doc.roundedRect(margin, y - 5, pageW - margin * 2, 12, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    const dayLabel = day.scheduledDays
      ? `${day.name}  ·  ${day.scheduledDays}`
      : day.name;
    doc.text(`${idx + 1}. ${dayLabel}`, margin + 3, y + 3);
    y += 12;

    // Day notes
    if ((day as any).notes?.trim()) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(156, 163, 175); // gray-400
      doc.text(`Obs: ${(day as any).notes.trim()}`, margin + 3, y + 4);
      y += 8;
    }

    y += 3;

    // Exercises table
    if (day.exercises.length === 0) {
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.text('Nenhum exercício.', margin + 3, y);
      y += 8;
      return;
    }

    const rows = day.exercises.map((ex, i) => [
      String(i + 1),
      ex.name,
      String(ex.sets),
      String(ex.reps),
      ex.currentWeight > 0 ? `${ex.currentWeight} kg` : '—',
      formatRest(ex.restTime ?? 0),
      ex.notes?.trim() || '—',
    ]);

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['#', 'Exercício', 'Séries', 'Reps', 'Carga', 'Descanso', 'Observação']],
      body: rows,
      styles: {
        fontSize: 8,
        cellPadding: 2.5,
        textColor: [30, 30, 30],
      },
      headStyles: {
        fillColor: [16, 185, 129],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 14, halign: 'center' },
        3: { cellWidth: 12, halign: 'center' },
        4: { cellWidth: 18, halign: 'center' },
        5: { cellWidth: 18, halign: 'center' },
        6: { cellWidth: 40 },
      },
      didDrawPage: (data) => {
        y = (data.cursor?.y ?? y) + 6;
      },
    });

    y = (doc as any).lastAutoTable.finalY + 8;
  });

  // ── Footer on all pages ──────────────────────────────────────────────────────
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(7);
    doc.setTextColor(156, 163, 175);
    doc.text(
      `GoliasFit  ·  Página ${p} de ${totalPages}`,
      pageW / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'center' },
    );
  }

  const safeName = programName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  doc.save(`${safeName}.pdf`);
}
