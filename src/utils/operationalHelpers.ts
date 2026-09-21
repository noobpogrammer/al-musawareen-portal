import { SharafAllocation, SharafEventDef, MiqaatDef, Zone, Topic } from '../types';

export function mapSharafAllocationFromDb(raw: any): SharafAllocation {
  return {
    id: raw.id,
    itsNumber: raw.its_number,
    eventType: raw.event_type,
    location: raw.location || '',
    zone: raw.zone || undefined,
    date: raw.date || undefined,
    fromTime: raw.from_time || undefined,
    toTime: raw.to_time || undefined,
    dataCopyingDeadlineDate: raw.data_copying_deadline_date || undefined,
    dataCopyingDeadlineTime: raw.data_copying_deadline_time || undefined,
  };
}

export function mapSharafAllocationToDb(alloc: Omit<SharafAllocation, 'id'> | SharafAllocation): Record<string, any> {
  return {
    its_number: alloc.itsNumber.trim(),
    event_type: alloc.eventType.trim(),
    location: alloc.location?.trim() || '',
    zone: alloc.zone?.trim() || null,
    date: alloc.date || null,
    from_time: alloc.fromTime?.trim() || null,
    to_time: alloc.toTime?.trim() || null,
    data_copying_deadline_date: alloc.dataCopyingDeadlineDate?.trim() || alloc.date || null,
    data_copying_deadline_time: alloc.dataCopyingDeadlineTime?.trim() || null,
  };
}

export function mapSharafEventFromDb(raw: any): SharafEventDef {
  return {
    id: raw.id,
    name: raw.name,
    isDefault: Boolean(raw.is_default),
  };
}

export function mapMiqaatFromDb(raw: any): MiqaatDef {
  return {
    id: raw.id,
    name: raw.name,
  };
}

export function mapZoneFromDb(raw: any): Zone {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description || '',
  };
}

export function mapTopicFromDb(raw: any): Topic {
  return {
    id: raw.id,
    name: raw.name,
    category: raw.category || 'Touch Point',
  };
}
