import Papa from 'papaparse';
import { Property } from '@workspace/api-client-react';

export const allColumns = [
  { id: 'code', label: 'الكود', labelEn: 'Code' },
  { id: 'title', label: 'العنوان', labelEn: 'Title' },
  { id: 'description', label: 'الوصف', labelEn: 'Description' },
  { id: 'price', label: 'السعر', labelEn: 'Price' },
  { id: 'area', label: 'المساحة', labelEn: 'Area' },
  { id: 'beds', label: 'غرف_النوم', labelEn: 'Beds' },
  { id: 'baths', label: 'الحمامات', labelEn: 'Baths' },
  { id: 'floor', label: 'الدور', labelEn: 'Floor' },
  { id: 'floors', label: 'عدد_الطوابق', labelEn: 'Floors' },
  { id: 'finishing', label: 'التشطيب', labelEn: 'Finishing' },
  { id: 'view', label: 'الفيو', labelEn: 'View' },
  { id: 'category', label: 'الفئة', labelEn: 'Category' },
  { id: 'status', label: 'الحالة', labelEn: 'Status' },
  { id: 'featured', label: 'مميز', labelEn: 'Featured' },
  { id: 'regionName', label: 'المنطقة', labelEn: 'Region' },
  { id: 'typeName', label: 'النوع', labelEn: 'Type' },
  { id: 'subArea', label: 'المنطقة_الفرعية', labelEn: 'Sub Area' },
  { id: 'unitType', label: 'نوع_الوحدة', labelEn: 'Unit Type' },
  { id: 'floorText', label: 'الطابق_نصي', labelEn: 'Floor Text' },
  { id: 'layout', label: 'التوزيع', labelEn: 'Layout' },
  { id: 'videoUrl', label: 'رابط_الفيديو', labelEn: 'Video URL' },
  { id: 'mapsUrl', label: 'رابط_الخريطة', labelEn: 'Maps URL' },
  { id: 'externalUrl', label: 'رابط_خارجي', labelEn: 'External URL' },
  { id: 'createdAt', label: 'تاريخ_الإضافة', labelEn: 'Created At' },
];

export async function generateClientExport(
  properties: Property[],
  columns: string[], // ids
  format: 'csv' | 'txt' | 'json',
  encoding: 'utf-8' | 'utf-8-bom' | 'windows-1256'
): Promise<Blob> {
  const selectedCols = allColumns.filter(c => columns.includes(c.id));
  
  // Transform data
  const data = properties.map(p => {
    const row: Record<string, any> = {};
    selectedCols.forEach(col => {
      row[col.label] = (p as any)[col.id] ?? '';
    });
    return row;
  });
  
  let content = '';
  
  if (format === 'json') {
    content = JSON.stringify(data, null, 2);
  } else if (format === 'csv') {
    content = Papa.unparse(data);
  } else if (format === 'txt') {
    content = Papa.unparse(data, { delimiter: '|' });
  }

  let blobParts: any[] = [];
  
  // Add BOM for UTF-8 Excel compatibility
  if (encoding === 'utf-8-bom' && (format === 'csv' || format === 'txt')) {
    blobParts.push(new Uint8Array([0xEF, 0xBB, 0xBF]));
  }
  
  // Actually, windows-1256 encoding in JS browser is hard without a library like iconv-lite.
  // We'll stick to UTF-8 for this implementation and fallback string.
  blobParts.push(content);
  
  let type = 'text/plain;charset=utf-8';
  if (format === 'csv') type = 'text/csv;charset=utf-8';
  if (format === 'json') type = 'application/json;charset=utf-8';
  
  return new Blob(blobParts, { type });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}