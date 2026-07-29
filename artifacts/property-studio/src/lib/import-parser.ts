import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { ImportedRow } from '@workspace/api-client-react';

// Maps common header names (Arabic & English) to the ImportedRow field keys
const columnMapping: Record<string, keyof ImportedRow> = {
  'الكود': 'code', 'code': 'code', 'id': 'code',
  'العنوان': 'title', 'title': 'title', 'name': 'title',
  'الوصف': 'description', 'description': 'description', 'desc': 'description',
  'السعر': 'price', 'price': 'price', 'amount': 'price',
  'المساحة': 'area', 'area': 'area', 'size': 'area',
  'غرف_النوم': 'beds', 'beds': 'beds', 'bedrooms': 'beds',
  'الحمامات': 'baths', 'baths': 'baths', 'bathrooms': 'baths',
  'الدور': 'floor', 'floor': 'floor',
  'عدد_الطوابق': 'floors', 'floors': 'floors',
  'التشطيب': 'finishing', 'finishing': 'finishing',
  'الفيو': 'view', 'view': 'view',
  'الفئة': 'category', 'category': 'category',
  'الحالة': 'status', 'status': 'status',
  'مميز': 'featured', 'featured': 'featured',
  'المنطقة': 'regionId', 'region': 'regionId', 'regionId': 'regionId', // Usually needs mapping from name to ID later
  'النوع': 'typeId', 'type': 'typeId', 'typeId': 'typeId',
  'المنطقة_الفرعية': 'subArea', 'subArea': 'subArea',
  'نوع_الوحدة': 'unitType', 'unitType': 'unitType',
  'الطابق_نصي': 'floorText', 'floorText': 'floorText',
  'التوزيع': 'layout', 'layout': 'layout',
  'رابط_الفيديو': 'videoUrl', 'videoUrl': 'videoUrl',
  'رابط_الخريطة': 'mapsUrl', 'mapsUrl': 'mapsUrl',
  'رابط_خارجي': 'externalUrl', 'externalUrl': 'externalUrl',
  'المصدر': 'source', 'source': 'source',
  'العنوان_التفصيلي': 'location', 'location': 'location',
};

const normalizeHeader = (header: string): string => {
  return header.trim().replace(/\s+/g, '_').toLowerCase();
};

const mapRow = (rawRow: Record<string, any>): Partial<ImportedRow> => {
  const mapped: Partial<ImportedRow> = {};
  
  for (const [key, value] of Object.entries(rawRow)) {
    const normalizedKey = normalizeHeader(key);
    // Find matching key in our map
    const targetField = columnMapping[key] || 
                        columnMapping[normalizedKey] || 
                        columnMapping[Object.keys(columnMapping).find(k => normalizeHeader(k) === normalizedKey) || ''];
    
    if (targetField && value !== undefined && value !== null && value !== '') {
      // Coerce types
      if (['price', 'area', 'beds', 'baths', 'floors', 'floor'].includes(targetField)) {
        const num = parseFloat(String(value).replace(/,/g, ''));
        if (!isNaN(num)) mapped[targetField] = num as any;
      } else if (targetField === 'featured') {
        const str = String(value).toLowerCase();
        mapped[targetField] = (str === 'true' || str === 'yes' || str === '1' || str === 'نعم');
      } else {
        mapped[targetField] = String(value) as any;
      }
    }
  }
  
  return mapped;
};

export async function parseFile(file: File): Promise<Partial<ImportedRow>[]> {
  return new Promise((resolve, reject) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (extension === 'json') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          const rows = Array.isArray(data) ? data : [data];
          resolve(rows.map(mapRow));
        } catch (err) {
          reject(new Error("Invalid JSON file"));
        }
      };
      reader.readAsText(file);
      return;
    }
    
    if (extension === 'csv' || extension === 'txt') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          resolve(results.data.map((row: any) => mapRow(row)));
        },
        error: (error) => {
          reject(error);
        }
      });
      return;
    }
    
    if (extension === 'xlsx' || extension === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const json = XLSX.utils.sheet_to_json(worksheet);
          resolve(json.map((row: any) => mapRow(row)));
        } catch (err) {
          reject(new Error("Failed to parse Excel file"));
        }
      };
      reader.readAsArrayBuffer(file);
      return;
    }
    
    reject(new Error("Unsupported file format"));
  });
}

export function validateRows(rows: Partial<ImportedRow>[]): { valid: ImportedRow[], errors: { index: number, row: any, issues: string[] }[] } {
  const valid: ImportedRow[] = [];
  const errors: { index: number, row: any, issues: string[] }[] = [];
  
  rows.forEach((row, index) => {
    const issues: string[] = [];
    
    if (!row.code) issues.push("Missing required field: code");
    if (row.price !== undefined && row.price < 0) issues.push("Price cannot be negative");
    if (row.area !== undefined && row.area < 0) issues.push("Area cannot be negative");
    
    if (issues.length > 0) {
      errors.push({ index, row, issues });
    } else {
      valid.push(row as ImportedRow);
    }
  });
  
  return { valid, errors };
}