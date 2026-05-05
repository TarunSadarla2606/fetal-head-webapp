// Demo-mode scenarios for clinical report forms.
//
// Each scenario fills realistic, internally-consistent clinical data. LMP
// dates are computed from the current date so the gestational age implied
// by the LMP matches the scenario indication. Shared by single-model and
// combined-report modals.

export type DemoScenario = 'A' | 'B' | 'C';

export interface ScenarioPatientFields {
  patientName: string;
  patientId: string;
  patientDob: string;
  lmp: string;
  referringPhysician: string;
  orderingFacility: string;
  sonographerName: string;
  clinicalIndication: string;
  usApproach: 'transabdominal' | 'transvaginal';
  imageQuality: 'optimal' | 'suboptimal' | 'limited';
  fetalPresentation: 'cephalic' | 'breech' | 'transverse' | 'not_assessed';
  bpdMm: string;
  priorBiometry: string;
}

export function daysAgoIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

export function getScenarioPatient(s: DemoScenario): ScenarioPatientFields {
  switch (s) {
    case 'A': // Normal 2nd-trimester anatomy survey, ~19–20 weeks
      return {
        patientName: 'Demo Patient A',
        patientId: 'HC18-DEMO-001',
        patientDob: daysAgoIso(28 * 365 + 120), // ~28 yo
        lmp: daysAgoIso(137),                   // ~19w4d
        referringPhysician: 'Dr. Sarah Chen, OB/GYN',
        orderingFacility: 'City General Hospital',
        sonographerName: 'J. Park, RDMS',
        clinicalIndication:
          'Routine fetal anatomy survey at ~20 weeks. No prior complications.',
        usApproach: 'transabdominal',
        imageQuality: 'optimal',
        fetalPresentation: 'cephalic',
        bpdMm: '',
        priorBiometry: '',
      };
    case 'B': // LMP-size discordance, ~14–15 weeks, suspect FGR
      return {
        patientName: 'Demo Patient B',
        patientId: 'HC18-DEMO-002',
        patientDob: daysAgoIso(34 * 365 + 200),
        lmp: daysAgoIso(104),                   // ~14w6d
        referringPhysician: 'Dr. James Park, MFM',
        orderingFacility: 'University Medical Center',
        sonographerName: 'M. Garcia, RDMS',
        clinicalIndication:
          'LMP-size discordance — rule out fetal growth restriction. Repeat dating scan.',
        usApproach: 'transabdominal',
        imageQuality: 'suboptimal',
        fetalPresentation: 'cephalic',
        bpdMm: '',
        priorBiometry: '',
      };
    case 'C': // IUGR / BPD-HC mismatch, ~24 weeks
      return {
        patientName: 'Demo Patient C',
        patientId: 'HC18-DEMO-003',
        patientDob: daysAgoIso(31 * 365 + 60),
        lmp: daysAgoIso(168),                   // 24w0d
        referringPhysician: 'Dr. Maria Santos, MFM',
        orderingFacility: 'Perinatology Associates',
        sonographerName: 'K. Liu, RDMS',
        clinicalIndication:
          'Suspected IUGR — detailed biometry. HC/BPD mismatch evaluation. Doppler studies pending.',
        usApproach: 'transabdominal',
        imageQuality: 'suboptimal',
        fetalPresentation: 'cephalic',
        bpdMm: '52.0',                          // lags HC → mismatch flag
        priorBiometry: 'HC 195 mm @ ' + daysAgoIso(21) + ' (~22w 4d)',
      };
  }
}

export const SCENARIO_INFO: Record<DemoScenario, { title: string; subtitle: string }> = {
  A: { title: 'Scenario A', subtitle: 'Normal · 2nd trimester anatomy' },
  B: { title: 'Scenario B', subtitle: 'LMP discordance · suspect FGR' },
  C: { title: 'Scenario C', subtitle: 'IUGR · BPD/HC mismatch' },
};
